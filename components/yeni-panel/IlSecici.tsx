"use client";

import type { IlOzeti } from "@/lib/yeniPanelTipleri";

/** "" = Tüm iller */
export default function IlSecici({
  iller,
  toplam,
  secili,
  onSec,
}: {
  iller: IlOzeti[];
  /** Tüm mülkler (ili girilmemiş/eşleşmeyenler dahil) */
  toplam: number;
  secili: string;
  onSec: (il: string) => void;
}) {
  if (iller.length === 0) return null;

  const secenekler = [{ il: "", etiket: "Tüm iller", sayi: toplam }, ...iller.map((i) => ({ il: i.il, etiket: i.il, sayi: i.mulkSayisi }))];

  return (
    <div role="group" aria-label="İl seçimi" className="flex items-center gap-1.5 overflow-x-auto [scrollbar-width:none]">
      {secenekler.map((s) => {
        const aktif = s.il === secili;
        return (
          <button
            key={s.il || "_tumu"}
            type="button"
            aria-pressed={aktif}
            onClick={() => onSec(s.il)}
            className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
              aktif
                ? "bg-[#17B6AE] border-[#17B6AE] text-white"
                : "bg-white border-gray-200 text-slate-600 hover:border-[#17B6AE]/50"
            }`}
          >
            {s.etiket} <span className={aktif ? "text-white/80" : "text-slate-400"}>{s.sayi}</span>
          </button>
        );
      })}
    </div>
  );
}
