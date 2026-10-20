"use client";

// Bina 3D görünümü seçimi: Mülk formunda görsel kartlar, bina panelinde menü.
import { GORUNUMLER, type Gorunum } from "@/lib/binaGorunumu";

const CIZGI = "fill-none stroke-current stroke-[1.6] [stroke-linejoin:round] [stroke-linecap:round]";

/** Her görünüm için küçük çizim (24×24) */
export function GorunumIkonu({ gorunum, className = "w-7 h-7" }: { gorunum: Gorunum | null; className?: string }) {
  const p = (() => {
    switch (gorunum) {
      case "villa":
        return (
          <>
            <path d="M3 12 9 7l6 5" />
            <path d="M4.5 11v7h9v-7" />
            <path d="M15 18h6M18.5 18v-3.2a2 2 0 1 0-1 0" />
          </>
        );
      case "mustakil":
        return (
          <>
            <path d="M5 12 12 6l7 6" />
            <path d="M7 11v7h10v-7M11 18v-3h2v3" />
          </>
        );
      case "apt":
        return (
          <>
            <rect x="7" y="3.5" width="10" height="15" rx="0.6" />
            <path d="M9.5 6.5h1M13.5 6.5h1M9.5 9.5h1M13.5 9.5h1M9.5 12.5h1M13.5 12.5h1M11 18.5v-3h2v3" />
          </>
        );
      case "ofis":
        return (
          <>
            <rect x="5" y="8" width="14" height="10.5" rx="0.6" />
            <path d="M7.5 5.5h9v2.5h-9zM8 11h2M14 11h2M8 14h2M14 14h2" />
          </>
        );
      case "plaza":
        return (
          <>
            <path d="M5 18.5V6l4.5-2.5v15M14 18.5V8.5l5 2.5v7.5" />
            <path d="M7 8h1M7 11h1M7 14h1M16 12h1M16 15h1M3.5 18.5h17" />
          </>
        );
      case "avm":
        return (
          <>
            <rect x="3" y="9" width="18" height="9.5" rx="0.6" />
            <path d="M3 12h18M8 18.5v-3.5h8v3.5M6 6.5h12" />
          </>
        );
      case "fabrika":
        return (
          <>
            <path d="M3.5 18.5v-7l4 2.5v-2.5l4 2.5v-2.5l4 2.5v-7h3v12z" />
            <path d="M16.5 5c.5-1 1.5-1.5 2.5-1" />
          </>
        );
      case "arsa":
        return (
          <>
            <path d="M4 17.5 8 9.5h10l2.5 8z" strokeDasharray="2 2" />
            <path d="M12 13.5V8.5l3 1-3 1" />
          </>
        );
      default:
        return (
          <>
            <path d="M12 3.5 13.6 8 18 9.6l-4.4 1.6L12 15.7l-1.6-4.5L6 9.6 10.4 8z" />
            <path d="M18 15.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z" />
          </>
        );
    }
  })();
  return (
    <svg viewBox="0 0 24 24" className={`${className} ${CIZGI}`} aria-hidden="true">
      {p}
    </svg>
  );
}

/** Mülk formu: "Otomatik" + 8 görünüm, küçük görsel kartlar */
export function GorunumKartlari({ deger, onDegis }: { deger: Gorunum | null; onDegis: (g: Gorunum | null) => void }) {
  const secenekler: { deger: Gorunum | null; ad: string; aciklama: string }[] = [
    { deger: null, ad: "Otomatik", aciklama: "Mülk tipi ve birim sayısından" },
    ...GORUNUMLER,
  ];
  return (
    <div role="radiogroup" aria-label="Binanın 3D görünümü" className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
      {secenekler.map((s) => {
        const secili = deger === s.deger;
        return (
          <button
            key={s.deger ?? "otomatik"}
            type="button"
            role="radio"
            aria-checked={secili}
            title={s.aciklama}
            onClick={() => onDegis(s.deger)}
            className={`flex flex-col items-center gap-0.5 rounded-xl border px-1 py-1.5 text-[10.5px] font-semibold leading-tight text-center transition ${
              secili ? "border-[#17B6AE] bg-[#17B6AE]/10 text-[#0a7c76] ring-1 ring-[#17B6AE]" : "border-gray-200 bg-white text-slate-600 hover:border-[#17B6AE]/60"
            }`}
          >
            <GorunumIkonu gorunum={s.deger} className="w-7 h-7" />
            {s.ad}
          </button>
        );
      })}
    </div>
  );
}
