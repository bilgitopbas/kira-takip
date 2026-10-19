"use client";

// "Mülk Doluluk Oranı" ve "Mülk Tipi Dağılımı" kartları — önizleme v6 görünümü
// (halka + çubuklar). Veri: seçili ildeki birimler (klasik paneldeki
// widget'larla aynı kaynak: mülk sayısı, dolu/boş, mülk tipi).
import type { PanelBirimi } from "@/lib/yeniPanelTipleri";

const TIP: Record<string, { ad: string; renk: string }> = {
  OFIS: { ad: "Ofis", renk: "#2f66cf" },
  KONUT: { ad: "Konut", renk: "#7449c2" },
  AVM: { ad: "AVM", renk: "#bd3a74" },
  FABRIKA: { ad: "Fabrika", renk: "#c9680f" },
  DEPO: { ad: "Depo", renk: "#8a6d3b" },
  ARSA: { ad: "Arsa", renk: "#6e8a3a" },
  DEVREMULK: { ad: "Devremülk", renk: "#1f8a8a" },
};
const BELIRSIZ = { ad: "Belirtilmemiş", renk: "#94a3b8" };

export default function DolulukTipKartlari({ birimler, binaSayisi, ilEtiketi }: { birimler: PanelBirimi[]; binaSayisi: number; ilEtiketi: string }) {
  const n = birimler.length;
  const dolu = birimler.filter((b) => b.isOccupied).length;
  const yuzde = Math.round((dolu / Math.max(1, n)) * 100);
  const sayac = new Map<string, number>();
  for (const b of birimler) sayac.set(b.propertyType ?? "", (sayac.get(b.propertyType ?? "") ?? 0) + 1);
  const satirlar = [...sayac.entries()].sort((a, b) => (a[0] === "" ? 1 : b[0] === "" ? -1 : b[1] - a[1]));

  const kart = "bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3";
  const baslik = (metin: string) => (
    <div className="flex items-baseline gap-2 mb-2">
      <h3 className="text-[11.5px] font-semibold uppercase tracking-[.5px] text-slate-500">{metin}</h3>
      <span className="ml-auto text-[11.5px] text-slate-500">{ilEtiketi}</span>
    </div>
  );

  return (
    <section aria-label="Doluluk ve mülk tipi dağılımı" className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
      <div className={kart}>
        {baslik("Mülk Doluluk Oranı")}
        <div className="flex items-center gap-3.5" role="img" aria-label={`Doluluk yüzde ${yuzde}: ${dolu} dolu, ${n - dolu} boş birim`}>
          <svg viewBox="0 0 42 42" className="w-[62px] h-[62px] flex-none -rotate-90" aria-hidden="true">
            <circle cx="21" cy="21" r="16" fill="none" stroke="#e8edeb" strokeWidth={6} />
            <circle cx="21" cy="21" r="16" fill="none" stroke="#1d9a60" strokeWidth={6} strokeLinecap="round" pathLength={100} strokeDasharray={`${yuzde} 100`} />
          </svg>
          <div>
            <b className="block text-[22px] font-extrabold leading-tight text-slate-900 tabular-nums">%{yuzde}</b>
            <small className="block text-xs text-slate-500 tabular-nums">
              dolu <em className="not-italic font-bold text-slate-800">{dolu}</em> · boş <em className="not-italic font-bold text-slate-800">{n - dolu}</em>
            </small>
            <small className="block text-xs text-slate-500 tabular-nums">
              {n} mülk · {binaSayisi} bina
            </small>
          </div>
        </div>
      </div>
      <div className={kart}>
        {baslik("Mülk Tipi Dağılımı")}
        <div className="flex flex-col gap-[7px]">
          {satirlar.map(([tip, sayi]) => {
            const t = TIP[tip] ?? BELIRSIZ;
            const q = Math.round((sayi / Math.max(1, n)) * 100);
            return (
              <div key={tip || "_"} className="grid grid-cols-[76px_minmax(0,1fr)_auto] gap-2 items-center text-[12.5px]" title={`${t.ad}: ${sayi} mülk (%${q})`}>
                <span className="flex items-center gap-1.5 font-semibold whitespace-nowrap text-slate-800 truncate">
                  <i className="w-2 h-2 rounded-full flex-none" style={{ background: t.renk }} />
                  {t.ad}
                </span>
                <span className="h-2 rounded-[5px] bg-[#f5f2ea] overflow-hidden">
                  <i className="block h-full rounded-[5px]" style={{ width: `${Math.max(2, q)}%`, background: t.renk }} />
                </span>
                <span className="text-slate-500 tabular-nums whitespace-nowrap min-w-[64px] text-right">
                  <b className="text-slate-800">{sayi}</b> · %{q}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
