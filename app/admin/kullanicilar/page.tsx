"use client";

import { useEffect, useState } from "react";

type Customer = {
  id: string;
  fullName: string;
  email: string;
  city: string;
  phone: string | null;
  wantsManagement: boolean;
  subscriptionStatus: "TRIAL" | "ACTIVE" | "PASSIVE";
  trialEndsAt: string;
  createdAt: string;
};

const STATUS_STYLES = {
  TRIAL: "bg-amber-50 text-amber-600 border border-amber-100",
  ACTIVE: "bg-emerald-50 text-emerald-600 border border-emerald-100",
  PASSIVE: "bg-red-50 text-red-500 border border-red-100",
};

const STATUS_LABELS = { TRIAL: "Deneme", ACTIVE: "Aktif", PASSIVE: "Pasif" };

export default function AdminKullanicilarPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  async function loadCustomers() {
    setLoading(true);
    const res = await fetch("/api/admin/customers");
    const data = await res.json();
    setCustomers(data.customers || []);
    setLoading(false);
  }

  useEffect(() => { loadCustomers(); }, []);

  async function toggleStatus(id: string, current: string) {
    const newStatus = current === "PASSIVE" ? "ACTIVE" : "PASSIVE";
    await fetch(`/api/admin/customers/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
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

  const filtered = customers.filter((c) =>
    c.fullName.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Kullanicilar</h1>
          <p className="text-sm text-slate-400 mt-1">Tum kayitli musteriler.</p>
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
                <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Kullanici</th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Sehir</th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Durum</th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Deneme Bitis</th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Islemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center text-slate-400 py-12 text-sm">
                    Kullanici bulunamadi.
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
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_STYLES[c.subscriptionStatus]}`}>
                      {STATUS_LABELS[c.subscriptionStatus]}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-slate-500 text-xs">
                    {new Date(c.trialEndsAt).toLocaleDateString("tr-TR")}
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
                      >
                        Danisман
                      </button>
                      <button
                        onClick={() => toggleStatus(c.id, c.subscriptionStatus)}
                        className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition ${
                          c.subscriptionStatus === "PASSIVE"
                            ? "bg-emerald-500 text-white hover:bg-emerald-600"
                            : "bg-red-500 text-white hover:bg-red-600"
                        }`}
                      >
                        {c.subscriptionStatus === "PASSIVE" ? "Aktif Et" : "Pasif Et"}
                      </button>
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