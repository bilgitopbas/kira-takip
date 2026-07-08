"use client";

import { useEffect, useState, use } from "react";
import Modal from "@/components/Modal";
import {
  getEffectiveDebtStatus,
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
  monthlyRent: string;
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
    <div className="flex items-center justify-between py-2 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="text-slate-800 font-medium text-right">{value ?? "—"}</span>
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
    setPayAmount(debt.amount);
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
      <div className="mb-6 flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-[#17B6AE] uppercase tracking-wider mb-1">
            {tenant.property.title}
          </p>
          <h1 className="text-3xl font-bold text-slate-900">{tenant.fullName}</h1>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={`/dashboard/kiraci/${tenant.id}/duzenle`}
            className="bg-white border border-gray-200 hover:border-[#17B6AE] text-slate-700 font-semibold px-4 py-2 rounded-xl transition text-sm"
          >
            Düzenle
          </a>
          <a
            href="/dashboard/kiraci"
            className="text-sm text-slate-500 hover:text-slate-700 px-2"
          >
            Geri
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
          <h2 className="text-sm font-bold text-slate-800 mb-3">Kiracı Bilgileri</h2>
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
          <h2 className="text-sm font-bold text-slate-800 mb-3">Kira Sözleşmesi</h2>
          <InfoRow
            label="Aylık Kira"
            value={`${Number(tenant.monthlyRent).toLocaleString("tr-TR")} ₺`}
          />
          <InfoRow
            label="Yıllık Kira"
            value={`${(Number(tenant.monthlyRent) * 12).toLocaleString("tr-TR")} ₺`}
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
        <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800">Ödeme Planı</h2>
          <button
            onClick={openDebtModal}
            className="bg-[#17B6AE] hover:bg-[#149891] text-white font-semibold px-4 py-2 rounded-xl transition text-sm"
          >
            Kiracıyı Borçlandır
          </button>
        </div>

        {tenant.debts.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-10">
            Henüz borç kaydı yok. &quot;Kiracıyı Borçlandır&quot; ile 12 aylık plan oluşturun.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Ay / Yıl</th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tutar</th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Durum</th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {tenant.debts.map((d) => {
                const effective = getEffectiveDebtStatus(d.status, d.dueDate);
                return (
                  <tr key={d.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-5 py-3 text-slate-800 font-medium">
                      {MONTH_NAMES[d.month - 1]} {d.year}
                    </td>
                    <td className="px-5 py-3 text-slate-700">
                      {Number(d.amount).toLocaleString("tr-TR")} ₺
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${DEBT_STATUS_STYLES[effective]}`}>
                        {DEBT_STATUS_LABELS[effective]}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
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
          </table>
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
