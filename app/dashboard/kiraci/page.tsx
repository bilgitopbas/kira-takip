"use client";

import { useEffect, useState } from "react";

type Tenant = {
  id: string;
  fullName: string;
  phone: string | null;
  email: string | null;
  monthlyRent: string;
  contractEnd: string | null;
  property: { title: string };
};

export default function KiraciListPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadTenants() {
    setLoading(true);
    const res = await fetch("/api/dashboard/tenants");
    const data = await res.json();
    setTenants(data.tenants || []);
    setLoading(false);
  }

  useEffect(() => {
    loadTenants();
  }, []);

  async function handleDelete(id: string) {
    if (!confirm("Bu kiraciyi silmek istediginize emin misiniz?")) return;
    setError("");
    const res = await fetch(`/api/dashboard/tenants/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Kiraci silinemedi.");
      return;
    }
    loadTenants();
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Kiracilar</h1>
          <p className="text-sm text-slate-400 mt-1">Mulklerinizdeki tum kiracilar.</p>
        </div>
        <a
          href="/dashboard/kiraci/ekle"
          className="inline-flex bg-[#17B6AE] hover:bg-[#149891] text-white font-semibold px-5 py-2.5 rounded-xl transition text-sm"
        >
          Kiraci Ekle
        </a>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-100 text-red-500 text-sm px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-[#17B6AE] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : tenants.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-sm text-slate-400 mb-4">Henuz kiraci eklemediniz.</p>
            <a href="/dashboard/kiraci/ekle" className="text-sm text-[#17B6AE] font-medium hover:underline">
              Ilk kiraciyi ekleyin
            </a>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Ad Soyad</th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Telefon</th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Mulk</th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Aylik Kira</th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Sozlesme Bitis</th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Islemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {tenants.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#17B6AE]/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-[#17B6AE] text-xs font-bold">
                          {t.fullName?.charAt(0)?.toUpperCase() ?? "?"}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-slate-700">{t.fullName}</p>
                        {t.email && <p className="text-xs text-slate-400">{t.email}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-slate-500">{t.phone || "—"}</td>
                  <td className="px-5 py-4 text-slate-500">{t.property.title}</td>
                  <td className="px-5 py-4 text-slate-500">
                    {Number(t.monthlyRent).toLocaleString("tr-TR")} TL
                  </td>
                  <td className="px-5 py-4 text-slate-500 text-xs">
                    {t.contractEnd ? new Date(t.contractEnd).toLocaleDateString("tr-TR") : "—"}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end">
                      <button
                        onClick={() => handleDelete(t.id)}
                        className="text-xs px-3 py-1.5 rounded-lg font-semibold bg-red-50 text-red-500 hover:bg-red-100 transition"
                      >
                        Sil
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
