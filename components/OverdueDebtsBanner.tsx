"use client";

import { useState } from "react";
import Link from "next/link";
import Modal from "@/components/Modal";

const MONTH_NAMES = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
];

type OverdueDebt = {
  id: string;
  tenantId: string;
  tenantName: string;
  propertyTitle: string;
  year: number;
  month: number;
  remaining: number;
};

export default function OverdueDebtsBanner({
  count,
  amount,
  list,
}: {
  count: number;
  amount: number;
  list: OverdueDebt[];
}) {
  const [open, setOpen] = useState(false);

  if (count === 0) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full flex items-center gap-3 bg-white rounded-xl border-l-4 border-orange-400 border-y border-r border-gray-100 shadow-sm px-5 py-3 mb-6 text-left hover:shadow-md transition-shadow"
      >
        <span className="text-orange-500 text-sm font-bold">Toplam Gecikmiş</span>
        <span className="text-sm font-bold text-slate-800">{amount.toLocaleString("tr-TR")} ₺</span>
        <span className="text-xs text-slate-400">({count} kayıt)</span>
        <span className="ml-auto text-xs font-semibold text-[#17B6AE]">Detayları Gör →</span>
      </button>

      {open && (
        <Modal onClose={() => setOpen(false)} title="Gecikmiş Ödemeler" maxWidthClassName="max-w-lg">
          <div className="space-y-2">
            {list.map((d) => (
              <Link
                key={d.id}
                href={`/dashboard/kiraci/${d.tenantId}`}
                onClick={() => setOpen(false)}
                className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl border border-gray-100 hover:border-orange-200 hover:bg-orange-50/40 transition"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{d.tenantName}</p>
                  <p className="text-xs text-slate-500 truncate">
                    {d.propertyTitle} · {MONTH_NAMES[d.month - 1]} {d.year}
                  </p>
                </div>
                <span className="text-sm font-bold text-orange-500 flex-shrink-0">
                  {d.remaining.toLocaleString("tr-TR")} ₺
                </span>
              </Link>
            ))}
          </div>
        </Modal>
      )}
    </>
  );
}
