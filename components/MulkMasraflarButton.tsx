"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/Modal";

type Expense = {
  id: string;
  description: string;
  amount: string;
  date: string;
  notes: string | null;
  tenant: { fullName: string } | null;
};

export default function MulkMasraflarButton({
  propertyId,
  className,
}: {
  propertyId: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch(`/api/dashboard/properties/${propertyId}/expenses`)
      .then((r) => r.json())
      .then((d) => setExpenses(d.expenses || []))
      .finally(() => setLoading(false));
  }, [open, propertyId]);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        Masraflar
      </button>
      {open && (
        <Modal title="Yapılan Masraflar" onClose={() => setOpen(false)} maxWidthClassName="max-w-lg">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-5 h-5 border-2 border-[#17B6AE] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : expenses.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-6">
              Bu mülk için henüz masraf kaydı girilmemiş.
            </p>
          ) : (
            <ul className="space-y-2.5 max-h-[60vh] overflow-y-auto">
              {expenses.map((exp) => (
                <li key={exp.id} className="bg-gray-50 rounded-xl px-4 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-slate-800">{exp.description}</span>
                    <span className="text-sm font-bold text-[#17B6AE]">
                      {Number(exp.amount).toLocaleString("tr-TR")} ₺
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {new Date(exp.date).toLocaleDateString("tr-TR")}
                    {exp.tenant?.fullName ? ` · ${exp.tenant.fullName}` : ""}
                  </p>
                  {exp.notes && <p className="text-xs text-slate-500 italic mt-1">{exp.notes}</p>}
                </li>
              ))}
            </ul>
          )}
        </Modal>
      )}
    </>
  );
}
