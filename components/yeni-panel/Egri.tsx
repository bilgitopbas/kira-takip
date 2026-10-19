"use client";

// KPI kartlarındaki küçük eğri (sparkline) — önizleme v6 ile aynı ölçü.
export default function Egri({ degerler, renk = "#17B6AE" }: { degerler: number[]; renk?: string }) {
  if (degerler.length < 2) return null;
  const w = 84;
  const h = 34;
  const pay = 3;
  const mn = Math.min(...degerler);
  const mx = Math.max(...degerler);
  const ar = mx - mn || 1;
  const n = (i: number): [number, number] => [pay + (i * (w - 2 * pay)) / (degerler.length - 1), h - pay - ((degerler[i] - mn) / ar) * (h - 2 * pay)];
  const cizgi = degerler.map((_, i) => `${i ? "L" : "M"}${n(i)[0].toFixed(1)} ${n(i)[1].toFixed(1)}`).join("");
  const [sx, sy] = n(degerler.length - 1);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} aria-hidden="true" className="flex-none">
      <path d={`${cizgi}L${sx.toFixed(1)} ${h}L${pay} ${h}Z`} fill={renk} opacity={0.12} />
      <path d={cizgi} fill="none" stroke={renk} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={sx} cy={sy} r={2.4} fill={renk} />
    </svg>
  );
}
