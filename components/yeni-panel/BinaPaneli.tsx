"use client";

// Bina paneli (önizleme v6): başlık, blok sekmeleri, özet sayılar, durum
// dağılımı ve daire no + kiracı + aylık kira düz listesi (arama + sıralama).
// Seçili birimin satırı genişleyip birim kartını gösterir.
import { useMemo, useState } from "react";
import Link from "next/link";
import BirimKarti from "@/components/yeni-panel/BirimKarti";
import {
  birimEslesir,
  birimleriSirala,
  durumMetni,
  ozetle,
  type Bina,
  type BirimSiralama,
} from "@/lib/yeniPanelBina";
import type { PanelBirimi } from "@/lib/yeniPanelTipleri";
import { DURUM_YAZI, DURUM_ZEMIN, DURUM_ZEMIN_ACIK, DagilimCubugu, TIP_ETIKETI, TipIkonu, kisaTl, tl } from "@/components/yeni-panel/ortak";
import { sehirBinasi } from "@/lib/sehir3dModeli";

const SIRALAMA_IPUCU: Record<BirimSiralama, string> = { no: "numara sırasıyla", gec: "gecikmiş önce", kira: "kiraya göre" };

function birimKisaAdi(b: PanelBirimi) {
  // Bloklar ayrı başlıklarla gruplandığı için yalnız daire no (v6 gibi)
  if (b.bina.birimNo) return b.bina.birimNo;
  return b.title;
}

