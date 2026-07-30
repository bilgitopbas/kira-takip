"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

export type PropertyTypeSlice = {
  label: string;
  value: number;
};

// Kategorik palet: 1. slot markanin turkuazi, kalanlar renk korlugu (CVD)
// ayrimi dogrulanmis siralamadan. Sirasi kasitlidir, degistirmeyin —
// yan yana dusen renklerin ayirt edilebilirligi bu siraya bagli.
// "Belirtilmemis" dilimi her zaman notr gri.
const SERIES = [
  "#17B6AE",
  "#eb6834",
  "#2a78d6",
  "#eda100",
  "#e87ba4",
  "#4a3aa7",
  "#008300",
];
const NOTR = "#CBD5E1";

export const BELIRTILMEMIS = "Belirtilmemiş";

function dilimRengi(dilim: PropertyTypeSlice, sira: number) {
  if (dilim.label === BELIRTILMEMIS) return NOTR;
  return SERIES[sira % SERIES.length];
}

export default function PropertyTypeChart({ data }: { data: PropertyTypeSlice[] }) {
  const toplam = data.reduce((acc, d) => acc + d.value, 0);

  if (toplam === 0) {
    return <p className="text-sm text-slate-500">Mülk tipi bilgisi girilmemiş.</p>;
  }

  // Renk sirasi "Belirtilmemis"i atlayarak ilerler ki notr gri bir seriyi
  // yutmasin.
  let seriSayaci = 0;
  const renkler = data.map((d) => {
    if (d.label === BELIRTILMEMIS) return NOTR;
    return dilimRengi(d, seriSayaci++);
  });

  return (
    // Dar ekranda yan yana dizilince efsane sutunu daralip tip adlarini
    // kesiyordu; mobilde grafik ustte, etiketler altta tam genislikte.
    <div className="flex flex-col sm:flex-row items-center gap-5 sm:gap-6">
      <div className="w-32 h-32 relative flex-shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="label"
              innerRadius={42}
              outerRadius={62}
              startAngle={90}
              endAngle={-270}
              paddingAngle={2}
              stroke="#ffffff"
              strokeWidth={2}
            >
              {data.map((d, i) => (
                <Cell key={d.label} fill={renkler[i]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(deger, ad) => {
                const adet = Number(deger) || 0;
                return [`${adet} mülk (%${Math.round((adet / toplam) * 100)})`, String(ad ?? "")];
              }}
              contentStyle={{
                borderRadius: 12,
                border: "1px solid #E2E8F0",
                fontSize: 12,
                padding: "6px 10px",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-xl font-bold text-slate-900">{toplam}</span>
          <span className="text-[10px] text-slate-500">Mülk</span>
        </div>
      </div>
      {/* Dilim renkleri acik zeminde tek basina yeterli kontrasta sahip degil;
          her dilim burada adiyla ve adediyle ayrica yaziliyor. */}
      <div className="w-full sm:w-auto grid grid-cols-2 gap-x-5 gap-y-1.5 min-w-0">
        {data.map((d, i) => (
          <div key={d.label} className="flex items-center gap-2 text-sm min-w-0">
            <span
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: renkler[i] }}
            />
            <span className="text-slate-600 truncate">{d.label}</span>
            <span className="font-semibold text-slate-900 ml-auto">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
