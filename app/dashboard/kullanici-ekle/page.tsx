"use client";

import { useEffect, useState } from "react";

type Member = { id: string; email: string; fullName: string; acceptedAt: string | null; createdAt: string };

export default function KullaniciEklePage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ fullName: "", email: "" });
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  function loadMembers() {
    fetch("/api/dashboard/team")
      .then((r) => r.json())
      .then((d) => setMembers(d.members || []))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadMembers();
  }, []);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setSubmitting(true);

    const res = await fetch("/api/dashboard/team", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setMsg({ type: "error", text: data.error || "Davet gönderilemedi." });
      return;
    }

    setMsg({ type: "success", text: `${form.email} adresine davet e-postası gönderildi.` });
    setForm({ fullName: "", email: "" });
    loadMembers();
  }

  async function handleRemove(id: string) {
    await fetch(`/api/dashboard/team/${id}`, { method: "DELETE" });
    loadMembers();
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Kullanıcı Ekle</h1>
        <p className="text-sm text-slate-500 mt-1">Hesabınızı başka bir kişiyle paylaşın.</p>
      </div>

      <div className="bg-[#17B6AE]/8 border border-[#17B6AE]/20 rounded-2xl px-5 py-4 mb-6 flex items-start gap-3">
        <svg className="w-5 h-5 text-[#17B6AE] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <circle cx="12" cy="12" r="10" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 16v-4M12 8h.01" />
        </svg>
        <p className="text-sm text-slate-700 dark:text-slate-200">
          Davet ettiğiniz kişi kendi e-posta adresi ve belirleyeceği şifreyle giriş yaparak <strong>bu hesaptaki
          tüm mülk, kiracı ve tahsilat bilgilerine</strong> erişebilir. Örneğin mülk sahibi siz olsanız da,
          muhasebeciniz veya bir aile üyeniz kendi bilgileriyle giriş yapıp hesabı sizinle birlikte takip edebilir.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6">
          <h2 className="text-base font-bold text-slate-800 dark:text-white mb-1">Yeni Kullanıcı Davet Et</h2>
          <p className="text-sm text-slate-500 mb-4">Davet e-postası bilgi@mizanmulkyonetimi.com adresinden gönderilir.</p>

          {msg && (
            <div className={`mb-4 text-sm px-4 py-3 rounded-xl ${msg.type === "success" ? "bg-emerald-50 border border-emerald-100 text-emerald-600" : "bg-red-50 border border-red-100 text-red-500"}`}>
              {msg.text}
            </div>
          )}

          <form onSubmit={handleInvite} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Ad Soyad</label>
              <input
                type="text"
                required
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#17B6AE]/30"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">E-posta</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#17B6AE]/30"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="bg-[#17B6AE] hover:bg-[#149891] disabled:opacity-60 text-white font-semibold px-6 py-2.5 rounded-xl transition text-sm"
            >
              {submitting ? "Gönderiliyor..." : "Davet Gönder"}
            </button>
          </form>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6">
          <h2 className="text-base font-bold text-slate-800 dark:text-white mb-1">Davet Edilenler</h2>
          <p className="text-sm text-slate-500 mb-4">Hesabınıza erişimi olan kişiler.</p>

          {loading ? (
            <div className="flex items-center justify-center py-10">
              <div className="w-6 h-6 border-2 border-[#17B6AE] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : members.length === 0 ? (
            <p className="text-sm text-slate-400 py-6 text-center">Henüz kimseyi davet etmediniz.</p>
          ) : (
            <div className="divide-y divide-gray-50 dark:divide-slate-700">
              {members.map((m) => (
                <div key={m.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-white">{m.fullName}</p>
                    <p className="text-xs text-slate-400">{m.email}</p>
                    <span className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${m.acceptedAt ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}>
                      {m.acceptedAt ? "Katıldı" : "Davet Bekliyor"}
                    </span>
                  </div>
                  <button
                    onClick={() => handleRemove(m.id)}
                    className="text-xs px-3 py-1.5 rounded-lg font-semibold bg-red-50 text-red-500 hover:bg-red-100 transition"
                  >
                    Kaldır
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
