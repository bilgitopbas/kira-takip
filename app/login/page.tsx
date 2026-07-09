"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import TiltCard from "@/components/motion/TiltCard";

const inputClass =
  "w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm shadow-sm transition focus:outline-none focus:ring-2 focus:ring-[#17B6AE]/40 focus:border-[#17B6AE]";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/auth/login", {
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

    router.push(data.role === "ADMIN" ? "/admin" : "/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-10">
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
            <h1 className="text-2xl font-semibold text-slate-800 mb-6 text-center">Giriş Yap</h1>

            {error && (
              <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">E-posta</label>
                <input
                  type="email"
                  required
                  className={inputClass}
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-slate-700">Şifre</label>
                  <a href="/forgot-password" className="text-xs text-[#17B6AE] font-medium">Şifremi Unuttum</a>
                </div>
                <input
                  type="password"
                  required
                  className={inputClass}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#17B6AE] hover:bg-[#149891] text-white font-semibold rounded-xl py-3 text-sm transition disabled:opacity-60 shadow-md shadow-[#17B6AE]/25"
              >
                {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
              </button>
            </form>

            <p className="text-sm text-slate-500 mt-5 text-center">
              Hesabınız yok mu?{" "}
              <a href="/register" className="text-[#17B6AE] font-medium">Kayıt Ol</a>
            </p>
        </div>
      </div>
    </div>
  );
}
