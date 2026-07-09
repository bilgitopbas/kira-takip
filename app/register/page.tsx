"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import TiltCard from "@/components/motion/TiltCard";

const ACCOUNT_TYPES = [
  {
    value: "PROPERTY_OWNER",
    label: "Mülk Sahibi",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 21V12h6v9" />
      </svg>
    ),
  },
  {
    value: "REAL_ESTATE_AGENT",
    label: "Emlakçı / Danışman",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18M5 21V7l8-4v18M13 21V11l6 3v7M9 9v.01M9 12v.01M9 15v.01" />
      </svg>
    ),
  },
  {
    value: "LAWYER",
    label: "Avukat",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18M5 7l-3 6a3 3 0 006 0l-3-6zM19 7l-3 6a3 3 0 006 0l-3-6zM5 7h14M8 21h8" />
      </svg>
    ),
  },
  {
    value: "AUTHORIZED_REPRESENTATIVE",
    label: "Yetkili Temsilci",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <circle cx="12" cy="8" r="4" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 21v-1a6 6 0 016-6h1M17 15l2 2 4-4" />
      </svg>
    ),
  },
  {
    value: "OTHER",
    label: "Diğer",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <circle cx="5" cy="12" r="1.5" fill="currentColor" stroke="none" />
        <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
        <circle cx="19" cy="12" r="1.5" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
];

const PROPERTY_COUNT_RANGES = [
  { value: "RANGE_1_3", label: "1-3" },
  { value: "RANGE_3_5", label: "3-5" },
  { value: "RANGE_5_10", label: "5-10" },
  { value: "RANGE_10_25", label: "10-25" },
  { value: "RANGE_25_50", label: "25-50" },
  { value: "RANGE_50_PLUS", label: "50+" },
];

const inputClass =
  "w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm shadow-sm transition focus:outline-none focus:ring-2 focus:ring-[#17B6AE]/40 focus:border-[#17B6AE]";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    city: "",
    password: "",
    passwordRepeat: "",
    accountType: "",
    accountTypeOther: "",
    propertyCountRange: "",
    termsAccepted: false,
    marketingConsent: false,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [illustrationFailed, setIllustrationFailed] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (form.password !== form.passwordRepeat) {
      setError("Şifreler eşleşmiyor.");
      return;
    }

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
    <div className="min-h-screen flex bg-gray-50">
      {/* Sol: Form */}
      <div className="w-full lg:w-[52%] flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="flex justify-center mb-6">
            <TiltCard>
              <Image
                src="/logo-yeni-white.png"
                alt="Mizan Mülk Yönetimi"
                width={311}
                height={100}
                className="h-14 w-auto object-contain drop-shadow-[0_8px_16px_rgba(23,182,174,0.25)]"
                style={{ width: "auto" }}
                priority
              />
            </TiltCard>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <h1 className="text-2xl font-semibold text-slate-800 mb-1 text-center">Kayıt Ol</h1>
            <p className="text-sm text-slate-500 mb-6 text-center">45 gün ücretsiz deneme ile başlayın</p>

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
                  className={inputClass}
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">E-posta *</label>
                <input
                  type="email"
                  required
                  className={inputClass}
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Telefon</label>
                <input
                  type="tel"
                  className={inputClass}
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Bulunduğunuz Şehir *</label>
                <input
                  type="text"
                  required
                  className={inputClass}
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Şifre *</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    className={inputClass}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Şifre Tekrar *</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    className={inputClass}
                    value={form.passwordRepeat}
                    onChange={(e) => setForm({ ...form, passwordRepeat: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Hesap Türü</label>
                <div className="grid grid-cols-2 gap-2">
                  {ACCOUNT_TYPES.map((opt) => {
                    const active = form.accountType === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setForm({ ...form, accountType: opt.value })}
                        className={`flex items-center gap-2 text-sm rounded-xl border px-3 py-2.5 transition ${
                          active
                            ? "bg-[#17B6AE] text-white border-[#17B6AE] shadow-md shadow-[#17B6AE]/25"
                            : "bg-white text-slate-600 border-gray-200 hover:border-[#17B6AE] hover:text-[#17B6AE]"
                        }`}
                      >
                        <span className={active ? "text-white" : "text-[#17B6AE]"}>{opt.icon}</span>
                        {opt.label}
                      </button>
                    );
                  })}
                </div>

                {form.accountType === "OTHER" && (
                  <input
                    type="text"
                    placeholder="Lütfen belirtin"
                    className={`mt-2 ${inputClass}`}
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
                      className={`text-sm rounded-xl border px-3 py-2 transition ${
                        form.propertyCountRange === opt.value
                          ? "bg-[#17B6AE] text-white border-[#17B6AE] shadow-md shadow-[#17B6AE]/25"
                          : "bg-white text-slate-600 border-gray-200 hover:border-[#17B6AE]"
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
                className="w-full bg-[#17B6AE] hover:bg-[#149891] text-white font-semibold rounded-xl py-3 text-sm transition disabled:opacity-60 shadow-md shadow-[#17B6AE]/25"
              >
                {loading ? "Kayıt yapılıyor..." : "Kayıt Ol"}
              </button>
            </form>

            <p className="text-sm text-slate-500 mt-5 text-center">
              Zaten hesabınız var mı?{" "}
              <a href="/login" className="text-[#17B6AE] font-medium">Giriş Yap</a>
            </p>
          </div>
        </div>
      </div>

      {/* Sağ: Görsel Panel */}
      <div className="hidden lg:flex w-[48%] items-center justify-center bg-gradient-to-br from-[#17B6AE]/15 via-[#17B6AE]/5 to-white relative overflow-hidden">
        <div className="absolute w-96 h-96 bg-[#17B6AE]/20 rounded-full blur-3xl -top-20 -right-20" />
        <div className="absolute w-72 h-72 bg-[#17B6AE]/10 rounded-full blur-3xl bottom-0 left-0" />
        {!illustrationFailed && (
          <img
            src="/register-illustration.png"
            alt="Mizan Mülk Yönetimi"
            className="relative z-10 max-w-[85%] max-h-[80%] object-contain"
            onError={() => setIllustrationFailed(true)}
          />
        )}
      </div>
    </div>
  );
}
