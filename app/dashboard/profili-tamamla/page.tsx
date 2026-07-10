"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ProfiliTamamlaPage() {
  const router = useRouter();
  const [profile, setProfile] = useState({ fullName: "", email: "", phone: "", city: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/dashboard/profile")
      .then((r) => r.json())
      .then((d) => {
        if (d.user) {
          setProfile({
            fullName: d.user.fullName || "",
            email: d.user.email || "",
            phone: d.user.phone || "",
            city: d.user.city || "",
          });
        }
        setLoading(false);
      });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!profile.city.trim()) {
      setError("Bulunduğunuz şehri girin.");
      return;
    }

    setSaving(true);
    const res = await fetch("/api/dashboard/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    });
    const data = await res.json();
    setSaving(false);

    if (!res.ok) {
      setError(data.error || "Kaydedilemedi.");
      return;
    }

    router.push("/dashboard");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-[#17B6AE] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-6 text-center">
        <div className="w-12 h-12 rounded-2xl bg-[#17B6AE]/10 text-[#17B6AE] flex items-center justify-center mx-auto mb-3">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <circle cx="12" cy="8" r="4" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 21v-1a6 6 0 016-6h1M17 15l2 2 4-4" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Kurulumu Tamamlayın</h1>
        <p className="text-sm text-slate-500 mt-1">
          Google ile hesap oluşturduğunuz için birkaç bilgiye daha ihtiyacımız var.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        {error && (
          <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Bulunduğunuz Şehir *</label>
            <input
              type="text"
              required
              value={profile.city}
              onChange={(e) => setProfile({ ...profile, city: e.target.value })}
              className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#17B6AE]/30"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Cep Telefonu</label>
            <input
              type="tel"
              value={profile.phone}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#17B6AE]/30"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="w-full bg-[#17B6AE] hover:bg-[#149891] disabled:opacity-60 text-white font-semibold rounded-xl py-3 text-sm transition"
          >
            {saving ? "Kaydediliyor..." : "Devam Et"}
          </button>
        </form>
      </div>
    </div>
  );
}
