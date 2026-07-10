"use client";

import { useEffect, useState } from "react";

type Customer = {
  id: string;
  fullName: string;
  email: string;
  city: string;
  wantsManagement: boolean;
  subscriptionStatus: "TRIAL" | "ACTIVE" | "PASSIVE" | "DANISMAN";
};

export default function AdminIslemlerPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/customers")
      .then((r) => r.json())
      .then((d) => {
        const all = d.customers || [];
        setCustomers(all.filter((c: Customer) => c.subscriptionStatus === "DANISMAN"));
        setLoading(false);
      });
  }, []);

  async function goPanele(id: string) {
    const res = await fetch(`/api/admin/customers/${id}/impersonate`, { method: "POST" });
    if (res.ok) window.location.href = "/dashboard";
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Kullanici Islemleri</h1>
        <p className="text-sm text-slate-400 mt-1">
          Danisman kategorisindeki musteriler. Panele girerek islem yapabilirsiniz.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-[#17B6AE] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : customers.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-slate-400 text-sm">Danisman kategorisinde musteri yok.</p>
            <p className="text-slate-300 text-xs mt-1">
              Kullanicilar sayfasindan Danisman butonuna basarak ekleyebilirsiniz.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Musteri</th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Sehir</th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Tip</th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Panel</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {customers.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#17B6AE]/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-[#17B6AE] text-sm font-bold">
                          {c.fullName?.charAt(0)?.toUpperCase() ?? "?"}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-slate-700">{c.fullName}</p>
                        <p className="text-xs text-slate-400">{c.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-slate-500">{c.city || "—"}</td>
                  <td className="px-5 py-4">
                    <span className="text-xs bg-[#17B6AE]/10 text-[#17B6AE] border border-[#17B6AE]/20 px-2.5 py-1 rounded-full font-medium">
                      Danisman
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button
                      onClick={() => goPanele(c.id)}
                      className="inline-flex items-center gap-1.5 bg-[#17B6AE] hover:bg-[#149891] text-white text-xs font-semibold px-4 py-2 rounded-lg transition"
                    >
                      Panele Git
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>
    </div>
  );
}