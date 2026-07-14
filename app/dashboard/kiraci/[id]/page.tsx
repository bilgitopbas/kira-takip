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
  payments: { amount: string }[];
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
};

const MONTH_NAMES = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
];

const CURRENCY_SYMBOLS: Record<string, string> = { TRY: "₺", USD: "$", EUR: "€" };

function formatDebtDate(dueDate: string) {
  const date = new Date(dueDate);
  return `${date.getDate()} ${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;
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
    const totalAmount = currentPeriod.reduce((sum, d) => sum + Number(d.amount), 0);
    const totalPaid = currentPeriod.reduce((sum, d) => sum + getTotalPaid(d.payments), 0);
    return { totalAmount, totalPaid, difference: totalAmount - totalPaid };
  }, [currentPeriod]);

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
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-800">Ödeme Planı</h2>
          <button
            onClick={openDebtModal}
            className="no-print bg-[#17B6AE] hover:bg-[#149891] text-white font-semibold px-4 py-2 rounded-xl transition text-sm"
          >
            Kiracıyı Borçlandır
          </button>
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
            <table className="w-full text-base">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider border-r border-gray-100">Ay / Yıl</th>
                  <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider border-r border-gray-100">Kira Tutarı</th>
                  <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider border-r border-gray-100">Kira Ödemesi</th>
                  <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider border-r border-gray-100">Durum</th>
                  <th className="no-print px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {currentPeriod.map((d) => {
                  const effective = getEffectiveDebtStatus(d);
                  const totalPaid = getTotalPaid(d.payments);
                  return (
                    <tr key={d.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-5 py-3.5 text-slate-800 font-semibold border-r border-gray-100">
                        {formatDebtDate(d.dueDate)}
                      </td>
                      <td className="px-5 py-3.5 text-slate-700 border-r border-gray-100">
                        {Number(d.amount).toLocaleString("tr-TR")} ₺
                      </td>
                      <td className="px-5 py-3.5 border-r border-gray-100">
                        {totalPaid > 0 ? (
                          <>
                            <span className={effective === "PARTIAL" ? "text-blue-600 font-semibold" : "text-slate-700"}>
                              {totalPaid.toLocaleString("tr-TR")} ₺
                            </span>
                            {effective === "PARTIAL" && (
                              <div className="text-xs text-blue-500 font-medium mt-0.5">Kısmi ödeme yapıldı</div>
                            )}
                          </>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 border-r border-gray-100">
                        <span className={`text-xs px-3 py-1.5 rounded-full font-semibold ${DEBT_STATUS_STYLES[effective]}`}>
                          {DEBT_STATUS_LABELS[effective]}
                        </span>
                      </td>
                      <td className="no-print px-5 py-3.5 text-right">
                        {effective !== "PAID" && (
                          <button
                            onClick={() => openPayModal(d)}
                            className="text-xs px-3 py-1.5 rounded-lg font-semibold bg-[#17B6AE]/10 text-[#17B6AE] hover:bg-[#17B6AE]/20 transition"
                          >
                            Ödendi Olarak İşaretle
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50 border-t-2 border-gray-200 font-bold">
                  <td className="px-5 py-3.5 text-slate-800 border-r border-gray-100">Toplam</td>
                  <td className="px-5 py-3.5 text-slate-800 border-r border-gray-100">
                    {periodTotals.totalAmount.toLocaleString("tr-TR")} ₺
                  </td>
                  <td className="px-5 py-3.5 border-r border-gray-100" colSpan={2}>
                    <span className="text-slate-800">{periodTotals.totalPaid.toLocaleString("tr-TR")} ₺</span>
                    <span
                      className={`ml-3 text-xs px-2.5 py-1 rounded-full font-semibold ${
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
          </>
        )}
      </div>

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
    </div>
  );
}
