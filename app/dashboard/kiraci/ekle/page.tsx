"use client";

import { useEffect, useState } from "react";
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

export default function KiraciEklePage() {
  const router = useRouter();
  const [step, setStep] = useState(1);

  const [properties, setProperties] = useState<Property[]>([]);
  const [loadingProperties, setLoadingProperties] = useState(true);

  // Adim 1
  const [propertyId, setPropertyId] = useState("");
  const [tenantType, setTenantType] = useState<"INDIVIDUAL" | "CORPORATE">("INDIVIDUAL");
  const [nationalId, setNationalId] = useState("");
  const [taxNumber, setTaxNumber] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [notificationAddress, setNotificationAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [rating, setRating] = useState(0);

  // Adim 2
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
    async function loadProperties() {
      setLoadingProperties(true);
      const res = await fetch("/api/dashboard/properties");
      const data = await res.json();
      const list: Property[] = data.properties || [];
      setProperties(list);
      if (list.length > 0) setPropertyId(list[0].id);
      setLoadingProperties(false);
    }
    loadProperties();
  }, []);

  const durationMonths =
    durationOption === "OTHER" ? Number(customMonths) || 0 : Number(durationOption);

  const computedEnd =
    contractStart && durationMonths
      ? addMonthsClamped(new Date(contractStart), durationMonths)
      : null;

  const yearlyRent = monthlyRent ? Number(monthlyRent) * 12 : 0;

  function goToStep2(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!propertyId || !fullName.trim()) {
      setError("Mulk ve ad soyad zorunludur.");
      return;
    }
    setStep(2);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!monthlyRent) {
      setError("Aylik kira bedeli zorunludur.");
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

    const res = await fetch("/api/dashboard/tenants", {
      method: "POST",
      body: fd,
    });

    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Kiraci olusturulamadi.");
      return;
    }

    router.push("/dashboard/kiraci");
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Kiraci Ekle</h1>
        <p className="text-sm text-slate-400 mt-1">
          Adim {step}/2 — {step === 1 ? "Kiraci Bilgileri" : "Kira Sozlesmesi"}
        </p>
      </div>

      <div className="flex items-center gap-2 mb-6">
        <div className={`h-1.5 flex-1 rounded-full ${step >= 1 ? "bg-[#17B6AE]" : "bg-gray-200"}`} />
        <div className={`h-1.5 flex-1 rounded-full ${step >= 2 ? "bg-[#17B6AE]" : "bg-gray-200"}`} />
      </div>

      {!loadingProperties && properties.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
          <p className="text-sm text-slate-500 mb-4">
            Kiraci ekleyebilmek icin once bir mulk eklemeniz gerekiyor.
          </p>
          <a
            href="/dashboard/mulk/ekle"
            className="inline-flex bg-[#17B6AE] hover:bg-[#149891] text-white font-semibold px-6 py-3 rounded-xl transition text-sm"
          >
            Mulk Ekle
          </a>
        </div>
      ) : step === 1 ? (
        <form onSubmit={goToStep2} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-500 text-sm px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Mulk *</label>
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
            <label className="block text-xs font-semibold text-slate-500 mb-2">Kiraci Tipi</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTenantType("INDIVIDUAL")}
                className={`text-sm font-medium rounded-lg border px-3 py-2.5 transition ${
                  tenantType === "INDIVIDUAL"
                    ? "bg-[#17B6AE] text-white border-[#17B6AE]"
                    : "bg-white text-slate-500 border-gray-300 hover:border-[#17B6AE]"
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
                    : "bg-white text-slate-500 border-gray-300 hover:border-[#17B6AE]"
                }`}
              >
                Kurumsal
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Ad Soyad *</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#17B6AE]/30"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">
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
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Telefon Numarasi</label>
            <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-[#17B6AE]/30">
              <span className="flex items-center gap-1.5 px-3 py-2.5 bg-gray-50 border-r border-gray-200 text-sm text-slate-500">
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
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Tebligat Adresi</label>
            <input
              type="text"
              value={notificationAddress}
              onChange={(e) => setNotificationAddress(e.target.value)}
              className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#17B6AE]/30"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Notlar</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#17B6AE]/30 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-2">Kiraciyi Puanlayin</label>
            <StarRating value={rating} onChange={setRating} />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              className="bg-[#17B6AE] hover:bg-[#149891] text-white font-semibold px-6 py-2.5 rounded-xl transition text-sm"
            >
              Ileri
            </button>
            <a href="/dashboard/kiraci" className="text-sm text-slate-400 hover:text-slate-600">
              Vazgec
            </a>
          </div>
        </form>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-500 text-sm px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                Sozlesme Baslangic
              </label>
              <input
                type="date"
                value={contractStart}
                onChange={(e) => setContractStart(e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#17B6AE]/30"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                Kira Duzenlenme Tarihi
              </label>
              <input
                type="date"
                value={rentRevisionDate}
                onChange={(e) => setRentRevisionDate(e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#17B6AE]/30"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                Kira Odeme Tarihi
              </label>
              <input
                type="date"
                value={rentPaymentDate}
                onChange={(e) => setRentPaymentDate(e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#17B6AE]/30"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-2">Sozlesme Suresi</label>
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
                placeholder="Kac ay?"
                value={customMonths}
                onChange={(e) => setCustomMonths(e.target.value)}
                className="mt-2 w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#17B6AE]/30"
              />
            )}
            {computedEnd && (
              <p className="mt-2 text-xs text-slate-400">
                Sozlesme bitis tarihi: <span className="font-medium text-slate-600">{computedEnd.toLocaleDateString("tr-TR")}</span>
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">
              Aylik Kira Bedeli (₺) *
            </label>
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
              <p className="mt-1.5 text-xs text-slate-400">
                Yillik Kira Bedeli: <span className="font-medium text-slate-600">{yearlyRent.toLocaleString("tr-TR")} ₺</span>
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-2">Odeme Sekli</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaymentFrequency("MONTHLY")}
                className={`text-sm font-medium rounded-lg border px-3 py-2.5 transition ${
                  paymentFrequency === "MONTHLY"
                    ? "bg-[#17B6AE] text-white border-[#17B6AE]"
                    : "bg-white text-slate-500 border-gray-300 hover:border-[#17B6AE]"
                }`}
              >
                Aylik
              </button>
              <button
                type="button"
                onClick={() => setPaymentFrequency("YEARLY")}
                className={`text-sm font-medium rounded-lg border px-3 py-2.5 transition ${
                  paymentFrequency === "YEARLY"
                    ? "bg-[#17B6AE] text-white border-[#17B6AE]"
                    : "bg-white text-slate-500 border-gray-300 hover:border-[#17B6AE]"
                }`}
              >
                Yillik
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-2">Artis Orani</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setIncreaseType("TUFE")}
                className={`text-sm font-medium rounded-lg border px-3 py-2.5 transition ${
                  increaseType === "TUFE"
                    ? "bg-[#17B6AE] text-white border-[#17B6AE]"
                    : "bg-white text-slate-500 border-gray-300 hover:border-[#17B6AE]"
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
                    : "bg-white text-slate-500 border-gray-300 hover:border-[#17B6AE]"
                }`}
              >
                Ozel Hukumler
              </button>
            </div>
            {increaseType === "CUSTOM" && (
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="Kac %?"
                value={increaseRate}
                onChange={(e) => setIncreaseRate(e.target.value)}
                className="mt-2 w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#17B6AE]/30"
              />
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Depozito</label>
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
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Sozlesme Dosyasi</label>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => setContractFile(e.target.files?.[0] || null)}
              className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#17B6AE]/10 file:text-[#17B6AE] hover:file:bg-[#17B6AE]/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Sozlesme Notlari</label>
            <textarea
              value={contractNotes}
              onChange={(e) => setContractNotes(e.target.value)}
              rows={3}
              className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#17B6AE]/30 resize-none"
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="bg-gray-50 hover:bg-gray-100 text-slate-600 font-semibold px-6 py-2.5 rounded-xl transition text-sm border border-gray-200"
            >
              Geri
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="bg-[#17B6AE] hover:bg-[#149891] disabled:opacity-60 text-white font-semibold px-6 py-2.5 rounded-xl transition text-sm"
            >
              {submitting ? "Kaydediliyor..." : "Kaydet"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
