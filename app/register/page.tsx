"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const ACCOUNT_TYPES = [
  { value: "PROPERTY_OWNER", label: "Mülk Sahibi" },
  { value: "REAL_ESTATE_AGENT", label: "Emlakçı / Danışman" },
  { value: "LAWYER", label: "Avukat" },
  { value: "AUTHORIZED_REPRESENTATIVE", label: "Yetkili Temsilci" },
  { value: "OTHER", label: "Diğer" },
];

const PROPERTY_COUNT_RANGES = [
  { value: "RANGE_1_3", label: "1-3" },
  { value: "RANGE_3_5", label: "3-5" },
  { value: "RANGE_5_10", label: "5-10" },
  { value: "RANGE_10_25", label: "10-25" },
  { value: "RANGE_25_50", label: "25-50" },
  { value: "RANGE_50_PLUS", label: "50+" },
];

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    city: "",
    password: "",
    wantsManagement: false,
    accountType: "",
    accountTypeOther: "",
    propertyCountRange: "",
    termsAccepted: false,
    marketingConsent: false,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!form.termsAccepted) {
      setError("Devam etmek için Kullanıcı Sözleşmesi'ni kabul etmeniz gerekiyor.");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Bir hata oluştu.");
      return;
    }

    router.push("/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-10">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <h1 className="text-2xl font-semibold text-slate-800 mb-1">Kayıt Ol</h1>
        <p className="text-sm text-slate-500 mb-6">45 gün ücretsiz deneme ile başlayın</p>

        {error && (
          <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Ad Soyad *</label>
            <input
              type="text"
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#17B6AE]"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">E-posta *</label>
            <input
              type="email"
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#17B6AE]"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Telefon</label>
            <input
              type="tel"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#17B6AE]"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Bulunduğunuz Şehir *</label>
            <input
              type="text"
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#17B6AE]"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Şifre *</label>
            <input
              type="password"
              required
              minLength={6}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#17B6AE]"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Hesap Türü</label>
            <div className="grid grid-cols-2 gap-2">
              {ACCOUNT_TYPES.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setForm({ ...form, accountType: opt.value })}
                  className={`text-sm rounded-lg border px-3 py-2 transition ${
                    form.accountType === opt.value
                      ? "bg-[#17B6AE] text-white border-[#17B6AE]"
                      : "bg-white text-slate-600 border-gray-300 hover:border-[#17B6AE]"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {form.accountType === "OTHER" && (
              <input
                type="text"
                placeholder="Lütfen belirtin"
                className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#17B6AE]"
                value={form.accountTypeOther}
                onChange={(e) => setForm({ ...form, accountTypeOther: e.target.value })}
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Mülk Sayısı *</label>
            <div className="grid grid-cols-3 gap-2">
              {PROPERTY_COUNT_RANGES.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setForm({ ...form, propertyCountRange: opt.value })}
                  className={`text-sm rounded-lg border px-3 py-2 transition ${
                    form.propertyCountRange === opt.value
                      ? "bg-[#17B6AE] text-white border-[#17B6AE]"
                      : "bg-white text-slate-600 border-gray-300 hover:border-[#17B6AE]"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-start gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              className="mt-1"
              checked={form.wantsManagement}
              onChange={(e) => setForm({ ...form, wantsManagement: e.target.checked })}
            />
            Profesyonel mülk yönetimi hizmeti almak istiyorum
          </label>

          <label className="flex items-start gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              required
              className="mt-1"
              checked={form.termsAccepted}
              onChange={(e) => setForm({ ...form, termsAccepted: e.target.checked })}
            />
            Kullanıcı Sözleşmesi&apos;ni okudum, anladım ve kabul ediyorum.
          </label>

          <label className="flex items-start gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              className="mt-1"
              checked={form.marketingConsent}
              onChange={(e) => setForm({ ...form, marketingConsent: e.target.checked })}
            />
            Aydınlatma Metni&apos;nde belirtilen şartlarda kişisel verilerimin işlenmesine
            Açık Rıza gösteriyorum.
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#17B6AE] hover:bg-[#149891] text-white font-medium rounded-lg py-2.5 text-sm transition disabled:opacity-60"
          >
            {loading ? "Kayıt yapılıyor..." : "Kayıt Ol"}
          </button>
        </form>

        <p className="text-sm text-slate-500 mt-4 text-center">
          Zaten hesabınız var mı?{" "}
          <a href="/login" className="text-[#17B6AE] font-medium">Giriş Yap</a>
        </p>
      </div>
    </div>
  );
}