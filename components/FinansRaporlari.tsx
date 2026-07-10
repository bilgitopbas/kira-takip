"use client";

import { useMemo, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

type Payment = {
  id: string;
  amount: number;
  paidAt: string;
  method: string | null;
  notes: string | null;
  hasReceipt: boolean;
  tenantId: string;
  tenantName: string;
  propertyTitle: string;
};

type Debt = { amount: number; dueDate: string };

type Props = {
  payments: Payment[];
  debts: Debt[];
};

function toDateInput(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default function FinansRaporlari({ payments, debts }: Props) {
  const now = new Date();
  const [startDate, setStartDate] = useState(toDateInput(new Date(now.getFullYear(), 0, 1)));
  const [endDate, setEndDate] = useState(toDateInput(now));

  const filteredPayments = useMemo(() => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    return payments.filter((p) => {
      const d = new Date(p.paidAt);
      return d >= start && d <= end;
    });
  }, [payments, startDate, endDate]);

  const filteredDebts = useMemo(() => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    return debts.filter((d) => {
      const due = new Date(d.dueDate);
      return due >= start && due <= end;
    });
  }, [debts, startDate, endDate]);

  const totalCollected = filteredPayments.reduce((sum, p) => sum + p.amount, 0);
  const totalOwed = filteredDebts.reduce((sum, d) => sum + d.amount, 0);
  const collectionRate = totalOwed > 0 ? Math.min(100, Math.round((totalCollected / totalOwed) * 100)) : null;

  const propertyBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of filteredPayments) {
      map.set(p.propertyTitle, (map.get(p.propertyTitle) || 0) + p.amount);
    }
    return Array.from(map.entries())
      .map(([mulk, tutar]) => ({ mulk, tutar }))
      .sort((a, b) => b.tutar - a.tutar);
  }, [filteredPayments]);

  async function exportExcel() {
    const XLSX = await import("xlsx");
    const rows = filteredPayments.map((p) => ({
      Tarih: new Date(p.paidAt).toLocaleDateString("tr-TR"),
      Kiracı: p.tenantName,
      Mülk: p.propertyTitle,
      "Tutar (₺)": p.amount,
      Yöntem: p.method || "—",
      Notlar: p.notes || "—",
    }));
    const sheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, "Tahsilat Defteri");
    XLSX.writeFile(workbook, `tahsilat-defteri-${startDate}-${endDate}.xlsx`);
  }

  function exportPdf() {
    window.print();
  }

  return (
    <div>
      <div className="no-print bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6 flex flex-wrap items-end gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Başlangıç</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#17B6AE]/30"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Bitiş</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#17B6AE]/30"
          />
        </div>
        <div className="flex-1" />
        <button
          type="button"
          onClick={exportExcel}
          className="bg-white hover:bg-gray-50 text-slate-700 font-semibold px-4 py-2.5 rounded-xl transition text-sm border border-gray-200"
        >
          Excel&apos;e Aktar
        </button>
        <button
          type="button"
          onClick={exportPdf}
          className="bg-white hover:bg-gray-50 text-slate-700 font-semibold px-4 py-2.5 rounded-xl transition text-sm border border-gray-200"
        >
          PDF Olarak Yazdır
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <p className="text-xs font-medium text-slate-500 mb-1">Toplam Tahsilat</p>
          <p className="text-2xl font-bold text-slate-900">{totalCollected.toLocaleString("tr-TR")} ₺</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <p className="text-xs font-medium text-slate-500 mb-1">Vadesi Gelen Borç</p>
          <p className="text-2xl font-bold text-slate-900">{totalOwed.toLocaleString("tr-TR")} ₺</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <p className="text-xs font-medium text-slate-500 mb-1">Tahsilat Oranı</p>
          <p className="text-2xl font-bold text-slate-900">
            {collectionRate === null ? "—" : `%${collectionRate}`}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
        <h2 className="text-sm font-bold text-slate-800 mb-4">Mülk Bazlı Gelir Kırılımı</h2>
        {propertyBreakdown.length === 0 ? (
          <p className="text-sm text-slate-500">Seçili tarih aralığında tahsilat yok.</p>
        ) : (
          <>
            <div className="h-56 mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={propertyBreakdown} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="mulk" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#64748B" }} />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: "#64748B" }}
                    tickFormatter={(v) => `${(v / 1000).toLocaleString("tr-TR")}k ₺`}
                    width={52}
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
            <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Mülk</th>
                  <th className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Toplam</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {propertyBreakdown.map((row) => (
                  <tr key={row.mulk}>
                    <td className="px-4 py-2 text-slate-700">{row.mulk}</td>
                    <td className="px-4 py-2 text-slate-800 font-medium text-right">
                      {row.tutar.toLocaleString("tr-TR")} ₺
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-50">
          <h2 className="text-sm font-bold text-slate-800">Tahsilat Defteri</h2>
        </div>
        {filteredPayments.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-10">Seçili tarih aralığında tahsilat kaydı yok.</p>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tarih</th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Kiracı</th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Mülk</th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tutar</th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Dekont</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredPayments.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-5 py-3 text-slate-700">
                    {new Date(p.paidAt).toLocaleDateString("tr-TR")}
                  </td>
                  <td className="px-5 py-3 text-slate-800 font-medium">{p.tenantName}</td>
                  <td className="px-5 py-3 text-slate-700">{p.propertyTitle}</td>
                  <td className="px-5 py-3 text-slate-800 font-medium">
                    {p.amount.toLocaleString("tr-TR")} ₺
                  </td>
                  <td className="px-5 py-3 text-slate-500">{p.hasReceipt ? "Var" : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>
    </div>
  );
}
