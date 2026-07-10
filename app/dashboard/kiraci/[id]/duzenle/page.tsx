"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import StarRating from "@/components/StarRating";

type Property = { id: string; title: string };

const DURATION_OPTIONS = [
  { value: "6", label: "6 Ay" },
  { value: "12", label: "1 Yıl" },
  { value: "24", label: "2 Yıl" },
  { value: "36", label: "3 Yıl" },
  { value: "48", label: "4 Yıl" },
  { value: "60", label: "5 Yıl" },
  { value: "120", label: "10 Yıl" },
  { value: "OTHER", label: "Diğer" },
];

function addMonthsClamped(date: Date, months: number) {
  const day = date.getDate();
  const result = new Date(date.getFullYear(), date.getMonth() + months, 1);
  const lastDay = new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate();
  result.setDate(Math.min(day, lastDay));
  return result;
}

function toDateInput(value: string | null) {
  if (!value) return "";
  return value.slice(0, 10);
}

export default function KiraciDuzenlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [properties, setProperties] = useState<Property[]>([]);

  const [propertyId, setPropertyId] = useState("");
  const [tenantType, setTenantType] = useState<"INDIVIDUAL" | "CORPORATE">("INDIVIDUAL");
  const [nationalId, setNationalId] = useState("");
  const [taxNumber, setTaxNumber] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [notificationAddress, setNotificationAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [rating, setRating] = useState(0);

  const [contractStart, setContractStart] = useState("");
  const [rentRevisionDate, setRentRevisionDate] = useState("");
  const [rentPaymentDate, setRentPaymentDate] = useState("");
  const [durationOption, setDurationOption] = useState("12");
  const [customMonths, setCustomMonths] = useState("");
  const [monthlyRent, setMonthlyRent] = useState("");
  const [paymentFrequency, setPaymentFrequency] = useState<"MONTHLY" | "YEARLY">("MONTHLY");
  const [increaseType, setIncreaseType] = useState<"TUFE" | "CUSTOM">("TUFE");
  const [increaseRate, setIncreaseRate] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [depositCurrency, setDepositCurrency] = useState<"TRY" | "USD" | "EUR">("TRY");
  const [contractFile, setContractFile] = useState<File | null>(null);
  const [contractNotes, setContractNotes] = useState("");

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [propsRes, tenantRes] = await Promise.all([
        fetch("/api/dashboard/properties?all=1"),
        fetch(`/api/dashboard/tenants/${id}`),
      ]);
      const propsData = await propsRes.json();
      setProperties(propsData.properties || []);

      if (tenantRes.ok) {
        const { tenant } = await tenantRes.json();
        setPropertyId(tenant.property.id);
        setTenantType(tenant.tenantType || "INDIVIDUAL");
        setNationalId(tenant.nationalId || "");
        setTaxNumber(tenant.taxNumber || "");
        setFullName(tenant.fullName || "");
        setPhone((tenant.phone || "").replace(/^\+90/, ""));
        setNotificationAddress(tenant.notificationAddress || "");
        setNotes(tenant.notes || "");
        setRating(tenant.rating || 0);
        setContractStart(toDateInput(tenant.contractStart));
        setRentRevisionDate(toDateInput(tenant.rentRevisionDate));
        setRentPaymentDate(toDateInput(tenant.rentPaymentDate));
        setDurationOption(
          tenant.contractDurationMonths &&
            DURATION_OPTIONS.some((d) => d.value === String(tenant.contractDurationMonths))
            ? String(tenant.contractDurationMonths)
            : tenant.contractDurationMonths
            ? "OTHER"
            : "12"
        );
        if (tenant.contractDurationMonths && !DURATION_OPTIONS.some((d) => d.value === String(tenant.contractDurationMonths))) {
          setCustomMonths(String(tenant.contractDurationMonths));
        }
        setMonthlyRent(tenant.monthlyRent || "");
        setPaymentFrequency(tenant.paymentFrequency || "MONTHLY");
        setIncreaseType(tenant.increaseType || "TUFE");
        setIncreaseRate(tenant.increaseRate || "");
        setDepositAmount(tenant.depositAmount || "");
        setDepositCurrency(tenant.depositCurrency || "TRY");
        setContractNotes(tenant.contractNotes || "");
      }
      setLoading(false);
    }
    load();
  }, [id]);

  const durationMonths =
    durationOption === "OTHER" ? Number(customMonths) || 0 : Number(durationOption);

  const computedEnd =
    contractStart && durationMonths
      ? addMonthsClamped(new Date(contractStart), durationMonths)
      : null;

  const yearlyRent = monthlyRent ? Number(monthlyRent) * 12 : 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!propertyId || !fullName.trim() || !monthlyRent) {
      setError("Mülk, ad soyad ve aylık kira zorunludur.");
      return;
    }

    setSubmitting(true);

    const fd = new FormData();
    fd.set("propertyId", propertyId);
    fd.set("fullName", fullName);
    fd.set("tenantType", tenantType);
    if (tenantType === "INDIVIDUAL") fd.set("nationalId", nationalId);
    else fd.set("taxNumber", taxNumber);
    fd.set("phone", phone ? `+90${phone}` : "");
    fd.set("notificationAddress", notificationAddress);
    fd.set("notes", notes);
    if (rating) fd.set("rating", String(rating));

    fd.set("contractStart", contractStart);
    fd.set("rentRevisionDate", rentRevisionDate);
    fd.set("rentPaymentDate", rentPaymentDate);
    fd.set("contractDurationMonths", String(durationMonths || ""));
    fd.set("monthlyRent", monthlyRent);
    fd.set("paymentFrequency", paymentFrequency);
    fd.set("increaseType", increaseType);
    if (increaseType === "CUSTOM") fd.set("increaseRate", increaseRate);
    fd.set("depositAmount", depositAmount);
    fd.set("depositCurrency", depositCurrency);
    fd.set("contractNotes", contractNotes);
    if (contractFile) fd.set("contractFile", contractFile);

    const res = await fetch(`/api/dashboard/tenants/${id}`, {
      method: "PATCH",
      body: fd,
    });

    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Kiracı güncellenemedi.");
      return;
    }

    router.push(`/dashboard/kiraci/${id}`);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-6 h-6 border-2 border-[#17B6AE] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Kiracı Düzenle</h1>
        <p className="text-sm text-slate-500 mt-1">{fullName}</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
        {error && (
          <div className="bg-red-50 border border-red-100 text-red-500 text-sm px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Kiracı Bilgileri</p>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Mülk *</label>
          <select
            required
            value={propertyId}
            onChange={(e) => setPropertyId(e.target.value)}
            className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#17B6AE]/30 bg-white"
          >
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-2">Kiracı Tipi</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setTenantType("INDIVIDUAL")}
              className={`text-sm font-medium rounded-lg border px-3 py-2.5 transition ${
                tenantType === "INDIVIDUAL"
                  ? "bg-[#17B6AE] text-white border-[#17B6AE]"
                  : "bg-white text-slate-600 border-gray-300 hover:border-[#17B6AE]"
              }`}
            >
              Bireysel
            </button>
            <button
              type="button"
              onClick={() => setTenantType("CORPORATE")}
              className={`text-sm font-medium rounded-lg border px-3 py-2.5 transition ${
                tenantType === "CORPORATE"
                  ? "bg-[#17B6AE] text-white border-[#17B6AE]"
                  : "bg-white text-slate-600 border-gray-300 hover:border-[#17B6AE]"
              }`}
            >
              Kurumsal
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Ad Soyad *</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#17B6AE]/30"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              {tenantType === "INDIVIDUAL" ? "TC Kimlik No" : "Vergi No"}
            </label>
            <input
              type="text"
              value={tenantType === "INDIVIDUAL" ? nationalId : taxNumber}
              onChange={(e) =>
                tenantType === "INDIVIDUAL"
                  ? setNationalId(e.target.value)
                  : setTaxNumber(e.target.value)
              }
              className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#17B6AE]/30"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Telefon Numarası</label>
          <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-[#17B6AE]/30">
            <span className="flex items-center gap-1.5 px-3 py-2.5 bg-gray-50 border-r border-gray-200 text-sm text-slate-600">
              <span>🇹🇷</span>
              <span>+90</span>
            </span>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
              placeholder="5xx xxx xx xx"
              className="w-full px-3 py-2.5 text-sm focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Tebligat Adresi</label>
          <input
            type="text"
            value={notificationAddress}
            onChange={(e) => setNotificationAddress(e.target.value)}
            className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#17B6AE]/30"
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

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-2">Kiracıyı Puanlayın</label>
          <StarRating value={rating} onChange={setRating} />
        </div>

        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest pt-2">Kira Sözleşmesi</p>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Sözleşme Başlangıç</label>
            <input
              type="date"
              value={contractStart}
              onChange={(e) => setContractStart(e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#17B6AE]/30"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Kira Düzenlenme Tarihi</label>
            <input
              type="date"
              value={rentRevisionDate}
              onChange={(e) => setRentRevisionDate(e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#17B6AE]/30"
            />
          </div>
        </div>

        <div className="bg-[#17B6AE]/5 border border-[#17B6AE]/20 rounded-xl p-4">
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Kira Ödeme Tarihi</label>
          <input
            type="date"
            value={rentPaymentDate}
            onChange={(e) => setRentPaymentDate(e.target.value)}
            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#17B6AE]/30 bg-white"
          />
          <p className="mt-2 text-xs text-slate-500">
            Bu tarihten itibaren kiracı 12 ay boyunca borçlandırılacaktır.
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-2">Sözleşme Süresi</label>
          <div className="grid grid-cols-4 gap-2">
            {DURATION_OPTIONS.map((d) => (
              <button
                key={d.value}
                type="button"
                onClick={() => setDurationOption(d.value)}
                className={`text-sm rounded-lg border px-3 py-2 transition ${
                  durationOption === d.value
                    ? "bg-[#17B6AE] text-white border-[#17B6AE]"
                    : "bg-white text-slate-600 border-gray-300 hover:border-[#17B6AE]"
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
          {durationOption === "OTHER" && (
            <input
              type="number"
              min="1"
              placeholder="Kaç ay?"
              value={customMonths}
              onChange={(e) => setCustomMonths(e.target.value)}
              className="mt-2 w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#17B6AE]/30"
            />
          )}
          {computedEnd && (
            <p className="mt-2 text-xs text-slate-500">
              Sözleşme bitiş tarihi: <span className="font-medium text-slate-700">{computedEnd.toLocaleDateString("tr-TR")}</span>
            </p>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Aylık Kira Bedeli (₺) *</label>
          <input
            type="number"
            required
            min="0"
            step="0.01"
            value={monthlyRent}
            onChange={(e) => setMonthlyRent(e.target.value)}
            className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#17B6AE]/30"
          />
          {yearlyRent > 0 && (
            <p className="mt-1.5 text-xs text-slate-500">
              Yıllık Kira Bedeli: <span className="font-medium text-slate-700">{yearlyRent.toLocaleString("tr-TR")} ₺</span>
            </p>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-2">Ödeme Şekli</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setPaymentFrequency("MONTHLY")}
              className={`text-sm font-medium rounded-lg border px-3 py-2.5 transition ${
                paymentFrequency === "MONTHLY"
                  ? "bg-[#17B6AE] text-white border-[#17B6AE]"
                  : "bg-white text-slate-600 border-gray-300 hover:border-[#17B6AE]"
              }`}
            >
              Aylık
            </button>
            <button
              type="button"
              onClick={() => setPaymentFrequency("YEARLY")}
              className={`text-sm font-medium rounded-lg border px-3 py-2.5 transition ${
                paymentFrequency === "YEARLY"
                  ? "bg-[#17B6AE] text-white border-[#17B6AE]"
                  : "bg-white text-slate-600 border-gray-300 hover:border-[#17B6AE]"
              }`}
            >
              Yıllık
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-2">Artış Oranı</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setIncreaseType("TUFE")}
              className={`text-sm font-medium rounded-lg border px-3 py-2.5 transition ${
                increaseType === "TUFE"
                  ? "bg-[#17B6AE] text-white border-[#17B6AE]"
                  : "bg-white text-slate-600 border-gray-300 hover:border-[#17B6AE]"
              }`}
            >
              TUFE
            </button>
            <button
              type="button"
              onClick={() => setIncreaseType("CUSTOM")}
              className={`text-sm font-medium rounded-lg border px-3 py-2.5 transition ${
                increaseType === "CUSTOM"
                  ? "bg-[#17B6AE] text-white border-[#17B6AE]"
                  : "bg-white text-slate-600 border-gray-300 hover:border-[#17B6AE]"
              }`}
            >
              Özel Hükümler
            </button>
          </div>
          {increaseType === "CUSTOM" && (
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="Kaç %?"
              value={increaseRate}
              onChange={(e) => setIncreaseRate(e.target.value)}
              className="mt-2 w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#17B6AE]/30"
            />
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Depozito</label>
          <div className="flex gap-2">
            <input
              type="number"
              min="0"
              step="0.01"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#17B6AE]/30"
            />
            <select
              value={depositCurrency}
              onChange={(e) => setDepositCurrency(e.target.value as "TRY" | "USD" | "EUR")}
              className="px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#17B6AE]/30 bg-white"
            >
              <option value="TRY">TL</option>
              <option value="USD">Dolar</option>
              <option value="EUR">Euro</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Sözleşme Dosyası</label>
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={(e) => setContractFile(e.target.files?.[0] || null)}
            className="w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#17B6AE]/10 file:text-[#17B6AE] hover:file:bg-[#17B6AE]/20"
          />
          <p className="mt-1.5 text-xs text-slate-500">Yeni dosya yüklemezseniz mevcut sözleşme korunur.</p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Sözleşme Notları</label>
          <textarea
            value={contractNotes}
            onChange={(e) => setContractNotes(e.target.value)}
            rows={3}
            className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#17B6AE]/30 resize-none"
          />
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="bg-[#17B6AE] hover:bg-[#149891] disabled:opacity-60 text-white font-semibold px-6 py-2.5 rounded-xl transition text-sm"
          >
            {submitting ? "Kaydediliyor..." : "Kaydet"}
          </button>
          <a href={`/dashboard/kiraci/${id}`} className="text-sm text-slate-500 hover:text-slate-700">
            Vazgeç
          </a>
        </div>
      </form>
    </div>
  );
}
