"use client";

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

type Props = {
  occupied: number;
  vacant: number;
};

const COLORS = { occupied: "#17B6AE", vacant: "#E2E8F0" };

export default function OccupancyChart({ occupied, vacant }: Props) {
  const total = occupied + vacant;
  const data = [
    { name: "Dolu", value: occupied },
    { name: "Boş", value: vacant },
  ];
  const occupiedPct = total > 0 ? Math.round((occupied / total) * 100) : 0;

  return (
    <div className="flex items-center gap-6">
      <div className="w-32 h-32 relative flex-shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              innerRadius={42}
              outerRadius={62}
              startAngle={90}
              endAngle={-270}
              stroke="none"
            >
              <Cell fill={COLORS.occupied} />
              <Cell fill={COLORS.vacant} />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold text-slate-900">{occupiedPct}%</span>
          <span className="text-[10px] text-slate-500">Dolu</span>
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS.occupied }} />
          <span className="text-slate-600">Dolu</span>
          <span className="font-semibold text-slate-900">{occupied}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS.vacant }} />
          <span className="text-slate-600">Boş</span>
          <span className="font-semibold text-slate-900">{vacant}</span>
        </div>
      </div>
    </div>
  );
}
