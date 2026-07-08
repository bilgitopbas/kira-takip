"use client";

import { useState } from "react";
import { PieChart, Pie, Cell } from "recharts";
import Link from "next/link";
import { DEBT_STATUS_LABELS, type EffectiveDebtStatus } from "@/lib/debtStatus";

type DebtItem = {
  id: string;
  tenantId: string;
  tenantName: string;
  amount: number;
  status: EffectiveDebtStatus;
};

type Props = {
  items: DebtItem[];
};

const COLORS: Record<EffectiveDebtStatus, string> = {
  PAID: "#10B981",
  PARTIAL: "#3B82F6",
  PENDING: "#F59E0B",
  UNPAID: "#EF4444",
};

const DOT_STYLES: Record<EffectiveDebtStatus, string> = {
  PAID: "bg-emerald-500",
  PARTIAL: "bg-blue-500",
  PENDING: "bg-amber-500",
  UNPAID: "bg-red-500",
};

const STATUS_ORDER: EffectiveDebtStatus[] = ["PAID", "PARTIAL", "PENDING", "UNPAID"];

export default function MonthlyPaymentsPie({ items }: Props) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const counts: Record<EffectiveDebtStatus, number> = { PAID: 0, PARTIAL: 0, PENDING: 0, UNPAID: 0 };
  for (const item of items) counts[item.status]++;

  const data = STATUS_ORDER
    .map((status) => ({ status, value: counts[status] }))
    .filter((d) => d.value > 0);

  if (items.length === 0) {
    return <p className="text-sm text-slate-500">Bu ay için borç kaydı yok.</p>;
  }

  return (
    <div>
      <div className="flex items-center gap-6 mb-4">
        <div className="w-28 h-28 flex-shrink-0" style={{ filter: "drop-shadow(0 6px 10px rgba(15,23,42,0.12))" }}>
          <PieChart width={112} height={112}>
            <Pie
              data={data}
              dataKey="value"
              nameKey="status"
              innerRadius={32}
              outerRadius={54}
              paddingAngle={3}
              stroke="none"
              isAnimationActive
              animationDuration={700}
              onMouseEnter={(_, i) => setActiveIndex(i)}
              onMouseLeave={() => setActiveIndex(null)}
            >
              {data.map((entry, i) => (
                <Cell
                  key={entry.status}
                  fill={COLORS[entry.status]}
                  style={{
                    transition: "transform 150ms ease, opacity 150ms ease",
                    transform: activeIndex === i ? "scale(1.06)" : "scale(1)",
                    transformOrigin: "center",
                    opacity: activeIndex === null || activeIndex === i ? 1 : 0.7,
                  }}
                />
              ))}
            </Pie>
          </PieChart>
        </div>
        <div className="space-y-1.5">
          {STATUS_ORDER.map((status) => (
            <div key={status} className="flex items-center gap-2 text-sm">
              <span className={`w-2.5 h-2.5 rounded-full ${DOT_STYLES[status]}`} />
              <span className="text-slate-600">{DEBT_STATUS_LABELS[status]}</span>
              <span className="font-semibold text-slate-900">{counts[status]}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-1 max-h-40 overflow-y-auto">
        {items.map((item) => (
          <Link
            key={item.id}
            href={`/dashboard/kiraci/${item.tenantId}`}
            className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-gray-50 transition text-sm"
          >
            <span className="flex items-center gap-2 min-w-0">
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${DOT_STYLES[item.status]}`} />
              <span className="text-slate-700 truncate">{item.tenantName}</span>
            </span>
            <span className="text-xs text-slate-500 flex-shrink-0">
              {DEBT_STATUS_LABELS[item.status]}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
