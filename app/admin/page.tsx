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

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  TRIAL: { label: "Deneme", color: "bg-yellow-100 text-yellow-700" },
  ACTIVE: { label: "Aktif", color: "bg-green-100 text-green-700" },
  PASSIVE: { label: "Pasif", color: "bg-red-100 text-red-700" },
};

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadCustomers() {
    setLoading(true);
    const res = await fetch("/api/admin/customers");
    const data = await res.json();
    setCustomers(data.customers || []);
    setLoading(false);
  }

  useEffect(() => {
    loadCustomers();
  }, []);

  async function toggleStatus(id: string, currentStatus: string) {
    const newStatus = currentStatus === "PASSIVE" ? "ACTIVE" : "PASSIVE";

    const res = await fetch(`/api/admin/customers/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });

    if (res.ok) {
      loadCustomers();
    }
  }

  if (loading) {
    return <p className="text-slate-500 text-sm">Yükleniyor...</p>;
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-800 mb-6">Müşteriler</h1>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-slate-500 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Ad Soyad</th>
              <th className="px-4 py-3 font-medium">E-posta</th>
              <th className="px-4 py-3 font-medium">Şehir</th>
              <th className="px-4 py-3 font-medium">Profesyonel Hizmet</th>
              <th className="px-4 py-3 font-medium">Durum</th>
              <th className="px-4 py-3 font-medium">Deneme Bitiş</th>
              <th className="px-4 py-3 font-medium text-right">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {customers.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-slate-400">
                  Henüz kayıtlı müşteri yok.
                </td>
              </tr>
            )}
            {customers.map((c) => (
              <tr key={c.id} className="border-t border-gray-100">
                <td className="px-4 py-3 text-slate-700">{c.fullName}</td>
                <td className="px-4 py-3 text-slate-600">{c.email}</td>
                <td className="px-4 py-3 text-slate-600">{c.city}</td>
                <td className="px-4 py-3">
                  {c.wantsManagement ? (
                    <span className="text-xs bg-[#17B6AE]/10 text-[#149891] px-2 py-1 rounded-full">
                      İstiyor
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${STATUS_LABELS[c.subscriptionStatus].color}`}
                  >
                    {STATUS_LABELS[c.subscriptionStatus].label}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {new Date(c.trialEndsAt).toLocaleDateString("tr-TR")}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => toggleStatus(c.id, c.subscriptionStatus)}
                    className={`text-xs px-3 py-1.5 rounded-lg font-medium transition ${
                      c.subscriptionStatus === "PASSIVE"
                        ? "bg-green-600 text-white hover:bg-green-700"
                        : "bg-red-600 text-white hover:bg-red-700"
                    }`}
                  >
                    {c.subscriptionStatus === "PASSIVE" ? "Aktif Et" : "Pasif Et"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}