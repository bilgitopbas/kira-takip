"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Tenant = {
  id: string;
  fullName: string;
  monthlyRent: string;
  contractStart: string | null;
  rating: number | null;
  property: { title: string };
};

function MiniStars({ rating }: { rating: number | null }) {
  if (!rating) return <span className="text-slate-400 text-xs">Puanlanmadi</span>;
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <svg
          key={n}
          viewBox="0 0 24 24"
          className={`w-3.5 h-3.5 ${n <= rating ? "fill-amber-400 stroke-amber-400" : "fill-transparent stroke-gray-300"}`}
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 2.5l2.9 5.88 6.49.94-4.7 4.58 1.11 6.47L12 17.27l-5.8 3.1 1.11-6.47-4.7-4.58 6.49-.94L12 2.5z"
          />
        </svg>
      ))}
    </div>
  );
}

export default function KiraciListPage() {
  const router = useRouter();
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

  async function handleDelete(e: React.MouseEvent, id: string) {
    e.stopPropagation();
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
          <p className="text-sm text-slate-500 mt-1">Mulklerinizdeki tum kiracilar.</p>
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

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-[#17B6AE] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : tenants.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm text-center py-16">
          <p className="text-sm text-slate-500 mb-4">Henuz kiraci eklemediniz.</p>
          <a href="/dashboard/kiraci/ekle" className="text-sm text-[#17B6AE] font-medium hover:underline">
            Ilk kiraciyi ekleyin
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tenants.map((t) => (
            <div
              key={t.id}
              onClick={() => router.push(`/dashboard/kiraci/${t.id}`)}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 cursor-pointer hover:border-[#17B6AE]/40 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-[#17B6AE]/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-[#17B6AE] text-sm font-bold">
                      {t.fullName?.charAt(0)?.toUpperCase() ?? "?"}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-800 truncate">{t.fullName}</p>
                    <p className="text-xs text-slate-500 truncate">{t.property.title}</p>
                  </div>
                </div>
                <button
                  onClick={(e) => handleDelete(e, t.id)}
                  className="text-xs px-2.5 py-1 rounded-lg font-semibold bg-red-50 text-red-500 hover:bg-red-100 transition flex-shrink-0"
                >
                  Sil
                </button>
              </div>

              <div className="space-y-1.5 mb-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Aylik Kira</span>
                  <span className="font-semibold text-slate-800">
                    {Number(t.monthlyRent).toLocaleString("tr-TR")} ₺
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Yillik Kira</span>
                  <span className="font-medium text-slate-700">
                    {(Number(t.monthlyRent) * 12).toLocaleString("tr-TR")} ₺
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Baslangic</span>
                  <span className="text-slate-700">
                    {t.contractStart ? new Date(t.contractStart).toLocaleDateString("tr-TR") : "—"}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-50">
                <MiniStars rating={t.rating} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
