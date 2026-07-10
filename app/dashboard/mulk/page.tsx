"use client";

import { useEffect, useState } from "react";
import MulkEkleButton from "@/components/MulkEkleButton";
import ExcelIceAktarButton from "@/components/ExcelIceAktarButton";

type Property = {
  id: string;
  title: string;
  address: string;
  city: string | null;
  isOccupied: boolean;
  propertyType: string | null;
  _count: { tenants: number };
};

const TYPE_LABELS: Record<string, string> = {
  ARSA: "Arsa",
  AVM: "AVM",
  DEPO: "Depo",
  DEVREMULK: "Devremülk",
  FABRIKA: "Fabrika",
  KONUT: "Konut",
  OFIS: "Ofis",
};

export default function MulkListPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [type, setType] = useState("");
  const [city, setCity] = useState("");
  const [cities, setCities] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/dashboard/properties/cities")
      .then((r) => r.json())
      .then((d) => setCities(d.cities || []));
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  async function loadProperties(targetPage: number, append: boolean) {
    if (append) setLoadingMore(true);
    else setLoading(true);

    const params = new URLSearchParams({ page: String(targetPage) });
    if (debouncedSearch) params.set("q", debouncedSearch);
    if (type) params.set("type", type);
    if (city) params.set("city", city);

    const res = await fetch(`/api/dashboard/properties?${params.toString()}`);
    const data = await res.json();

    setProperties((prev) => (append ? [...prev, ...(data.properties || [])] : data.properties || []));
    setTotal(data.total || 0);
    setHasMore(!!data.hasMore);
    setPage(targetPage);
    setLoading(false);
    setLoadingMore(false);
  }

  useEffect(() => {
    loadProperties(1, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, type, city]);

  async function handleDelete(id: string) {
    if (!confirm("Bu mülkü silmek istediğinize emin misiniz?")) return;
    setError("");
    const res = await fetch(`/api/dashboard/properties/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Mülk silinemedi.");
      return;
    }
    loadProperties(1, false);
  }

  const hasActiveFilters = !!(search || type || city);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Mülklerim</h1>
          <p className="text-sm text-slate-500 mt-1">Kayıtlı tüm mülkleriniz.</p>
        </div>
        <div className="flex items-center gap-2">
          <ExcelIceAktarButton
            className="inline-flex bg-white hover:bg-gray-50 text-slate-700 font-semibold px-5 py-2.5 rounded-xl transition text-sm border border-gray-200"
            onComplete={() => loadProperties(1, false)}
          />
          <MulkEkleButton className="inline-flex bg-[#17B6AE] hover:bg-[#149891] text-white font-semibold px-5 py-2.5 rounded-xl transition text-sm" />
        </div>
      </div>

      <div className="mb-6 bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <svg className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 10a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Mülk ara (başlık, adres)..."
            className="w-full pl-10 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#17B6AE]/30"
          />
        </div>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#17B6AE]/30 bg-white text-slate-700"
        >
          <option value="">Tüm Tipler</option>
          {Object.entries(TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <select
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#17B6AE]/30 bg-white text-slate-700"
        >
          <option value="">Tüm İller</option>
          {cities.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        {hasActiveFilters && (
          <button
            onClick={() => {
              setSearch("");
              setType("");
              setCity("");
            }}
            className="text-sm font-medium text-slate-500 hover:text-red-500 transition"
          >
            Filtreleri Temizle
          </button>
        )}
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
        ) : properties.length === 0 ? (
          <div className="text-center py-16">
            {hasActiveFilters ? (
              <p className="text-sm text-slate-500">Filtrelere uyan mülk bulunamadı.</p>
            ) : (
              <>
                <p className="text-sm text-slate-500 mb-4">Henüz mülk eklemediniz.</p>
                <MulkEkleButton className="text-sm text-[#17B6AE] font-medium hover:underline" />
              </>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Başlık</th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tip</th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Adres</th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Şehir</th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Durum</th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Kiracı</th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {properties.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-5 py-4 font-medium text-slate-700">{p.title}</td>
                  <td className="px-5 py-4">
                    {p.propertyType ? (
                      <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-slate-100 text-slate-500">
                        {TYPE_LABELS[p.propertyType] || p.propertyType}
                      </span>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-slate-500">{p.address}</td>
                  <td className="px-5 py-4 text-slate-500">{p.city || "—"}</td>
                  <td className="px-5 py-4">
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                        p.isOccupied
                          ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                          : "bg-amber-50 text-amber-600 border border-amber-100"
                      }`}
                    >
                      {p.isOccupied ? "Dolu" : "Boş"}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-slate-500">{p._count.tenants}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end">
                      <button
                        onClick={() => handleDelete(p.id)}
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
          </div>
        )}
      </div>

      {!loading && properties.length > 0 && (
        <div className="mt-5 flex flex-col items-center gap-3">
          <p className="text-xs text-slate-400">
            {properties.length} / {total} mülk gösteriliyor
          </p>
          {hasMore && (
            <button
              onClick={() => loadProperties(page + 1, true)}
              disabled={loadingMore}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-700 bg-white border border-gray-200 hover:bg-gray-50 transition disabled:opacity-60"
            >
              {loadingMore ? "Yükleniyor..." : "Daha Fazla Yükle"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
