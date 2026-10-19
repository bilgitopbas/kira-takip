"use client";

// Yeni panelin küçük ortak parçaları: durum renkleri, dağılım çubuğu,
// mülk tipi rozeti, para biçimi.
import { DURUM_SIRASI, type Ozet } from "@/lib/yeniPanelBina";
import type { BirimDurumu } from "@/lib/yeniPanelTipleri";

export const DURUM_ZEMIN: Record<BirimDurumu, string> = {
  odendi: "bg-emerald-600",
  bekliyor: "bg-amber-500",
  gecikmis: "bg-red-500",
  bos: "bg-slate-400",
};

export const DURUM_ROZET: Record<BirimDurumu, string> = {
  odendi: "bg-emerald-50 text-emerald-700",
  bekliyor: "bg-amber-50 text-amber-700",
  gecikmis: "bg-red-50 text-red-600",
  bos: "bg-slate-100 text-slate-500",
};

export const DURUM_SATIR: Record<BirimDurumu, string> = {
  odendi: "border-l-emerald-600",
  bekliyor: "border-l-amber-500",
  gecikmis: "border-l-red-500",
  bos: "border-l-slate-300",
};

// Klasik "Mülklerim" kartlarındaki tip etiket ve renkleriyle aynı
export const TIP_ETIKETI: Record<string, string> = {
  ARSA: "Arsa",
  AVM: "AVM",
  DEPO: "Depo",
  DEVREMULK: "Devremülk",
  FABRIKA: "Fabrika",
  KONUT: "Konut",
  OFIS: "Ofis",
};

export const TIP_STILI: Record<string, string> = {
  ARSA: "bg-amber-50 text-amber-600 border-amber-100",
  AVM: "bg-violet-50 text-violet-600 border-violet-100",
  DEPO: "bg-slate-100 text-slate-600 border-slate-200",
  DEVREMULK: "bg-rose-50 text-rose-600 border-rose-100",
  FABRIKA: "bg-orange-50 text-orange-600 border-orange-100",
  KONUT: "bg-blue-50 text-blue-600 border-blue-100",
  OFIS: "bg-indigo-50 text-indigo-600 border-indigo-100",
};

export const tl = (n: number) => `${n.toLocaleString("tr-TR", { maximumFractionDigits: 2 })} ₺`;

/** 1.250.000 → "1,25 Mn", 45.000 → "45 B" */
export function kisaTl(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toLocaleString("tr-TR", { maximumFractionDigits: 2 })} Mn ₺`;
  if (n >= 10_000) return `${Math.round(n / 1000).toLocaleString("tr-TR")} B ₺`;
  return tl(n);
}

export const isoTr = (iso: string | null) => (iso ? iso.split("-").reverse().join(".") : "—");

export function DagilimCubugu({ ozet, className = "h-1.5" }: { ozet: Ozet; className?: string }) {
  if (ozet.n === 0) return null;
  return (
    <span className={`flex w-full overflow-hidden rounded-full bg-gray-100 ${className}`} aria-hidden="true">
      {DURUM_SIRASI.map((d) =>
        ozet.sayac[d] ? <i key={d} className={DURUM_ZEMIN[d]} style={{ flex: ozet.sayac[d] }} /> : null
      )}
    </span>
  );
}

export function TipRozeti({ tip }: { tip: string | null }) {
  return (
    <span
      className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${
        tip ? TIP_STILI[tip] ?? "bg-gray-50 text-slate-500 border-gray-100" : "bg-gray-50 text-slate-400 border-gray-100"
      }`}
    >
      {tip ? TIP_ETIKETI[tip] ?? tip : "Tip Yok"}
    </span>
  );
}

export function BasHarf({ ad }: { ad: string }) {
  return (
    <span className="w-9 h-9 rounded-full bg-[#f5f2ea] border border-[#dbe3df] flex items-center justify-center flex-shrink-0" aria-hidden="true">
      <span className="text-slate-600 text-[11px] font-bold">
        {ad
          .trim()
          .split(/\s+/)
          .filter(Boolean)
          .slice(0, 2)
          .map((p) => p.charAt(0).toLocaleUpperCase("tr-TR"))
          .join("") || "?"}
      </span>
    </span>
  );
}
