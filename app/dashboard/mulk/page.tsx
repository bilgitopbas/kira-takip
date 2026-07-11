"use client";

import { useEffect, useState } from "react";
import MulkEkleButton from "@/components/MulkEkleButton";
import MulkDuzenleButton from "@/components/MulkDuzenleButton";
import ExcelIceAktarButton from "@/components/ExcelIceAktarButton";
import Pagination from "@/components/Pagination";

const PAGE_SIZE = 10;

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

const TYPE_STYLES: Record<string, string> = {
  ARSA: "bg-amber-50 text-amber-600 border-amber-100",
  AVM: "bg-violet-50 text-violet-600 border-violet-100",
  DEPO: "bg-slate-100 text-slate-600 border-slate-200",
  DEVREMULK: "bg-rose-50 text-rose-600 border-rose-100",
  FABRIKA: "bg-orange-50 text-orange-600 border-orange-100",
  KONUT: "bg-blue-50 text-blue-600 border-blue-100",
  OFIS: "bg-indigo-50 text-indigo-600 border-indigo-100",
};

export default function MulkListPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [type, setType] = useState("");
  const [occupied, setOccupied] = useState("");
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

  async function loadProperties(targetPage: number) {
    setLoading(true);

    const params = new URLSearchParams({ page: String(targetPage) });
    if (debouncedSearch) params.set("q", debouncedSearch);
    if (type) params.set("type", type);
    if (city) params.set("city", city);
    if (occupied) params.set("occupied", occupied);

    const res = await fetch(`/api/dashboard/properties?${params.toString()}`);
    const data = await res.json();

    setProperties(data.properties || []);
    setTotal(data.total || 0);
    setPage(targetPage);
    setLoading(false);
  }

  useEffect(() => {
    loadProperties(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, type, city, occupied]);

  async function handleDelete(id: string) {
    if (!confirm("Bu mülkü silmek istediğinize emin misiniz?")) return;
    setError("");
    const res = await fetch(`/api/dashboard/properties/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Mülk silinemedi.");
      return;
    }
    loadProperties(page);
  }

  const hasActiveFilters = !!(search || type || city || occupied);

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
            onComplete={() => loadProperties(1)}
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
            placeholder="Mülk ara (ad, adres)..."
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
          value={occupied}
          onChange={(e) => setOccupied(e.target.value)}
          className="px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#17B6AE]/30 bg-white text-slate-700"
        >
          <option value="">Boş / Dolu</option>
          <option value="true">Dolu</option>
          <option value="false">Boş</option>
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
              setOccupied("");
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

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-[#17B6AE] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : properties.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm text-center py-16">
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
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {properties.map((p) => (
              <div
                key={p.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md hover:border-[#17B6AE]/30 transition-all flex flex-col"
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <span
                    className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${
                      p.propertyType ? TYPE_STYLES[p.propertyType] : "bg-gray-50 text-slate-400 border-gray-100"
                    }`}
                  >
                    {p.propertyType ? TYPE_LABELS[p.propertyType] : "Tip Yok"}
                  </span>
                  <span
                    className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border flex-shrink-0 ${
                      p.isOccupied
                        ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                        : "bg-amber-50 text-amber-600 border-amber-100"
                    }`}
                  >
                    {p.isOccupied ? "Dolu" : "Boş"}
                  </span>
                </div>

                <h3 className="font-semibold text-slate-800 text-base leading-snug line-clamp-1 mb-1" title={p.title}>
                  {p.title}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed line-clamp-2 mb-4 min-h-[2rem]">
                  {p.address || "Adres girilmemiş"}
                  {p.city ? ` · ${p.city}` : ""}
                </p>

                <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-50">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                    </svg>
                    {p._count.tenants} kiracı
                  </div>
                  <div className="flex items-center gap-1">
                    <MulkDuzenleButton
                      propertyId={p.id}
                      onUpdated={() => loadProperties(page)}
                      className="text-xs px-3 py-1.5 rounded-lg font-semibold bg-[#17B6AE]/10 text-[#17B6AE] hover:bg-[#17B6AE]/20 transition"
                    />
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="text-xs px-3 py-1.5 rounded-lg font-semibold bg-red-50 text-red-500 hover:bg-red-100 transition"
                    >
                      Sil
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-col items-center gap-3">
            <p className="text-xs text-slate-400">
              Toplam {total} mülk — Sayfa {page} / {Math.max(1, Math.ceil(total / PAGE_SIZE))}
            </p>
            <Pagination page={page} total={total} pageSize={PAGE_SIZE} onPageChange={loadProperties} />
          </div>
        </>
      )}
    </div>
  );
}
