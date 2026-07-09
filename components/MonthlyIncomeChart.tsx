"use client";

import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from "recharts";

type Props = {
  data: { ay: string; tutar: number; borc?: number }[];
};

const PERIODS = [
  { label: "6 Ay", months: 6 },
  { label: "1 Yıl", months: 12 },
  { label: "2 Yıl", months: 24 },
  { label: "5 Yıl", months: 60 },
];

export default function MonthlyIncomeChart({ data }: Props) {
  const [months, setMonths] = useState(6);
  const sliced = data.slice(-months);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold text-slate-800">Borç / Tahsilat Grafiği</h2>
        <div className="flex items-center gap-1 bg-gray-50 rounded-lg p-1">
          {PERIODS.map((p) => (
            <button
              key={p.months}
              onClick={() => setMonths(p.months)}
              className={`text-xs font-medium px-2.5 py-1 rounded-md transition ${
                months === p.months
                  ? "bg-white text-[#17B6AE] shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={sliced} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="#F1F5F9" />
            <XAxis
              dataKey="ay"
              axisLine={false}
              tickLine={false}
              interval={sliced.length > 12 ? Math.ceil(sliced.length / 12) - 1 : 0}
              tick={{ fontSize: 11, fill: "#64748B" }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "#64748B" }}
              tickFormatter={(v) => `${(v / 1000).toLocaleString("tr-TR")}k ₺`}
              width={52}
            />
            <Tooltip
              cursor={{ fill: "#17B6AE", fillOpacity: 0.06 }}
              formatter={(value, name) => [`${Number(value).toLocaleString("tr-TR")} ₺`, name === "borc" ? "Borç" : "Tahsilat"]}
              contentStyle={{ borderRadius: 12, border: "1px solid #E2E8F0", fontSize: 13 }}
            />
            <Legend
              wrapperStyle={{ fontSize: 12 }}
              formatter={(value) => (value === "borc" ? "Borç" : "Tahsilat")}
            />
            <Bar dataKey="borc" fill="#CBD5E1" radius={[6, 6, 0, 0]} maxBarSize={28} />
            <Bar dataKey="tutar" fill="#17B6AE" radius={[6, 6, 0, 0]} maxBarSize={28} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
