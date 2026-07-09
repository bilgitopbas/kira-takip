"use client";

import { useEffect, useState } from "react";

type Customer = {
  id: string;
  fullName: string;
  email: string;
  city: string;
  phone: string | null;
  wantsManagement: boolean;
  subscriptionStatus: "TRIAL" | "ACTIVE" | "PASSIVE" | "DANISMAN";
  trialEndsAt: string;
  createdAt: string;
  propertyLimit: number | null;
};

const STATUS_STYLES = {
  TRIAL: "bg-amber-50 text-amber-600 border border-amber-100",
  ACTIVE: "bg-emerald-50 text-emerald-600 border border-emerald-100",
  PASSIVE: "bg-red-50 text-red-500 border border-red-100",
  DANISMAN: "bg-violet-50 text-violet-600 border border-violet-100",
};

const STATUS_LABELS = {
  TRIAL: "Mizan Ücretsiz",
  ACTIVE: "Mizan Pro",
  PASSIVE: "Pasif",
  DANISMAN: "Mizan Danışman",
};

export default function AdminKullanicilarPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [limitInputs, setLimitInputs] = useState<Record<string, string>>({});

  async function loadCustomers() {
    setLoading(true);
    const res = await fetch("/api/admin/customers");
    const data = await res.json();
    setCustomers(data.customers || []);
    setLoading(false);
  }

  useEffect(() => { loadCustomers(); }, []);

  async function changeTier(id: string, status: string) {
    await fetch(`/api/admin/customers/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    loadCustomers();
  }

  async function toggleManagement(id: string, current: boolean) {
    await fetch(`/api/admin/customers/${id}/management`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wantsManagement: !current }),
    });
    loadCustomers();
  }

  async function saveLimit(id: string) {
    const value = limitInputs[id];
    if (!value) return;
    await fetch(`/api/admin/customers/${id}/subscription`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ propertyCount: Number(value) }),
    });
    loadCustomers();
  }

  async function goToPanel(id: string) {
    const res = await fetch(`/api/admin/customers/${id}/impersonate`, { method: "POST" });
    if (res.ok) window.location.href = "/dashboard";
  }

  const filtered = customers.filter((c) =>
    c.fullName.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Kullanıcılar</h1>
          <p className="text-sm text-slate-400 mt-1">Tüm kayıtlı müşteriler.</p>
        </div>
        <div className="relative">
          <input
            type="text"
            placeholder="Ad veya e-posta ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-4 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#17B6AE]/30 bg-white w-64"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-[#17B6AE] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Kullanıcı</th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Şehir</th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Müşteri Tipi</th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Deneme Bitiş</th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Mizan Pro Limiti</th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center text-slate-400 py-12 text-sm">
                    Kullanıcı bulunamadı.
                  </td>
                </tr>
              )}
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#17B6AE]/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-[#17B6AE] text-xs font-bold">
                          {c.fullName?.charAt(0)?.toUpperCase() ?? "?"}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-slate-700">{c.fullName}</p>
                        <p className="text-xs text-slate-400">{c.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-slate-500">{c.city || "—"}</td>
                  <td className="px-5 py-4">
                    <select
                      value={c.subscriptionStatus}
                      onChange={(e) => changeTier(c.id, e.target.value)}
                      className={`text-xs px-2.5 py-1.5 rounded-full font-medium border cursor-pointer ${STATUS_STYLES[c.subscriptionStatus]}`}
                    >
                      {Object.entries(STATUS_LABELS).map(([v, l]) => (
                        <option key={v} value={v}>{l}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-5 py-4 text-slate-500 text-xs">
                    {new Date(c.trialEndsAt).toLocaleDateString("tr-TR")}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min={1}
                        placeholder={c.propertyLimit ? String(c.propertyLimit) : "—"}
                        value={limitInputs[c.id] ?? ""}
                        onChange={(e) => setLimitInputs({ ...limitInputs, [c.id]: e.target.value })}
                        className="w-16 px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#17B6AE]/30"
                      />
                      <button
                        onClick={() => saveLimit(c.id)}
                        className="text-xs px-2.5 py-1.5 rounded-lg font-semibold bg-[#17B6AE]/10 text-[#17B6AE] hover:bg-[#17B6AE]/20 transition"
                      >
                        Kaydet
                      </button>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        onClick={() => toggleManagement(c.id, c.wantsManagement)}
                        className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition border ${
                          c.wantsManagement
                            ? "bg-[#17B6AE]/10 text-[#17B6AE] border-[#17B6AE]/30 hover:bg-[#17B6AE]/20"
                            : "bg-gray-50 text-slate-400 border-gray-200 hover:bg-gray-100"
                        }`}
                        title="Profesyonel Mülk Yönetimi Hizmeti talebi"
                      >
                        Yönetim Talebi
                      </button>
                      {c.subscriptionStatus === "DANISMAN" && (
                        <button
                          onClick={() => goToPanel(c.id)}
                          className="text-xs px-3 py-1.5 rounded-lg font-semibold bg-[#17B6AE] text-white hover:bg-[#149891] transition"
                        >
                          Panele Gir
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
