"use client";

// Yeni ana sayfa (yalnız YENI_PANEL=1 ve kullanıcı tercihi "yeni" iken).
// Klasik paneldeki bileşenler (Mülk/Kiracı/Tahsilat Ekle, gecikme bandı,
// doluluk ve tip grafikleri) aynen yeniden kullanılır; yazma işlemleri onların
// mevcut uçları üzerinden yürür.
//
// Sağ panel: Bugün | Binalar | bina paneli (C aşaması). Masaüstünde yapışkan
// sütun; 1240 px ve altında bina seçilince ekranın altından açılan alt-sayfa.
// Sahnelerin asıl içeriği (harita pinleri, 3D binalar) D ve E aşamalarında.
import { useCallback, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import MulkEkleButton from "@/components/MulkEkleButton";
import KiraciEkleButton from "@/components/KiraciEkleButton";
import TahsilatEkleButton from "@/components/TahsilatEkleButton";
import OverdueDebtsBanner from "@/components/OverdueDebtsBanner";
import OccupancyChart from "@/components/OccupancyChart";
import PropertyTypeChart from "@/components/PropertyTypeChart";
import IlSecici from "@/components/yeni-panel/IlSecici";
import SahneAlani, { type SahneSekmesi } from "@/components/yeni-panel/SahneAlani";
import BugunSekmesi from "@/components/yeni-panel/BugunSekmesi";
import BinalarSekmesi from "@/components/yeni-panel/BinalarSekmesi";
import BinaPaneli from "@/components/yeni-panel/BinaPaneli";
import { binalariKur, binaSuzgectenGecer, type TipAilesi } from "@/lib/yeniPanelBina";
import type { BirimDurumu } from "@/lib/yeniPanelTipleri";
import type { Nokta } from "@/lib/haritaModeli";
import { panelGecisAdresi } from "@/lib/panelTercihi";
import { useNativeApp } from "@/lib/useNativeApp";
import type { BugunListeleri, PanelBirimi, PanelOzeti } from "@/lib/yeniPanelTipleri";

type SagSekme = "bugun" | "binalar";

const tl = (n: number) => `${n.toLocaleString("tr-TR")} ₺`;

// ≤1240 px: bina paneli alt-sayfa olur (önizleme v6 ile aynı eşik)
const DAR_EKRAN = "(max-width: 1240px)";
function darEkranAbone(cb: () => void) {
  const mq = window.matchMedia(DAR_EKRAN);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

type Secim = { bina: string; blok: string; birim: string | null } | null;

export default function YeniPanel({
  ozet,
  birimler,
  bugun,
  tarihMetni,
}: {
  ozet: PanelOzeti;
  birimler: PanelBirimi[];
  bugun: BugunListeleri;
  tarihMetni: string;
}) {
  const [sahne, setSahne] = useState<SahneSekmesi>("sehir");
  const [il, setIl] = useState("");
  const [sagSekme, setSagSekme] = useState<SagSekme>("bugun");

  // Seçili ildeki birimler ve binalar (Mülk Şehrim ızgarası = bina sayısı)
  const ilBirimleri = useMemo(() => (il ? birimler.filter((b) => b.il === il) : birimler), [birimler, il]);
  const binalar = useMemo(() => binalariKur(ilBirimleri), [ilBirimleri]);

  const router = useRouter();
  const [secim, setSecim] = useState<Secim>(null);
  const darEkran = useSyncExternalStore(darEkranAbone, () => window.matchMedia(DAR_EKRAN).matches, () => false);

  // Seçili bina il değişince ya da kayıt silinince ortadan kalkabilir
  const seciliBina = secim ? binalar.find((b) => b.anahtar === secim.bina) ?? null : null;

  // Dar ekranda listeden seçilince sahne görünür olsun (alt-sayfa altta açılır)
  const sahneRef = useRef<HTMLElement>(null);
  const sahneyeKaydir = useCallback(() => {
    if (window.matchMedia(DAR_EKRAN).matches) {
      setTimeout(() => sahneRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
    }
  }, []);
  const binaSec = useCallback(
    (anahtar: string) => {
      setSecim({ bina: anahtar, blok: "", birim: null });
      sahneyeKaydir();
    },
    [sahneyeKaydir]
  );
  const birimSec = useCallback(
    (birimId: string) => {
      const b = birimler.find((x) => x.id === birimId);
      if (!b) return;
      if (il && b.il !== il) setIl("");
      setSecim({ bina: b.bina.anahtar, blok: b.bina.blok ?? "", birim: b.id });
      sahneyeKaydir();
    },
    [birimler, il, sahneyeKaydir]
  );
  const tazele = useCallback(() => router.refresh(), [router]);

  // Haritada sürüklenerek düzeltilen konumlar — YALNIZ bu oturumda tutulur;
  // kalıcı kayıt F aşamasındaki şema ekiyle (Binalarım) yapılacak.
  const [duzeltmeler, setDuzeltmeler] = useState<Record<string, Nokta>>({});
  // Konum kartı çipleri: durum ve tip süzgeci (pin ve kümeleri süzer)
  const [durumSuzgeci, setDurumSuzgeci] = useState<BirimDurumu | "">("");
  const [tipSuzgeci, setTipSuzgeci] = useState<TipAilesi[]>([]);
  const haritaBinalari = useMemo(
    () => binalar.filter((b) => binaSuzgectenGecer(b, durumSuzgeci, tipSuzgeci)),
    [binalar, durumSuzgeci, tipSuzgeci]
  );

  // Mülk Şehrim: "Yalnız gecikmiş" çipi ve 3D seçimi (panel ve haritayla ortak durum)
  const [yalnizGecikmis, setYalnizGecikmis] = useState(false);
  const secim3d = useMemo(
    () => ({ bina: seciliBina?.anahtar ?? null, blok: secim?.blok || null, birim: secim?.birim ?? null }),
    [seciliBina, secim]
  );
  const sec3d = useCallback(
    (bina: string | null, birim: string | null, blok: string | null) => {
      if (!bina) {
        setSecim(null);
        return;
      }
      const birimBlogu = birim ? birimler.find((b) => b.id === birim)?.bina.blok ?? null : null;
      setSecim({ bina, blok: blok ?? birimBlogu ?? "", birim });
    },
    [birimler]
  );

  // Kayıtlı binanın sürüklenen konumunu kaydet (Binalarım şeması gerekir)
  const konumKaydet = useCallback(
    async (anahtar: string): Promise<string | null> => {
      const bina = binalar.find((b) => b.anahtar === anahtar);
      const nokta = duzeltmeler[anahtar];
      if (!bina?.binaId || !nokta) return "Önce binayı Binalarım ekranında kaydedin.";
      const res = await fetch(`/api/dashboard/binalar/${bina.binaId}/konum`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lat: nokta[1], lng: nokta[0] }),
      }).catch(() => null);
      if (!res || !res.ok) return "Kaydedilemedi.";
      setDuzeltmeler((d) => {
        const kopya = { ...d };
        delete kopya[anahtar];
        return kopya;
      });
      tazele();
      return "Kaydedildi.";
    },
    [binalar, duzeltmeler, tazele]
  );

  const konumDuzelt = useCallback((anahtar: string, nokta: Nokta) => setDuzeltmeler((d) => ({ ...d, [anahtar]: nokta })), []);
  const altSayfa = !!seciliBina && darEkran;
  // Mobil uygulamada alt sekme çubuğu (≈60 px + güvenli alan) alt-sayfanın altında kalmasın
  const nativeApp = useNativeApp();

  const birincil = "inline-flex bg-[#17B6AE] hover:bg-[#149891] text-white font-semibold px-4 py-2.5 rounded-xl transition text-sm";
  const ikincil = "inline-flex bg-white hover:bg-gray-50 text-slate-700 font-semibold px-4 py-2.5 rounded-xl transition text-sm border border-gray-200";

  const kpiler = [
    { etiket: "Toplam Mülk", deger: `${ozet.mulkSayisi}`, alt: `${ozet.doluSayisi} dolu · ${ozet.bosSayisi} boş` },
    { etiket: "Toplam Kiracı", deger: `${ozet.kiraciSayisi}`, alt: ozet.mulkSayisi ? `Doluluk %${Math.round((ozet.doluSayisi / ozet.mulkSayisi) * 100)}` : "—" },
    { etiket: "Bu Ay Tahsilat", deger: tl(ozet.buAyTahsilat), alt: ozet.tahsilatOrani === null ? "Bu ay borç yok" : `%${ozet.tahsilatOrani} tahsilat`, oran: ozet.tahsilatOrani },
    { etiket: "Bu Yıl Kira Geliri", deger: tl(ozet.buYilTahsilat), alt: "Ocak'tan bugüne" },
  ];

  return (
    <div>
      <div className="mb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Ana Sayfa</h1>
          <p className="text-sm text-slate-500 mt-1">
            {tarihMetni} ·{" "}
            <a href={panelGecisAdresi("klasik")} className="font-semibold text-[#0a7c76] hover:underline">
              Klasik panele dön
            </a>
          </p>
        </div>
        <div className="grid grid-cols-3 sm:flex sm:items-center gap-2">
          <MulkEkleButton className={`${ikincil} justify-center px-2 sm:px-4`} />
          <KiraciEkleButton className={`${ikincil} justify-center px-2 sm:px-4`} />
          <TahsilatEkleButton className={`${birincil} justify-center px-2 sm:px-4`} />
        </div>
      </div>

      <OverdueDebtsBanner count={ozet.gecikmisSayisi} amount={ozet.gecikmisTutar} list={ozet.gecikenler} />

      <section aria-label="Özet" className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-5">
        {kpiler.map((k) => (
          <div key={k.etiket} className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 shadow-sm">
            <p className="text-xs font-medium text-slate-500 mb-1">{k.etiket}</p>
            <p className="text-lg sm:text-2xl font-bold text-slate-900 tabular-nums">{k.deger}</p>
            <p className="text-[11px] text-slate-400 mt-1">{k.alt}</p>
            {k.oran !== undefined && k.oran !== null && (
              <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-[#17B6AE] rounded-full" style={{ width: `${k.oran}%` }} />
              </div>
            )}
          </div>
        ))}
      </section>

      {ozet.mulkSayisi > 0 && (
        <section aria-label="Doluluk ve mülk tipi dağılımı" className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="text-sm font-bold text-slate-800 mb-3">Mülk Doluluk Oranı</h2>
            <OccupancyChart occupied={ozet.doluSayisi} vacant={ozet.bosSayisi} />
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="text-sm font-bold text-slate-800 mb-3">Mülk Tipi Dağılımı</h2>
            <PropertyTypeChart data={ozet.mulkTipleri} />
          </div>
        </section>
      )}

      <div className="flex flex-col lg:flex-row lg:items-center gap-3 mb-3">
        <div role="tablist" aria-label="Görünüm" className="inline-flex bg-white border border-gray-200 rounded-xl p-1 self-start">
          {(
            [
              ["sehir", "Mülk Şehrim", "3D"],
              ["konum", "Konum", null],
            ] as const
          ).map(([deger, etiket, rozet]) => (
            <button
              key={deger}
              type="button"
              role="tab"
              aria-selected={sahne === deger}
              onClick={() => setSahne(deger)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                sahne === deger ? "bg-[#17B6AE] text-white" : "text-slate-600 hover:bg-gray-50"
              }`}
            >
              {etiket}
              {rozet && <span className={`ml-1.5 text-[10px] font-bold ${sahne === deger ? "text-white/80" : "text-[#0a7c76]"}`}>{rozet}</span>}
            </button>
          ))}
        </div>
        <div className="min-w-0 lg:ml-auto">
          <IlSecici
            iller={ozet.iller}
            toplam={ozet.mulkSayisi}
            secili={il}
            onSec={(yeni) => {
              setIl(yeni);
              setSecim(null);
            }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 min-[1241px]:grid-cols-[minmax(0,1fr)_380px] gap-4 items-start">
        <section ref={sahneRef} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden scroll-mt-4">
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 px-5 pt-4 pb-3 border-b border-gray-100">
            <h2 className="text-sm font-bold text-slate-800">
              {sahne === "sehir" ? "Mülk Şehrim" : "Portföy Haritası"} · {il || "Tüm iller"}
            </h2>
            {sahne === "sehir" && (
              <button
                type="button"
                aria-pressed={yalnizGecikmis}
                onClick={() => setYalnizGecikmis((v) => !v)}
                title="Gecikmiş birimi olmayan binaları soluklaştır"
                className={`ml-auto inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold transition ${
                  yalnizGecikmis ? "bg-red-600 border-red-600 text-white" : "bg-white border-gray-200 text-slate-600 hover:border-red-300"
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${yalnizGecikmis ? "bg-white" : "bg-red-500"}`} aria-hidden="true" />
                Yalnız gecikmiş
              </button>
            )}
            {sahne === "konum" && (
              <div role="group" aria-label="Harita süzgeçleri" className="w-full flex flex-wrap items-center gap-1.5 pt-2">
                {(
                  [
                    ["", "Tümü", null],
                    ["gecikmis", "Gecikmiş", "bg-red-500"],
                    ["bekliyor", "Bekliyor", "bg-amber-500"],
                    ["odendi", "Ödendi", "bg-emerald-600"],
                    ["bos", "Boş", "bg-slate-400"],
                  ] as const
                ).map(([deger, etiket, renk]) => (
                  <button
                    key={deger || "_tumu"}
                    type="button"
                    aria-pressed={durumSuzgeci === deger}
                    onClick={() => setDurumSuzgeci(deger)}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold transition ${
                      durumSuzgeci === deger ? "bg-slate-800 border-slate-800 text-white" : "bg-white border-gray-200 text-slate-600 hover:border-slate-400"
                    }`}
                  >
                    {renk && <span className={`w-2 h-2 rounded-full ${renk}`} aria-hidden="true" />}
                    {etiket}
                  </button>
                ))}
                <span className="w-px h-4 bg-gray-200 mx-1" aria-hidden="true" />
                {(
                  [
                    ["ofis", "Ofis"],
                    ["konut", "Konut"],
                    ["fabrika", "Fabrika"],
                    ["avm", "AVM"],
                  ] as const
                ).map(([deger, etiket]) => {
                  const acik = tipSuzgeci.includes(deger);
                  return (
                    <button
                      key={deger}
                      type="button"
                      aria-pressed={acik}
                      onClick={() => setTipSuzgeci((t) => (acik ? t.filter((x) => x !== deger) : [...t, deger]))}
                      className={`rounded-full border px-2.5 py-1 text-xs font-semibold transition ${
                        acik ? "bg-[#17B6AE] border-[#17B6AE] text-white" : "bg-white border-gray-200 text-slate-600 hover:border-[#17B6AE]/50"
                      }`}
                    >
                      {etiket}
                    </button>
                  );
                })}
                {haritaBinalari.length < binalar.length && (
                  <span className="text-[11px] text-slate-500 ml-1 tabular-nums">
                    {haritaBinalari.length}/{binalar.length} bina
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="relative h-[52vh] min-h-[320px] max-h-[640px] bg-[#eef1ea]">
            <SahneAlani
              sekme={sahne}
              binalar={binalar}
              haritaBinalari={haritaBinalari}
              il={il}
              seciliAnahtar={seciliBina?.anahtar ?? null}
              duzeltmeler={duzeltmeler}
              secim3d={secim3d}
              yalnizGecikmis={yalnizGecikmis}
              onSec3d={sec3d}
              onSec={binaSec}
              onKonumDuzelt={konumDuzelt}
              onKonumKaydet={konumKaydet}
            />
          </div>
          {sahne === "sehir" && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3 border-t border-gray-100 text-[11px] text-slate-500">
              <span>Her pencere bir birim:</span>
              <Lejant renk="bg-emerald-600" etiket="Ödendi" />
              <Lejant renk="bg-amber-500" etiket="Bekliyor" />
              <Lejant renk="bg-red-500" etiket="Gecikmiş" />
              <Lejant renk="bg-slate-400" etiket="Boş" />
            </div>
          )}
        </section>

        <aside
          aria-label="Bugün, binalar ve bina paneli"
          style={altSayfa && nativeApp ? { bottom: "calc(3.75rem + env(safe-area-inset-bottom))", maxHeight: "62vh" } : undefined}
          className={
            altSayfa
              ? "fixed inset-x-0 bottom-0 lg:left-64 z-30 max-h-[70vh] overflow-y-auto overscroll-contain bg-white rounded-t-2xl border border-gray-100 shadow-[0_-10px_34px_rgba(6,33,31,0.24)]"
              : "bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden min-[1241px]:sticky min-[1241px]:top-0 min-[1241px]:max-h-[calc(100dvh-2rem)] min-[1241px]:overflow-y-auto overscroll-contain"
          }
        >
          {altSayfa && <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-gray-200" aria-hidden="true" />}
          {seciliBina && secim ? (
            <BinaPaneli
              key={seciliBina.anahtar}
              bina={seciliBina}
              blok={secim.blok}
              seciliBirimId={secim.birim}
              sahne={sahne}
              konumDurumu={!seciliBina.il ? "yok" : duzeltmeler[seciliBina.anahtar] ? "duzeltildi" : "dogrulanmadi"}
              onBlok={(blok) => setSecim({ ...secim, blok, birim: null })}
              onBirim={(birim) => setSecim({ ...secim, birim })}
              onKapat={() => setSecim(null)}
              onSahneDegistir={() => setSahne(sahne === "konum" ? "sehir" : "konum")}
              onDegisti={tazele}
            />
          ) : (
            <>
              <div role="tablist" aria-label="Sağ panel" className="flex border-b border-gray-100">
                {(
                  [
                    ["bugun", "Bugün", null],
                    ["binalar", "Binalar", binalar.length],
                  ] as const
                ).map(([deger, etiket, sayi]) => (
                  <button
                    key={deger}
                    type="button"
                    role="tab"
                    aria-selected={sagSekme === deger}
                    onClick={() => setSagSekme(deger)}
                    className={`flex-1 py-3 text-sm font-semibold border-b-2 transition ${
                      sagSekme === deger ? "border-[#17B6AE] text-slate-900" : "border-transparent text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    {etiket}
                    {sayi !== null && <span className="ml-1.5 text-[11px] font-bold text-slate-400 tabular-nums">{sayi}</span>}
                  </button>
                ))}
              </div>
              {sagSekme === "bugun" ? (
                <BugunSekmesi bugun={bugun} birimler={ilBirimleri} tarihMetni={tarihMetni} onBirim={birimSec} />
              ) : (
                <BinalarSekmesi binalar={binalar} il={il} onSec={binaSec} />
              )}
            </>
          )}
        </aside>
      </div>
      {altSayfa && <div className="h-[70vh]" aria-hidden="true" />}
    </div>
  );
}

function Lejant({ renk, etiket }: { renk: string; etiket: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`w-2.5 h-2.5 rounded-sm ${renk}`} aria-hidden="true" />
      {etiket}
    </span>
  );
}
