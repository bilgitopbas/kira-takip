"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import TiltCard from "@/components/motion/TiltCard";

function AcceptInviteForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [checking, setChecking] = useState(true);
  const [invite, setInvite] = useState<{ email: string; fullName: string; ownerName: string } | null>(null);
  const [checkError, setCheckError] = useState("");

  const [password, setPassword] = useState("");
  const [passwordRepeat, setPasswordRepeat] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setChecking(false);
      return;
    }
    fetch(`/api/auth/accept-invite?token=${token}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setCheckError(d.error);
        else setInvite(d);
        setChecking(false);
      })
      .catch(() => {
        setCheckError("Bir hata oluştu.");
        setChecking(false);
      });
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== passwordRepeat) {
      setError("Şifreler eşleşmiyor.");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/auth/accept-invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Bir hata oluştu.");
      return;
    }

    setSuccess(true);
    setTimeout(() => router.push("/login"), 2000);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-6">
          <Link href="/">
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
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h1 className="text-2xl font-semibold text-slate-800 mb-2 text-center">Hesaba Katıl</h1>

          {checking && <p className="text-sm text-slate-400 text-center py-6">Davet kontrol ediliyor...</p>}

          {!checking && checkError && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {checkError}
            </div>
          )}

          {!checking && invite && !success && (
            <>
              <p className="text-sm text-slate-500 mb-6 text-center">
                <strong className="text-slate-700">{invite.ownerName}</strong> sizi ({invite.email}) MizanMülk
                hesabını birlikte kullanmaya davet etti. Devam etmek için bir şifre belirleyin.
              </p>

              {error && (
                <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Şifre</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#17B6AE]/40 focus:border-[#17B6AE]"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Şifre Tekrar</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#17B6AE]/40 focus:border-[#17B6AE]"
                    value={passwordRepeat}
                    onChange={(e) => setPasswordRepeat(e.target.value)}
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#17B6AE] hover:bg-[#149891] text-white font-semibold rounded-xl py-3 text-sm transition disabled:opacity-60 shadow-md shadow-[#17B6AE]/25"
                >
                  {loading ? "Kaydediliyor..." : "Şifremi Belirle ve Katıl"}
                </button>
              </form>
            </>
          )}

          {success && (
            <div className="text-sm text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-3 text-center">
              Hesabınız hazır! Giriş sayfasına yönlendiriliyorsunuz...
            </div>
          )}

          <p className="text-sm text-slate-500 mt-5 text-center">
            <a href="/login" className="text-[#17B6AE] font-medium">Giriş sayfasına dön</a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={null}>
      <AcceptInviteForm />
    </Suspense>
  );
}
