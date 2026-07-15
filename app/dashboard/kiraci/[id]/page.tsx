"use client";

import { useEffect, useMemo, useState, use } from "react";
import Modal from "@/components/Modal";
import BackButton from "@/components/BackButton";
import {
  getEffectiveDebtStatus,
  getTotalPaid,
  DEBT_STATUS_LABELS,
  DEBT_STATUS_STYLES,
} from "@/lib/debtStatus";

type Debt = {
  id: string;
  year: number;
  month: number;
  amount: string;
  dueDate: string;
  status: string;
  payments: { id: string; amount: string; paidAt: string; notes: string | null }[];
};

type Expense = {
  id: string;
  description: string;
  amount: string;
  date: string;
  notes: string | null;
};

type Tenant = {
  id: string;
  fullName: string;
  phone: string | null;
  email: string | null;
  tenantType: string | null;
  nationalId: string | null;
  taxNumber: string | null;
  notificationAddress: string | null;
  notes: string | null;
  rating: number | null;
  monthlyRent: string | null;
  contractStart: string | null;
  contractEnd: string | null;
  rentRevisionDate: string | null;
  rentPaymentDate: string | null;
  contractDurationMonths: number | null;
  paymentFrequency: string | null;
  increaseType: string | null;
  increaseRate: string | null;
  depositAmount: string | null;
  depositCurrency: string | null;
  contractFileUrl: string | null;
  contractNotes: string | null;
  property: { id: string; title: string };
  debts: Debt[];
  expenses: Expense[];
};

const MONTH_NAMES = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
];

const MONTH_NAMES_SHORT = [
  "Oca", "Şub", "Mar", "Nis", "May", "Haz",
  "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara",
];

const CURRENCY_SYMBOLS: Record<string, string> = { TRY: "₺", USD: "$", EUR: "€" };

