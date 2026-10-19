"use client";

// Yeni ana sayfa (yalnız YENI_PANEL=1 ve kullanıcı tercihi "yeni" iken).
// Klasik paneldeki bileşenler (Mülk/Kiracı/Tahsilat Ekle, gecikme bandı,
// doluluk ve tip grafikleri) aynen yeniden kullanılır; yazma işlemleri onların
// mevcut uçları üzerinden yürür.
//
// A aşaması: kabuk. Sağ panelin içeriği (Bugün / Binalar / bina paneli)
// C aşamasında, sahnelerin asıl içeriği D ve E aşamalarında gelir.
import { useMemo, useState } from "react";
import MulkEkleButton from "@/components/MulkEkleButton";
import KiraciEkleButton from "@/components/KiraciEkleButton";
import TahsilatEkleButton from "@/components/TahsilatEkleButton";
import OverdueDebtsBanner from "@/components/OverdueDebtsBanner";
import OccupancyChart from "@/components/OccupancyChart";
import PropertyTypeChart from "@/components/PropertyTypeChart";
import IlSecici from "@/components/yeni-panel/IlSecici";
import SahneAlani, { type SahneSekmesi } from "@/components/yeni-panel/SahneAlani";
import { panelGecisAdresi } from "@/lib/panelTercihi";
import type { BugunListeleri, PanelBirimi, PanelOzeti } from "@/lib/yeniPanelTipleri";

type SagSekme = "bugun" | "binalar";

const tl = (n: number) => `${n.toLocaleString("tr-TR")} ₺`;

export default function YeniPanel({
  ozet,
  birimler,
  tarihMetni,
}: {
  ozet: PanelOzeti;
  birimler: PanelBirimi[];
  /** Sağ paneldeki "Bugün" sekmesi C aşamasında kullanacak */
  bugun: BugunListeleri;
  tarihMetni: string;
}) {
  const [sahne, setSahne] = useState<SahneSekmesi>("sehir");
  const [il, setIl] = useState("");
  const [sagSekme, setSagSekme] = useState<SagSekme>("bugun");

  // Seçili ildeki birimler ve binalar (Mülk Şehrim ızgarası = bina sayısı)
  const ilBirimleri = useMemo(() => (il ? birimler.filter((b) => b.il === il) : birimler), [birimler, il]);
  const binaSayisi = useMemo(() => new Set(ilBirimleri.map((b) => b.bina.anahtar)).size, [ilBirimleri]);

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
          <IlSecici iller={ozet.iller} toplam={ozet.mulkSayisi} secili={il} onSec={setIl} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-4">
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 px-5 pt-4 pb-3 border-b border-gray-100">
            <h2 className="text-sm font-bold text-slate-800">
              {sahne === "sehir" ? "Mülk Şehrim" : "Portföy Haritası"} · {il || "Tüm iller"}
            </h2>
          </div>
          <div className="relative h-[52vh] min-h-[320px] max-h-[640px] bg-[#eef1ea]">
            <SahneAlani sekme={sahne} binaSayisi={binaSayisi} />
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

        <aside aria-label="Bugün ve binalar" className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div role="tablist" aria-label="Sağ panel" className="flex border-b border-gray-100">
            {(
              [
                ["bugun", "Bugün"],
                ["binalar", "Binalar"],
              ] as const
            ).map(([deger, etiket]) => (
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
              </button>
            ))}
          </div>
          <div className="p-5 text-sm text-slate-500">
            {sagSekme === "bugun"
              ? "Vadesi gelenler, gecikenler, sözleşme yenilemeleri ve kira artış tarihleri burada listelenecek."
              : "Binalar, bloklar ve daireler burada listelenecek."}
          </div>
        </aside>
      </div>
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
