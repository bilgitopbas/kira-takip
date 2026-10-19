"use client";

import type { IlOzeti } from "@/lib/yeniPanelTipleri";

/** "" = Tüm iller. Önizleme v6 görünümü: konum simgeli "İL" kutusu içinde çipler. */
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
    <div
      role="group"
      aria-label="İl seçimi"
      className="inline-flex max-w-full items-center gap-1 rounded-2xl border border-gray-200 bg-white p-1 shadow-sm overflow-x-auto [scrollbar-width:none]"
    >
      <span className="flex items-center gap-1 pl-2 pr-1 text-[11px] font-bold uppercase tracking-wider text-slate-500 flex-none">
        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-current stroke-2" aria-hidden="true">
          <path d="M12 21s-7-6.2-7-11.5a7 7 0 1 1 14 0C19 14.8 12 21 12 21z" />
          <circle cx="12" cy="9.5" r="2.5" />
        </svg>
        İl
      </span>
      {secenekler.map((s) => {
        const aktif = s.il === secili;
        return (
          <button
            key={s.il || "_tumu"}
            type="button"
            aria-pressed={aktif}
            onClick={() => onSec(s.il)}
            className={`flex-none inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-1.5 text-sm font-semibold transition ${
              aktif ? "bg-[#dcf3f1] text-[#0a7c76]" : "text-slate-600 hover:bg-gray-50"
            }`}
          >
            {s.etiket}
            <span className={`text-[10.5px] font-bold px-1.5 rounded-md tabular-nums ${aktif ? "bg-[#17B6AE] text-[#032220]" : "bg-gray-100 text-slate-500"}`}>
              {s.sayi}
            </span>
          </button>
        );
      })}
    </div>
  );
}
