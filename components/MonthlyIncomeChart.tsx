"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

type Props = {
  data: { ay: string; tutar: number }[];
};

export default function MonthlyIncomeChart({ data }: Props) {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="#F1F5F9" />
          <XAxis
            dataKey="ay"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: "#64748B" }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: "#64748B" }}
            tickFormatter={(v) => `${(v / 1000).toLocaleString("tr-TR")}k`}
            width={40}
          />
          <Tooltip
            cursor={{ fill: "#17B6AE", fillOpacity: 0.06 }}
            formatter={(value) => [`${Number(value).toLocaleString("tr-TR")} ₺`, "Tahsilat"]}
            contentStyle={{ borderRadius: 12, border: "1px solid #E2E8F0", fontSize: 13 }}
          />
          <Bar dataKey="tutar" fill="#17B6AE" radius={[6, 6, 0, 0]} maxBarSize={48} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