export default function BinaPaneli({
  bina,
  blok,
  seciliBirimId,
  sahne,
  konumDurumu,
  onBlok,
  onBirim,
  onKapat,
  onSahneDegistir,
  onDegisti,
}: {
  bina: Bina;
  /** "" = Tümü */
  blok: string;
  seciliBirimId: string | null;
  sahne: "sehir" | "konum";
  /** Haritadaki konumun durumu (kayıtlı koordinat F aşamasında gelecek) */
  konumDurumu: "dogrulanmadi" | "duzeltildi" | "yok";
  onBlok: (blok: string) => void;
  onBirim: (id: string | null) => void;
  onKapat: () => void;
  onSahneDegistir: () => void;
  onDegisti: () => void;
}) {
  const [sorgu, setSorgu] = useState("");
  const [siralama, setSiralama] = useState<BirimSiralama>("no");

  const cokBlok = bina.bloklar.length > 0;
  const gorunen = useMemo(() => {
    if (!cokBlok || !blok) return bina.birimler;
    return bina.bloklar.find((b) => b.ad === blok)?.birimler ?? [];
  }, [bina, blok, cokBlok]);
  const ozet = useMemo(() => ozetle(gorunen), [gorunen]);

  // Blok seçili değilse ve birden çok blok varsa liste blok blok gruplanır
  const gruplar = useMemo(() => {
    const filtre = (liste: PanelBirimi[]) => birimleriSirala(liste.filter((b) => birimEslesir(b, sorgu)), siralama);
    if (cokBlok && !blok) {
      const g = bina.bloklar.map((b) => ({ ad: `${b.ad} Blok`, birimler: filtre(b.birimler), ozet: ozetle(b.birimler) }));
      if (bina.bloksuz.length) g.push({ ad: "Bloksuz", birimler: filtre(bina.bloksuz), ozet: ozetle(bina.bloksuz) });
      return g;
    }
    return [{ ad: "", birimler: filtre(gorunen), ozet }];
  }, [bina, blok, cokBlok, gorunen, ozet, sorgu, siralama]);

  const bulunanVar = gruplar.some((g) => g.birimler.length > 0);
  // Kat sayısı 3D modelle aynı hesaptan (ızgara/kule)
  const katSayisi = useMemo(() => Math.max(1, sehirBinasi(bina).katlar), [bina]);
  const tip = bina.tip ? TIP_ETIKETI[bina.tip] ?? bina.tip : "Mülk";

  return (
    <div className="p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <TipIkonu tip={bina.tip} durum={ozet.enKotu} boyut={36} />
        <div className="min-w-0 flex-1">
          <p className="text-[10.5px] font-bold uppercase tracking-wider text-slate-500 flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
            <span>
              {tip} · {bina.il ?? "İl girilmemiş"}
              {bina.ilce ? ` / ${bina.ilce}` : ""}
              {cokBlok ? ` · ${bina.bloklar.length} blok` : ""}
            </span>
            <span
              className="normal-case tracking-normal text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700"
              title={
                konumDurumu === "yok"
                  ? "İl girilmediği için haritada gösterilemiyor"
                  : konumDurumu === "duzeltildi"
                    ? "Konum bu oturumda haritada düzeltildi; kalıcı kayıt Binalarım ekranında"
                    : "Konum ilçe/il merkezinden türetildi; haritada pini sürükleyerek düzeltin"
              }
            >
              {konumDurumu === "yok" ? "konum yok" : konumDurumu === "duzeltildi" ? "konum düzeltildi · kaydedilmedi" : "konum doğrulanmadı"}
            </span>
            {bina.kontrolGerekli && (
              <span className="normal-case tracking-normal text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700" title="Blok, '2A' gibi bir yazımdan tahmin edildi; Binalarım ekranında kontrol edin">
                eşleme kontrol edilmeli
              </span>
            )}
          </p>
          <h2 className="text-xl font-bold text-slate-900 leading-tight mt-0.5">
            {bina.ad}
            {cokBlok && blok ? ` · ${blok} Blok` : ""}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{bina.adres}</p>
        </div>
        <button type="button" onClick={onKapat} aria-label="Bina panelini kapat" className="w-8 h-8 -mr-1 rounded-lg text-slate-400 hover:bg-gray-100 hover:text-slate-600 text-lg leading-none">
          ×
        </button>
      </div>

      {cokBlok && (
        <div role="tablist" aria-label="Blok seçimi" className="flex gap-1 mt-4 rounded-xl border border-gray-200 bg-[#f5f2ea] p-1">
          {[...bina.bloklar.map((b) => ({ ad: b.ad, etiket: b.ad, o: ozetle(b.birimler) })), { ad: "", etiket: "Tümü", o: ozetle(bina.birimler) }].map((b) => (
            <button
              key={b.ad || "_tumu"}
              type="button"
              role="tab"
              aria-selected={blok === b.ad}
              onClick={() => onBlok(b.ad)}
              title={`${b.etiket}: ${b.o.n} birim, ${b.o.sayac.gecikmis} gecikmiş`}
              className={`flex-1 inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-2 py-1.5 text-xs font-semibold transition ${
                blok === b.ad ? (b.ad ? "bg-white text-slate-900 shadow-sm" : "bg-[#06211f] text-white") : "text-slate-600 hover:bg-white/60"
              }`}
            >
              {b.o.sayac.gecikmis > 0 && <i className="w-1.5 h-1.5 rounded-full bg-red-500" aria-hidden="true" />}
              {b.ad ? `${b.etiket} Blok` : b.etiket}
              <small className={`text-[10.5px] font-bold px-1.5 rounded-md ${blok === b.ad && !b.ad ? "bg-white/15 text-white" : "bg-gray-100 text-slate-500"}`}>{b.o.n}</small>
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-1.5 mt-3">
        {(
          [cokBlok ? ["Blok", bina.bloklar.length] : null, ["Kat", katSayisi], ["Birim", ozet.n]].filter(Boolean) as [string, number][]
        ).map(([e, v]) => (
          <span key={e} className="text-[10.5px] font-bold uppercase tracking-wider px-2 py-1 rounded-md bg-[#f5f2ea] border border-[#dbe3df] text-slate-500">
            {e} <b className="text-slate-800">{v}</b>
          </span>
        ))}
      </div>

      <dl className="grid grid-cols-2 gap-px mt-3 rounded-xl border border-gray-100 bg-gray-100 overflow-hidden">
        {[
          ["Birim sayısı", `${ozet.n}`, ""],
          ["Doluluk", ozet.n ? `%${Math.round((ozet.dolu / ozet.n) * 100)}` : "—", `${ozet.dolu}/${ozet.n}`],
          ["Aylık kira toplamı", tl(ozet.aylikKira), ""],
          ["Gecikmiş toplam", tl(ozet.gecikmisBorc), ""],
        ].map(([etiket, deger, alt]) => (
          <div key={etiket} className="bg-white px-3 py-2">
            <dt className="text-[10.5px] font-bold uppercase tracking-wider text-slate-500">{etiket}</dt>
            <dd className={`text-base font-bold tabular-nums ${etiket === "Gecikmiş toplam" && ozet.gecikmisBorc > 0 ? "text-red-600" : "text-slate-900"}`}>
              {deger} {alt && <small className="text-[11px] font-medium text-slate-400">{alt}</small>}
            </dd>
          </div>
        ))}
      </dl>

      {!bina.tekBirim && (
        <>
          <div className="mt-3">
            <DagilimCubugu ozet={ozet} className="h-2" />
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-[11px] text-slate-500 tabular-nums">
            {(
              [
                ["odendi", "ödendi"],
                ["bekliyor", "bekliyor"],
                ["gecikmis", "gecikmiş"],
                ["bos", "boş"],
              ] as const
            ).map(([d, e]) => (
              <span key={d} className="inline-flex items-center gap-1">
                <i className={`w-2 h-2 rounded-full ${DURUM_ZEMIN[d]}`} aria-hidden="true" />
                <b className="text-slate-700">{ozet.sayac[d]}</b> {e}
              </span>
            ))}
          </div>
        </>
      )}

      {ozet.borcKaydiYok > 0 && (
        <p className="mt-3 text-[11px] text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
          {ozet.borcKaydiYok} birimde bu ay için borç kaydı yok — borçlandırma unutulmuş olabilir.
        </p>
      )}

      <div className="flex items-baseline justify-between mt-5 mb-2">
        <h3 className="text-[11.5px] font-bold uppercase tracking-[.5px] text-slate-500">{bina.tekBirim ? "Birim" : "Birimler ve kiracılar"}</h3>
        <span className="text-[11px] text-slate-400">
          {bina.tekBirim ? "tek birimli mülk" : `${cokBlok && !blok ? "blok blok · " : ""}${SIRALAMA_IPUCU[siralama]}`}
        </span>
      </div>

      {!bina.tekBirim && (
        <div className="flex gap-2 mb-2">
          <input
            type="search"
            value={sorgu}
            onChange={(e) => setSorgu(e.target.value)}
            placeholder="Daire no ya da kiracı ara"
            aria-label="Birimlerde ara: daire no ya da kiracı"
            className="flex-1 min-w-0 rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#17B6AE]/30"
          />
          <select
            value={siralama}
            onChange={(e) => setSiralama(e.target.value as BirimSiralama)}
            aria-label="Birimleri sırala"
            className="rounded-xl border border-gray-200 px-2 py-2 text-sm bg-white"
          >
            <option value="no">No</option>
            <option value="gec">Gecikmiş önce</option>
            <option value="kira">Kira</option>
          </select>
        </div>
      )}

      {!bulunanVar ? (
        <p className="text-sm text-slate-500 py-4 text-center">“{sorgu.trim()}” ile eşleşen birim yok.</p>
      ) : (
        <div className="space-y-3">
          {gruplar.map((g) =>
            g.birimler.length === 0 ? null : (
              <div key={g.ad || "_tek"}>
                {g.ad && (
                  <p className="flex items-baseline gap-2 text-[11.5px] font-extrabold uppercase tracking-wide text-slate-700 mb-1.5">
                    {g.ad}
                    <span className="font-medium normal-case tracking-normal text-slate-400">
                      {g.ozet.n} birim · {g.ozet.sayac.gecikmis} gecikmiş
                    </span>
                  </p>
                )}
                <ul className="space-y-1.5">
                  {g.birimler.map((b) => {
                    const secili = seciliBirimId === b.id;
                    return (
                      <li key={b.id}>
                        <button
                          type="button"
                          aria-pressed={secili}
                          onClick={() => onBirim(secili ? null : b.id)}
                          className={`w-full grid grid-cols-[3rem_minmax(0,1fr)_auto] items-center gap-2 px-3 py-2 text-left rounded-xl border ${DURUM_ZEMIN_ACIK[b.durum]} ${
                            secili ? "border-[#17B6AE] ring-2 ring-[#17B6AE]/25" : "border-transparent hover:border-gray-200"
                          }`}
                        >
                          <span className="text-base font-extrabold text-slate-800 truncate tabular-nums">{bina.tekBirim ? "Tümü" : birimKisaAdi(b)}</span>
                          <span className="min-w-0">
                            <span className={`block text-sm font-semibold truncate ${b.kiraci ? "text-slate-800" : "text-slate-400"}`}>
                              {b.kiraci ? b.kiraci.fullName : "Boş · kiracı yok"}
                            </span>
                            <span className={`block text-[11px] font-semibold truncate ${DURUM_YAZI[b.durum]}`}>{durumMetni(b)}</span>
                          </span>
                          <span className="text-right text-sm font-bold tabular-nums text-slate-800">
                            {b.kiraci ? (
                              b.kiraci.monthlyRent === null ? (
                                <span className="text-[11px] font-medium text-amber-700">kira girilmemiş</span>
                              ) : (
                                tl(b.kiraci.monthlyRent)
                              )
                            ) : (
                              "—"
                            )}
                            {b.gecikmisBorc > 0 && <small className="block text-[11px] font-medium text-red-600">−{kisaTl(b.gecikmisBorc)}</small>}
                          </span>
                        </button>
                        {secili && (
                          <div className="px-0.5">
                            <BirimKarti birim={b} onKapat={() => onBirim(null)} onDegisti={onDegisti} />
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )
          )}
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <Link href="/dashboard/binalarim" className="text-xs font-semibold text-[#0a7c76] hover:underline">
          Eşlemeyi düzenle (Binalarım)
        </Link>
        <button type="button" onClick={onSahneDegistir} className="text-xs font-semibold px-3 py-2 rounded-lg border border-gray-200 text-slate-600 hover:bg-gray-50">
          {sahne === "konum" ? "Mülk Şehrim'de göster" : "Konumda göster"}
        </button>
      </div>
    </div>
  );
}
