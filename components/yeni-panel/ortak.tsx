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

const DURUM_KOYU: Record<BirimDurumu, string> = { odendi: "#1d9a60", bekliyor: "#cf900b", gecikmis: "#d23f3f", bos: "#8c9a97" };

/** Önizleme v6'daki izometrik tip ikonu (ofis/konut/fabrika/avm), durum renkli kare zeminde */
export function TipIkonu({ tip, durum, boyut = 34 }: { tip: string | null; durum: BirimDurumu; boyut?: number }) {
  const aile = tip === "OFIS" ? "ofis" : tip === "FABRIKA" || tip === "DEPO" ? "fabrika" : tip === "AVM" ? "avm" : "konut";
  return (
    <span
      className="grid place-items-center rounded-[10px] flex-none"
      style={{ width: boyut, height: boyut, background: DURUM_KOYU[durum] }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 24 24" style={{ width: boyut * 0.76, height: boyut * 0.76 }}>
        {aile === "ofis" && (
          <>
            <polygon fill="#fff" fillOpacity={0.82} points="7,5.5 12,8 12,22 7,19.5" />
            <polygon fill="#fff" fillOpacity={0.6} points="12,8 17,5.5 17,19.5 12,22" />
            <polygon fill="#fff" points="7,5.5 12,3 17,5.5 12,8" />
            <path d="M12 11.5 17 9M12 15 17 12.5M12 18.5 17 16" fill="none" stroke={DURUM_KOYU[durum]} strokeWidth={1.1} strokeLinecap="round" />
          </>
        )}
        {aile === "konut" && (
          <>
            <polygon fill="#fff" fillOpacity={0.82} points="6,19 6,12 9,8.5 12,15 12,22" />
            <polygon fill="#fff" fillOpacity={0.6} points="12,15 18,12 18,19 12,22" />
            <polygon fill="#fff" points="12,15 9,8.5 15,5.5 18,12" />
            <path d="M14.2 20.9v-3.4l1.8-.9v3.4" fill="none" stroke={DURUM_KOYU[durum]} strokeWidth={1.1} strokeLinecap="round" />
          </>
        )}
        {aile === "fabrika" && (
          <>
            <polygon fill="#fff" points="4,13 14,8 20,11 10,16" />
            <polygon fill="#fff" fillOpacity={0.82} points="5.4,4.2 7.4,5.2 7.4,13.4 5.4,12.4" />
            <polygon fill="#fff" fillOpacity={0.82} points="4,13 10,16 10,22 4,19" />
            <polygon fill="#fff" fillOpacity={0.6} points="10,22 10,13 13.3,14.4 13.3,11.4 16.7,12.7 16.7,9.7 20,11 20,17" />
          </>
        )}
        {aile === "avm" && (
          <>
            <polygon fill="#fff" points="2,12.5 13,7 22,11.5 11,17" />
            <polygon fill="#fff" fillOpacity={0.82} points="2,12.5 11,17 11,22 2,17.5" />
            <polygon fill="#fff" fillOpacity={0.6} points="11,17 22,11.5 22,16.5 11,22" />
            <path d="M2 14.3 11 18.8 22 13.3M15.5 20v-2.4l2.6-1.3v2.4" fill="none" stroke={DURUM_KOYU[durum]} strokeWidth={1.1} strokeLinecap="round" />
          </>
        )}
      </svg>
    </span>
  );
}

/** Birim satırı zemin renkleri (v6: durum tonlu zemin) */
export const DURUM_ZEMIN_ACIK: Record<BirimDurumu, string> = {
  odendi: "bg-[#e5f4ec]",
  bekliyor: "bg-[#fbf1dc]",
  gecikmis: "bg-[#fbe6e6]",
  bos: "bg-[#eef1f0]",
};
export const DURUM_YAZI: Record<BirimDurumu, string> = {
  odendi: "text-[#1d9a60]",
  bekliyor: "text-[#b07a06]",
  gecikmis: "text-[#d23f3f]",
  bos: "text-slate-500",
};
