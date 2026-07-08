"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getEffectiveDebtStatus, getTotalPaid, DEBT_STATUS_LABELS, DEBT_STATUS_STYLES } from "@/lib/debtStatus";

type Tenant = { id: string; fullName: string; property: { title: string } };
type Debt = {
  id: string;
  year: number;
  month: number;
  amount: string;
  dueDate: string;
  status: string;
  payments: { amount: string }[];
};

const MONTH_NAMES = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
];

export default function TahsilatForm({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) {
  const router = useRouter();

  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loadingTenants, setLoadingTenants] = useState(true);
  const [tenantId, setTenantId] = useState("");

  const [debts, setDebts] = useState<Debt[]>([]);
  const [loadingDebts, setLoadingDebts] = useState(false);
  const [debtId, setDebtId] = useState("");

  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function load() {
      setLoadingTenants(true);
      const res = await fetch("/api/dashboard/tenants");
      const data = await res.json();
      setTenants(data.tenants || []);
      setLoadingTenants(false);
    }
    load();
  }, []);

  useEffect(() => {
    setDebtId("");
    setDebts([]);
    if (!tenantId) return;

    async function loadDebts() {
      setLoadingDebts(true);
      const res = await fetch(`/api/dashboard/tenants/${tenantId}`);
      if (res.ok) {
        const data = await res.json();
        const unpaid: Debt[] = (data.tenant.debts || []).filter(
          (d: Debt) => getEffectiveDebtStatus(d) !== "PAID"
        );
        setDebts(unpaid);
      }
      setLoadingDebts(false);
    }
    loadDebts();
  }, [tenantId]);

  const selectedDebt = debts.find((d) => d.id === debtId);

  function handleSelectDebt(id: string) {
    setDebtId(id);
    const debt = debts.find((d) => d.id === id);
    if (debt) {
      const remaining = Number(debt.amount) - getTotalPaid(debt.payments);
      setAmount(remaining > 0 ? String(remaining) : debt.amount);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!debtId || !amount || !date) {
      setError("Kiracı, ay ve tutar zorunludur.");
      return;
    }
    setSubmitting(true);

    const fd = new FormData();
    fd.set("amount", amount);
    fd.set("paidAt", date);
    fd.set("notes", notes);
    if (file) fd.set("receiptFile", file);

    const res = await fetch(`/api/dashboard/debts/${debtId}/payments`, {
      method: "POST",
      body: fd,
    });

    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Tahsilat kaydedilemedi.");
      return;
    }

    onSuccess();
    router.push(`/dashboard/kiraci/${tenantId}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="bg-red-50 border border-red-100 text-red-500 text-sm px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1.5">Kiracı *</label>
        <select
          required
          value={tenantId}
          onChange={(e) => setTenantId(e.target.value)}
          disabled={loadingTenants}
          className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#17B6AE]/30 bg-white"
        >
          <option value="">Kiracı seçin</option>
          {tenants.map((t) => (
            <option key={t.id} value={t.id}>
              {t.fullName} — {t.property.title}
            </option>
          ))}
        </select>
      </div>

      {tenantId && (
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Ay *</label>
          {loadingDebts ? (
            <p className="text-sm text-slate-500">Yükleniyor...</p>
          ) : debts.length === 0 ? (
            <p className="text-sm text-slate-500">Bu kiracının ödenmemiş borcu yok.</p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {debts.map((d) => {
                const effective = getEffectiveDebtStatus(d);
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => handleSelectDebt(d.id)}
                    className={`text-left text-sm rounded-xl border px-3 py-2.5 transition ${
                      debtId === d.id
                        ? "bg-[#17B6AE] text-white border-[#17B6AE]"
                        : "bg-white text-slate-700 border-gray-200 hover:border-[#17B6AE]"
                    }`}
                  >
                    <div className="font-medium">{MONTH_NAMES[d.month - 1]} {d.year}</div>
                    <div className={`text-xs mt-0.5 ${debtId === d.id ? "text-white/80" : "text-slate-400"}`}>
                      {Number(d.amount).toLocaleString("tr-TR")} ₺
                      {debtId !== d.id && (
                        <span className={`ml-2 px-1.5 py-0.5 rounded-full ${DEBT_STATUS_STYLES[effective]}`}>
                          {DEBT_STATUS_LABELS[effective]}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {selectedDebt && (
        <>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Tahsilat Miktarı (₺) *</label>
            <input
              type="number"
              required
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#17B6AE]/30"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Tarih *</label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#17B6AE]/30"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Dekont Yükle</label>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#17B6AE]/10 file:text-[#17B6AE] hover:file:bg-[#17B6AE]/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Notlar</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#17B6AE]/30 resize-none"
            />
          </div>
        </>
      )}

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={submitting || !selectedDebt}
          className="bg-[#17B6AE] hover:bg-[#149891] disabled:opacity-50 text-white font-semibold px-6 py-2.5 rounded-xl transition text-sm"
        >
          {submitting ? "Kaydediliyor..." : "Tahsilatı Kaydet"}
        </button>
        <button type="button" onClick={onCancel} className="text-sm text-slate-500 hover:text-slate-700">
          Vazgeç
        </button>
      </div>
    </form>
  );
}