function formatDebtDate(dueDate: string) {
  const date = new Date(dueDate);
  return `${date.getDate()} ${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;
}

function formatDebtDateShort(dueDate: string) {
  const date = new Date(dueDate);
  return `${date.getDate()} ${MONTH_NAMES_SHORT[date.getMonth()]} ${String(date.getFullYear()).slice(2)}`;
}

function Stars({ rating }: { rating: number | null }) {
  if (!rating) return <span className="text-slate-400 text-sm">Puanlanmadı</span>;
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <svg
          key={n}
          viewBox="0 0 24 24"
          className={`w-4 h-4 ${n <= rating ? "fill-amber-400 stroke-amber-400" : "fill-transparent stroke-gray-300"}`}
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 2.5l2.9 5.88 6.49.94-4.7 4.58 1.11 6.47L12 17.27l-5.8 3.1 1.11-6.47-4.7-4.58 6.49-.94L12 2.5z"
          />
        </svg>
      ))}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2.5 text-[15px]">
      <span className="text-slate-500">{label}</span>
      <span className="text-slate-800 font-semibold text-right">{value ?? "—"}</span>
    </div>
  );
}

function CardHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2.5 mb-3">
      <div className="w-8 h-8 rounded-lg bg-[#17B6AE]/10 text-[#17B6AE] flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <h2 className="text-base font-bold text-slate-800">{title}</h2>
    </div>
  );
}

export default function KiraciDetayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showDebtModal, setShowDebtModal] = useState(false);
  const [debtAmount, setDebtAmount] = useState("");
  const [debtStartDate, setDebtStartDate] = useState("");
  const [debtSubmitting, setDebtSubmitting] = useState(false);
  const [debtError, setDebtError] = useState("");

  const [payDebt, setPayDebt] = useState<Debt | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payDate, setPayDate] = useState("");
  const [payNotes, setPayNotes] = useState("");
  const [payFile, setPayFile] = useState<File | null>(null);
  const [paySubmitting, setPaySubmitting] = useState(false);
  const [payError, setPayError] = useState("");

  const [editDebt, setEditDebt] = useState<Debt | null>(null);
  const [editRows, setEditRows] = useState<{ id: string; amount: string; paidAt: string; notes: string }[]>([]);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editDeletingId, setEditDeletingId] = useState<string | null>(null);
  const [editError, setEditError] = useState("");

  const [showEditDebtBatchModal, setShowEditDebtBatchModal] = useState(false);
  const [editDebtBatchAmount, setEditDebtBatchAmount] = useState("");
  const [editDebtBatchSubmitting, setEditDebtBatchSubmitting] = useState(false);
  const [editDebtBatchError, setEditDebtBatchError] = useState("");

  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenseDescription, setExpenseDescription] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseDate, setExpenseDate] = useState("");
  const [expenseNotes, setExpenseNotes] = useState("");
  const [expenseSubmitting, setExpenseSubmitting] = useState(false);
  const [expenseDeletingId, setExpenseDeletingId] = useState<string | null>(null);
  const [expenseError, setExpenseError] = useState("");

  const [periodIndex, setPeriodIndex] = useState(0);

  const periods = useMemo(() => {
    const debts = tenant?.debts ?? [];
    const sorted = [...debts].sort(
      (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    );
    const chunks: Debt[][] = [];
    for (let i = 0; i < sorted.length; i += 12) {
      chunks.push(sorted.slice(i, i + 12));
    }
    return chunks;
  }, [tenant]);

  useEffect(() => {
    setPeriodIndex(periods.length > 0 ? periods.length - 1 : 0);
  }, [periods.length]);

  const currentPeriod = periods[periodIndex] || [];

  const periodTotals = useMemo(() => {
    const dueDebts = currentPeriod.filter((d) => getEffectiveDebtStatus(d) !== "PENDING");
    const totalAmount = dueDebts.reduce((sum, d) => sum + Number(d.amount), 0);
    const totalPaid = dueDebts.reduce((sum, d) => sum + getTotalPaid(d.payments), 0);
    return { totalAmount, totalPaid, difference: totalAmount - totalPaid };
  }, [currentPeriod]);

  const grandTotalDifference = useMemo(() => {
    const debts = tenant?.debts ?? [];
    const dueDebts = debts.filter((d) => getEffectiveDebtStatus(d) !== "PENDING");
    const totalAmount = dueDebts.reduce((sum, d) => sum + Number(d.amount), 0);
    const totalPaid = dueDebts.reduce((sum, d) => sum + getTotalPaid(d.payments), 0);
    return totalAmount - totalPaid;
  }, [tenant]);

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/dashboard/tenants/${id}`);
    if (res.ok) {
      const data = await res.json();
      setTenant(data.tenant);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [id]);

  function openDebtModal() {
    setDebtAmount(tenant?.monthlyRent || "");
    setDebtStartDate("");
    setDebtError("");
    setShowDebtModal(true);
  }

  async function submitDebtBatch(e: React.FormEvent) {
    e.preventDefault();
    setDebtError("");
    if (!debtStartDate || !debtAmount) {
      setDebtError("Tarih ve kira bedeli zorunludur.");
      return;
    }
    setDebtSubmitting(true);
    const res = await fetch(`/api/dashboard/tenants/${id}/debts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ monthlyRent: Number(debtAmount), startDate: debtStartDate }),
    });
    setDebtSubmitting(false);
    if (!res.ok) {
      const data = await res.json();
      setDebtError(data.error || "Borçlandırma yapılamadı.");
      return;
    }
    setShowDebtModal(false);
    load();
  }

  function openEditDebtBatchModal() {
    setEditDebtBatchAmount(currentPeriod[0]?.amount || "");
    setEditDebtBatchError("");
    setShowEditDebtBatchModal(true);
  }

  async function submitEditDebtBatch(e: React.FormEvent) {
    e.preventDefault();
    setEditDebtBatchError("");
    const amount = Number(editDebtBatchAmount);
    if (!editDebtBatchAmount || Number.isNaN(amount) || amount <= 0) {
      setEditDebtBatchError("Geçerli bir tutar girin.");
      return;
    }
    setEditDebtBatchSubmitting(true);
    const res = await fetch(`/api/dashboard/tenants/${id}/debts/bulk-update`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ debtIds: currentPeriod.map((d) => d.id), amount }),
    });
    setEditDebtBatchSubmitting(false);
    if (!res.ok) {
      const data = await res.json();
      setEditDebtBatchError(data.error || "Borçlandırma güncellenemedi.");
      return;
    }
    setShowEditDebtBatchModal(false);
    load();
  }

  function openExpenseModal() {
    setExpenseDescription("");
    setExpenseAmount("");
    setExpenseDate(new Date().toISOString().slice(0, 10));
    setExpenseNotes("");
    setExpenseError("");
    setShowExpenseModal(true);
  }

  async function submitExpense(e: React.FormEvent) {
    e.preventDefault();
    setExpenseError("");
    if (!expenseDescription.trim() || !expenseAmount || !expenseDate) {
      setExpenseError("Açıklama, tutar ve tarih zorunludur.");
      return;
    }
    setExpenseSubmitting(true);
    const res = await fetch(`/api/dashboard/tenants/${id}/expenses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        description: expenseDescription.trim(),
        amount: Number(expenseAmount),
        date: expenseDate,
        notes: expenseNotes.trim(),
      }),
    });
    setExpenseSubmitting(false);
    if (!res.ok) {
      const data = await res.json();
      setExpenseError(data.error || "Masraf kaydedilemedi.");
      return;
    }
    setShowExpenseModal(false);
    load();
  }

  async function deleteExpense(expenseId: string) {
    if (!window.confirm("Bu masraf kaydını silmek istediğinize emin misiniz?")) return;
    setExpenseDeletingId(expenseId);
    const res = await fetch(`/api/dashboard/expenses/${expenseId}`, { method: "DELETE" });
    setExpenseDeletingId(null);
    if (res.ok) load();
  }

  function openPayModal(debt: Debt) {
    setPayDebt(debt);
    const remaining = Number(debt.amount) - getTotalPaid(debt.payments);
    setPayAmount(remaining > 0 ? String(remaining) : debt.amount);
    setPayDate(new Date().toISOString().slice(0, 10));
    setPayNotes("");
    setPayFile(null);
    setPayError("");
  }

  async function submitPayment(e: React.FormEvent) {
    e.preventDefault();
    if (!payDebt) return;
    setPayError("");
    if (!payAmount || !payDate) {
      setPayError("Tutar ve tarih zorunludur.");
      return;
    }
    setPaySubmitting(true);
    const fd = new FormData();
    fd.set("amount", payAmount);
    fd.set("paidAt", payDate);
    fd.set("notes", payNotes);
    if (payFile) fd.set("receiptFile", payFile);

    const res = await fetch(`/api/dashboard/debts/${payDebt.id}/payments`, {
      method: "POST",
      body: fd,
    });
    setPaySubmitting(false);
    if (!res.ok) {
      const data = await res.json();
      setPayError(data.error || "Tahsilat kaydedilemedi.");
      return;
    }
    setPayDebt(null);
    load();
  }

  function openEditModal(debt: Debt) {
    setEditDebt(debt);
    setEditRows(
      debt.payments.map((p) => ({
        id: p.id,
        amount: p.amount,
        paidAt: p.paidAt.slice(0, 10),
        notes: p.notes || "",
      }))
    );
    setEditError("");
  }

  function updateEditRow(id: string, field: "amount" | "paidAt" | "notes", value: string) {
    setEditRows((rows) => rows.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  }

  async function deleteEditPayment(paymentId: string) {
    if (!window.confirm("Bu tahsilat kaydını silmek istediğinize emin misiniz?")) return;
    setEditDeletingId(paymentId);
    setEditError("");
    const res = await fetch(`/api/dashboard/payments/${paymentId}`, { method: "DELETE" });
    setEditDeletingId(null);
    if (!res.ok) {
      const data = await res.json();
      setEditError(data.error || "Tahsilat silinemedi.");
      return;
    }
    const remaining = editRows.filter((r) => r.id !== paymentId);
    setEditRows(remaining);
    await load();
    if (remaining.length === 0) setEditDebt(null);
  }

  async function submitEditPayments(e: React.FormEvent) {
    e.preventDefault();
    setEditError("");
    for (const row of editRows) {
      if (!row.amount || Number(row.amount) <= 0 || !row.paidAt) {
        setEditError("Tüm kayıtlarda tutar ve tarih zorunludur.");
        return;
      }
    }
    setEditSubmitting(true);
    for (const row of editRows) {
      const res = await fetch(`/api/dashboard/payments/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: Number(row.amount), paidAt: row.paidAt, notes: row.notes }),
      });
      if (!res.ok) {
        const data = await res.json();
        setEditError(data.error || "Tahsilat güncellenemedi.");
        setEditSubmitting(false);
        return;
      }
    }
    setEditSubmitting(false);
    setEditDebt(null);
    load();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-6 h-6 border-2 border-[#17B6AE] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!tenant) {
    return <p className="text-sm text-slate-500">Kiracı bulunamadı.</p>;
  }

  const debtYearlyPreview = debtAmount ? Number(debtAmount) * 12 : 0;

  return (
    <div>
      <BackButton className="no-print" />

      <div className="mb-6 flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-[#17B6AE] uppercase tracking-wider mb-1">
            {tenant.property.title}
          </p>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">{tenant.fullName}</h1>
          {tenant.contractStart && (
            <span className="inline-flex items-center gap-1.5 bg-[#17B6AE]/10 text-[#17B6AE] text-sm font-semibold px-3 py-1.5 rounded-full">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 2v4M8 2v4M3 10h18" />
              </svg>
              Sözleşme Başlangıcı: {new Date(tenant.contractStart).toLocaleDateString("tr-TR")}
            </span>
          )}
        </div>
        <div className="no-print flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="bg-white border border-gray-200 hover:border-[#17B6AE] text-slate-700 font-semibold px-4 py-2 rounded-xl transition text-sm inline-flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6v-8z" />
            </svg>
            Ekstre / Yazdır
          </button>
          <a
            href={`/dashboard/kiraci/${tenant.id}/duzenle`}
            className="bg-white border border-gray-200 hover:border-[#17B6AE] text-slate-700 font-semibold px-4 py-2 rounded-xl transition text-sm"
          >
            Düzenle
          </a>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-100 text-red-500 text-sm px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <CardHeader
            title="Kiracı Bilgileri"
            icon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <circle cx="12" cy="8" r="4" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 21v-1a8 8 0 0116 0v1" />
              </svg>
            }
          />
          <InfoRow
            label="Tip"
            value={tenant.tenantType === "CORPORATE" ? "Kurumsal" : "Bireysel"}
          />
          <InfoRow
            label={tenant.tenantType === "CORPORATE" ? "Vergi No" : "TC Kimlik No"}
            value={tenant.tenantType === "CORPORATE" ? tenant.taxNumber : tenant.nationalId}
          />
          <InfoRow label="Telefon" value={tenant.phone} />
          <InfoRow label="Tebligat Adresi" value={tenant.notificationAddress} />
          <InfoRow label="Notlar" value={tenant.notes} />
          <div className="flex items-center justify-between py-2 text-sm">
            <span className="text-slate-500">Puan</span>
            <Stars rating={tenant.rating} />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <CardHeader
            title="Kira Sözleşmesi"
            icon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6M9 8h6M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z" />
              </svg>
            }
          />
          <InfoRow
            label="Aylık Kira"
            value={
              tenant.monthlyRent ? (
                <span className="text-[#17B6AE] text-lg font-bold">
                  {Number(tenant.monthlyRent).toLocaleString("tr-TR")} ₺
                </span>
              ) : (
                <span className="text-slate-400 text-sm font-normal">Henüz borçlandırılmadı</span>
              )
            }
          />
          <InfoRow
            label="Yıllık Kira"
            value={tenant.monthlyRent ? `${(Number(tenant.monthlyRent) * 12).toLocaleString("tr-TR")} ₺` : null}
          />
          <InfoRow
            label="Sözleşme Başlangıç"
            value={tenant.contractStart ? new Date(tenant.contractStart).toLocaleDateString("tr-TR") : null}
          />
          <InfoRow
            label="Sözleşme Bitiş"
            value={tenant.contractEnd ? new Date(tenant.contractEnd).toLocaleDateString("tr-TR") : null}
          />
          <InfoRow
            label="Kira Düzenlenme Tarihi"
            value={tenant.rentRevisionDate ? new Date(tenant.rentRevisionDate).toLocaleDateString("tr-TR") : null}
          />
          <InfoRow
            label="Kira Ödeme Tarihi"
            value={tenant.rentPaymentDate ? new Date(tenant.rentPaymentDate).toLocaleDateString("tr-TR") : null}
          />
          <InfoRow
            label="Ödeme Şekli"
            value={tenant.paymentFrequency === "YEARLY" ? "Yıllık" : "Aylık"}
          />
          <InfoRow
            label="Artış Oranı"
            value={tenant.increaseType === "CUSTOM" ? `%${tenant.increaseRate ?? "—"}` : "TÜFE"}
          />
          <InfoRow
            label="Depozito"
            value={
              tenant.depositAmount
                ? `${Number(tenant.depositAmount).toLocaleString("tr-TR")} ${CURRENCY_SYMBOLS[tenant.depositCurrency || "TRY"]}`
                : null
            }
          />
          {tenant.contractFileUrl && (
            <div className="flex items-center justify-between py-2 text-sm">
              <span className="text-slate-500">Sözleşme Dosyası</span>
              <a
                href={`/api/dashboard/tenants/${tenant.id}/contract`}
                className="text-[#17B6AE] font-medium hover:underline"
              >
                İndir
              </a>
            </div>
          )}
          <InfoRow label="Sözleşme Notları" value={tenant.contractNotes} />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-bold text-slate-800">Ödeme Planı</h2>
          <div className="no-print flex items-center gap-2">
            {periods.length > 0 && (
              <button
                onClick={openEditDebtBatchModal}
                className="bg-white border border-gray-200 hover:border-[#17B6AE] text-slate-600 hover:text-[#17B6AE] font-semibold px-4 py-2 rounded-xl transition text-sm"
              >
                Düzenle
              </button>
            )}
            <button
              onClick={openExpenseModal}
              className="bg-white border border-gray-200 hover:border-[#17B6AE] text-slate-600 hover:text-[#17B6AE] font-semibold px-4 py-2 rounded-xl transition text-sm"
            >
              Masraf Ekle
            </button>
            <button
              onClick={openDebtModal}
              className="bg-[#17B6AE] hover:bg-[#149891] text-white font-semibold px-4 py-2 rounded-xl transition text-sm"
            >
              Kiracıyı Borçlandır
            </button>
          </div>
        </div>

        {periods.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-10">
            Henüz borç kaydı yok. &quot;Kiracıyı Borçlandır&quot; ile 12 aylık plan oluşturun.
          </p>
        ) : (
          <>
            <div className="no-print flex items-center justify-center gap-4 px-6 py-3 border-b border-gray-100 bg-gray-50/50">
              <button
                type="button"
                onClick={() => setPeriodIndex((i) => Math.max(0, i - 1))}
                disabled={periodIndex === 0}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent transition"
              >
                ‹
              </button>
              <p className="text-sm font-bold text-slate-800 min-w-[180px] text-center">
                {periodIndex + 1}. Yıl
                {currentPeriod.length > 0 && (
                  <span className="font-normal text-slate-500">
                    {" "}
                    ({MONTH_NAMES[currentPeriod[0].month - 1]} {currentPeriod[0].year} –{" "}
                    {MONTH_NAMES[currentPeriod[currentPeriod.length - 1].month - 1]}{" "}
                    {currentPeriod[currentPeriod.length - 1].year})
                  </span>
                )}
              </p>
              <button
                type="button"
                onClick={() => setPeriodIndex((i) => Math.min(periods.length - 1, i + 1))}
                disabled={periodIndex === periods.length - 1}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent transition"
              >
                ›
              </button>
            </div>

            <div className="overflow-x-auto">
            <table className="w-full text-xs sm:text-base">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-1.5 py-2 sm:px-5 sm:py-3 text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider border-r border-gray-100">Ay / Yıl</th>
                  <th className="px-1.5 py-2 sm:px-5 sm:py-3 text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider border-r border-gray-100">Tutar</th>
                  <th className="px-1.5 py-2 sm:px-5 sm:py-3 text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider border-r border-gray-100">Ödeme</th>
                  <th className="px-1.5 py-2 sm:px-5 sm:py-3 text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider border-r border-gray-100">Durum</th>
                  <th className="no-print px-1.5 py-2 sm:px-5 sm:py-3 text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {currentPeriod.map((d) => {
                  const effective = getEffectiveDebtStatus(d);
                  const totalPaid = getTotalPaid(d.payments);
                  const paymentNotes = d.payments
                    .map((p) => p.notes?.trim())
                    .filter((n): n is string => !!n)
                    .join(" · ");
                  return (
                    <tr key={d.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-1.5 py-2 sm:px-5 sm:py-3.5 text-slate-800 font-semibold border-r border-gray-100 whitespace-nowrap">
                        <span className="sm:hidden">{formatDebtDateShort(d.dueDate)}</span>
                        <span className="hidden sm:inline">{formatDebtDate(d.dueDate)}</span>
                      </td>
                      <td className="px-1.5 py-2 sm:px-5 sm:py-3.5 text-slate-700 border-r border-gray-100 whitespace-nowrap">
                        {Number(d.amount).toLocaleString("tr-TR")} ₺
                      </td>
                      <td className="px-1.5 py-2 sm:px-5 sm:py-3.5 border-r border-gray-100">
                        {totalPaid > 0 ? (
                          <div className="space-y-0.5">
                            {d.payments.length > 1 ? (
                              d.payments.map((p) => (
                                <div key={p.id} className="flex items-baseline gap-1 whitespace-nowrap">
                                  <span className="text-slate-700 text-[10px] sm:text-sm">
                                    {Number(p.amount).toLocaleString("tr-TR")} ₺
                                  </span>
                                  <span className="text-slate-400 text-[8px] sm:text-[10px]">
                                    · {formatDebtDateShort(p.paidAt)}
                                  </span>
                                </div>
                              ))
                            ) : (
                              <span className={`whitespace-nowrap ${effective === "PARTIAL" ? "text-blue-600 font-semibold" : "text-slate-700"}`}>
                                {totalPaid.toLocaleString("tr-TR")} ₺
                              </span>
                            )}
                            {effective === "PARTIAL" && (
                              <div className="text-[9px] sm:text-xs text-blue-500 font-medium">
                                Kısmi ödeme{d.payments.length > 1 ? ` · ${d.payments.length} kayıt` : ""}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                        {paymentNotes && (
                          <div className="hidden sm:block text-xs text-slate-400 italic mt-0.5 truncate max-w-[180px]">Not: {paymentNotes}</div>
                        )}
                      </td>
                      <td className="px-1.5 py-2 sm:px-5 sm:py-3.5 border-r border-gray-100">
                        <span className={`text-[9px] sm:text-xs px-1.5 sm:px-3 py-1 sm:py-1.5 rounded-full font-semibold whitespace-nowrap ${DEBT_STATUS_STYLES[effective]}`}>
                          {DEBT_STATUS_LABELS[effective]}
                        </span>
                      </td>
                      <td className="no-print px-1.5 py-2 sm:px-5 sm:py-3.5 text-right">
                        <div className="flex flex-col sm:flex-row gap-1 sm:gap-1.5 items-end sm:items-center justify-end">
                          {effective !== "PAID" && (
                            <button
                              onClick={() => openPayModal(d)}
                              className="text-[9px] sm:text-xs px-1.5 sm:px-3 py-1 sm:py-1.5 rounded-lg font-semibold bg-[#17B6AE]/10 text-[#17B6AE] hover:bg-[#17B6AE]/20 transition whitespace-nowrap"
                            >
                              <span className="sm:hidden">İşaretle</span>
                              <span className="hidden sm:inline">Ödendi Olarak İşaretle</span>
                            </button>
                          )}
                          {totalPaid > 0 && (
                            <button
                              onClick={() => openEditModal(d)}
                              className="text-[9px] sm:text-xs px-1.5 sm:px-3 py-1 sm:py-1.5 rounded-lg font-semibold bg-white border border-gray-200 text-slate-600 hover:border-[#17B6AE] hover:text-[#17B6AE] transition whitespace-nowrap"
                            >
                              Düzelt
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50 border-t-2 border-gray-200 font-bold">
                  <td className="px-1.5 py-2 sm:px-5 sm:py-3.5 text-slate-800 border-r border-gray-100">Toplam</td>
                  <td className="px-1.5 py-2 sm:px-5 sm:py-3.5 text-slate-800 border-r border-gray-100 whitespace-nowrap">
                    {periodTotals.totalAmount.toLocaleString("tr-TR")} ₺
                  </td>
                  <td className="px-1.5 py-2 sm:px-5 sm:py-3.5 border-r border-gray-100 whitespace-nowrap" colSpan={2}>
                    <span className="text-slate-800">{periodTotals.totalPaid.toLocaleString("tr-TR")} ₺</span>
                    <span
                      className={`block sm:inline sm:ml-3 mt-0.5 sm:mt-0 text-[9px] sm:text-xs px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full font-semibold w-fit ${
                        periodTotals.difference > 0
                          ? "bg-red-50 text-red-600"
                          : periodTotals.difference < 0
                          ? "bg-emerald-50 text-emerald-600"
                          : "bg-gray-100 text-slate-500"
                      }`}
                    >
                      {periodTotals.difference > 0
                        ? `Fark: -${periodTotals.difference.toLocaleString("tr-TR")} ₺`
                        : periodTotals.difference < 0
                        ? `Fazla Ödeme: +${Math.abs(periodTotals.difference).toLocaleString("tr-TR")} ₺`
                        : "Fark yok"}
                    </span>
                  </td>
                  <td className="no-print" />
                </tr>
              </tfoot>
            </table>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2 px-4 sm:px-6 py-3 border-t border-gray-100 bg-gray-50/50">
              <span className="text-xs sm:text-sm font-semibold text-slate-600">Toplam Fark Borç (Tüm Yıllar):</span>
              <span
                className={`text-xs sm:text-sm font-bold px-2.5 py-1 rounded-full ${
                  grandTotalDifference > 0
                    ? "bg-red-50 text-red-600"
                    : grandTotalDifference < 0
                    ? "bg-emerald-50 text-emerald-600"
                    : "bg-gray-100 text-slate-500"
                }`}
              >
                {grandTotalDifference > 0
                  ? `-${grandTotalDifference.toLocaleString("tr-TR")} ₺`
                  : grandTotalDifference < 0
                  ? `+${Math.abs(grandTotalDifference).toLocaleString("tr-TR")} ₺`
                  : "Fark yok"}
              </span>
            </div>
          </>
        )}

        {tenant.expenses.length > 0 && (
          <div className="no-print px-4 sm:px-6 py-3 border-t border-gray-100 bg-amber-50/40">
            <p className="text-[10px] sm:text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1.5">
              Mülke Yapılan Masraflar
            </p>
            <ul className="space-y-1">
              {tenant.expenses.map((exp) => (
                <li key={exp.id} className="flex items-start justify-between gap-2 text-[11px] sm:text-xs text-slate-500 italic">
                  <span>
                    {new Date(exp.date).toLocaleDateString("tr-TR")} — {exp.description}:{" "}
                    <span className="font-semibold text-slate-600">{Number(exp.amount).toLocaleString("tr-TR")} ₺</span>
                    {exp.notes && <span className="not-italic text-slate-400"> ({exp.notes})</span>}
                  </span>
                  <button
                    type="button"
                    onClick={() => deleteExpense(exp.id)}
                    disabled={expenseDeletingId === exp.id}
                    className="not-italic text-red-400 hover:text-red-500 disabled:opacity-50 shrink-0 whitespace-nowrap"
                  >
                    {expenseDeletingId === exp.id ? "..." : "Sil"}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {showEditDebtBatchModal && (
        <Modal title="Borçlandırmayı Düzenle" onClose={() => setShowEditDebtBatchModal(false)}>
          <form onSubmit={submitEditDebtBatch} className="space-y-4">
            {editDebtBatchError && (
              <div className="bg-red-50 border border-red-100 text-red-500 text-sm px-4 py-3 rounded-xl">
                {editDebtBatchError}
              </div>
            )}
            <p className="text-xs text-slate-500">
              Bu işlem, görüntülenen dönemdeki ({periodIndex + 1}. Yıl) tüm ayların tutarını tek seferde düzeltir.
            </p>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Doğru Aylık Tutar (₺)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={editDebtBatchAmount}
                onChange={(e) => setEditDebtBatchAmount(e.target.value)}
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#17B6AE]/30"
              />
            </div>
            <button
              type="submit"
              disabled={editDebtBatchSubmitting}
              className="w-full bg-[#17B6AE] hover:bg-[#149891] disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl transition text-sm"
            >
              {editDebtBatchSubmitting ? "Kaydediliyor..." : "Düzelt"}
            </button>
          </form>
        </Modal>
      )}

      {showExpenseModal && (
        <Modal title="Mülke Yapılan Masraf Ekle" onClose={() => setShowExpenseModal(false)}>
          <form onSubmit={submitExpense} className="space-y-4">
            {expenseError && (
              <div className="bg-red-50 border border-red-100 text-red-500 text-sm px-4 py-3 rounded-xl">
                {expenseError}
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Ne Masrafı Yapıldı</label>
              <input
                type="text"
                value={expenseDescription}
                onChange={(e) => setExpenseDescription(e.target.value)}
                placeholder="Örn. Kombi bakımı, boya badana..."
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#17B6AE]/30"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Tutar (₺)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#17B6AE]/30"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Tarih</label>
                <input
                  type="date"
                  value={expenseDate}
                  onChange={(e) => setExpenseDate(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#17B6AE]/30"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Not (opsiyonel)</label>
              <input
                type="text"
                value={expenseNotes}
                onChange={(e) => setExpenseNotes(e.target.value)}
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#17B6AE]/30"
              />
            </div>
            <button
              type="submit"
              disabled={expenseSubmitting}
              className="w-full bg-[#17B6AE] hover:bg-[#149891] disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl transition text-sm"
            >
              {expenseSubmitting ? "Kaydediliyor..." : "Masrafı Kaydet"}
            </button>
          </form>
        </Modal>
      )}

      {showDebtModal && (
        <Modal title="Kiracıyı Borçlandır" onClose={() => setShowDebtModal(false)}>
          <form onSubmit={submitDebtBatch} className="space-y-4">
            {debtError && (
              <div className="bg-red-50 border border-red-100 text-red-500 text-sm px-4 py-3 rounded-xl">
                {debtError}
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Aylık Kira Bedeli (₺)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={debtAmount}
                onChange={(e) => setDebtAmount(e.target.value)}
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#17B6AE]/30"
              />
              {debtYearlyPreview > 0 && (
                <p className="mt-1.5 text-xs text-slate-500">
                  Yıllık Kira Bedeli: <span className="font-medium text-slate-700">{debtYearlyPreview.toLocaleString("tr-TR")} ₺</span>
                </p>
              )}
            </div>
            <div className="bg-[#17B6AE]/5 border border-[#17B6AE]/20 rounded-xl p-4">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Başlangıç Tarihi</label>
              <input
                type="date"
                value={debtStartDate}
                onChange={(e) => setDebtStartDate(e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#17B6AE]/30 bg-white"
              />
              <p className="mt-2 text-xs text-slate-500">
                Bu tarihten itibaren kiracı 12 ay boyunca borçlandırılacaktır.
              </p>
            </div>
            <button
              type="submit"
              disabled={debtSubmitting}
              className="w-full bg-[#17B6AE] hover:bg-[#149891] disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl transition text-sm"
            >
              {debtSubmitting ? "Kaydediliyor..." : "Borçlandır"}
            </button>
          </form>
        </Modal>
      )}

      {payDebt && (
        <Modal title="Tahsilat Ekle" onClose={() => setPayDebt(null)}>
          <form onSubmit={submitPayment} className="space-y-4">
            {payError && (
              <div className="bg-red-50 border border-red-100 text-red-500 text-sm px-4 py-3 rounded-xl">
                {payError}
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Tahsilat Miktarı (₺)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#17B6AE]/30"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Tarih</label>
              <input
                type="date"
                value={payDate}
                onChange={(e) => setPayDate(e.target.value)}
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#17B6AE]/30"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Dekont Yükle</label>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => setPayFile(e.target.files?.[0] || null)}
                className="w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#17B6AE]/10 file:text-[#17B6AE] hover:file:bg-[#17B6AE]/20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Notlar</label>
              <textarea
                value={payNotes}
                onChange={(e) => setPayNotes(e.target.value)}
                rows={3}
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#17B6AE]/30 resize-none"
              />
            </div>
            <button
              type="submit"
              disabled={paySubmitting}
              className="w-full bg-[#17B6AE] hover:bg-[#149891] disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl transition text-sm"
            >
              {paySubmitting ? "Kaydediliyor..." : "Ödendi Olarak İşaretle"}
            </button>
          </form>
        </Modal>
      )}

      {editDebt && (
        <Modal title="Tahsilatı Düzelt" onClose={() => setEditDebt(null)}>
          <form onSubmit={submitEditPayments} className="space-y-4">
            {editError && (
              <div className="bg-red-50 border border-red-100 text-red-500 text-sm px-4 py-3 rounded-xl">
                {editError}
              </div>
            )}
            {editRows.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">Bu döneme ait tahsilat kaydı kalmadı.</p>
            ) : (
              editRows.map((row, i) => (
                <div key={row.id} className="border border-gray-200 rounded-xl p-3.5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500">Kayıt {i + 1}</span>
                    <button
                      type="button"
                      onClick={() => deleteEditPayment(row.id)}
                      disabled={editDeletingId === row.id}
                      className="text-xs font-semibold text-red-500 hover:text-red-600 disabled:opacity-50 transition"
                    >
                      {editDeletingId === row.id ? "Siliniyor..." : "Sil"}
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">Tutar (₺)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={row.amount}
                        onChange={(e) => updateEditRow(row.id, "amount", e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#17B6AE]/30"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">Tarih</label>
                      <input
                        type="date"
                        value={row.paidAt}
                        onChange={(e) => updateEditRow(row.id, "paidAt", e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#17B6AE]/30"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Not Ekle</label>
                    <input
                      type="text"
                      value={row.notes}
                      onChange={(e) => updateEditRow(row.id, "notes", e.target.value)}
                      placeholder="Örn. Elden ödendi, banka dekontu vb."
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#17B6AE]/30"
                    />
                  </div>
                </div>
              ))
            )}
            {editRows.length > 0 && (
              <button
                type="submit"
                disabled={editSubmitting}
                className="w-full bg-[#17B6AE] hover:bg-[#149891] disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl transition text-sm"
              >
                {editSubmitting ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
              </button>
            )}
          </form>
        </Modal>
      )}
    </div>
  );
}
