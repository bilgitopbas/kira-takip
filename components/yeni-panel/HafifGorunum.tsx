"use client";

// Hafif görünüm: WebGL olmayan ya da zayıf cihazda 3D sahne yerine sade bina
// listesi. Bina kartına dokununca sağ paneldeki (telefonda alt-sayfa) bina
// paneli açılır — seçim 3D ile aynı ortak durumdan yürür.
import { ozetle, type Bina } from "@/lib/yeniPanelBina";
import { DURUM_ZEMIN, DagilimCubugu, kisaTl } from "@/components/yeni-panel/ortak";

export default function HafifGorunum({
  binalar,
  seciliAnahtar,
  neden,
  onSec,
  onYineDeAc,
}: {
  binalar: Bina[];
  seciliAnahtar: string | null;
  neden: string;
  onSec: (anahtar: string) => void;
  /** Zayıf cihazda kullanıcı 3D'yi yine de açabilir; WebGL yoksa verilmez */
  onYineDeAc?: () => void;
}) {
  return (
    <div className="absolute inset-0 overflow-y-auto overscroll-contain p-3 sm:p-4 bg-[#f5f7f6]">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <p className="text-[11px] text-slate-500">{neden}</p>
        {onYineDeAc && (
          <button type="button" onClick={onYineDeAc} className="text-[11px] font-semibold px-2.5 py-1 rounded-lg border border-gray-200 bg-white text-slate-600 hover:bg-gray-50">
            {"3D'yi yine de aç"}
          </button>
        )}
      </div>
      {binalar.length === 0 ? (
        <p className="text-sm text-slate-500 text-center py-8">Bu ilde kayıtlı mülk yok.</p>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {binalar.map((b) => {
            const o = ozetle(b.birimler);
            const secili = b.anahtar === seciliAnahtar;
            return (
              <li key={b.anahtar}>
                <button
                  type="button"
                  onClick={() => onSec(b.anahtar)}
                  aria-pressed={secili}
                  className={`w-full text-left rounded-xl border bg-white px-3 py-2.5 transition ${
                    secili ? "border-[#17B6AE] ring-2 ring-[#17B6AE]/20" : "border-gray-100 hover:border-[#17B6AE]/40"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${DURUM_ZEMIN[o.enKotu]}`} aria-hidden="true" />
                    <b className="flex-1 min-w-0 truncate text-sm text-slate-800">{b.ad}</b>
                    <span className="text-[11px] text-slate-500 tabular-nums">{o.n} birim</span>
                  </span>
                  <small className="block text-[11px] text-slate-500 mt-0.5 pl-[18px] tabular-nums">
                    {o.sayac.gecikmis ? <span className="text-red-600 font-semibold">{o.sayac.gecikmis} gecikmiş · </span> : null}%
                    {o.n ? Math.round((o.dolu / o.n) * 100) : 0} dolu · {kisaTl(o.aylikKira)}/ay
                  </small>
                  <span className="block mt-1.5 pl-[18px]">
                    <DagilimCubugu ozet={o} />
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
