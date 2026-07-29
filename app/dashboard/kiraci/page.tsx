"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import KiraciEkleButton from "@/components/KiraciEkleButton";
import ExcelIceAktarButton from "@/components/ExcelIceAktarButton";
import Pagination from "@/components/Pagination";
import { isNativeApp } from "@/lib/native";

const PAGE_SIZE = 10;

const SORT_OPTIONS = [
  { value: "newest", label: "En Yeni" },
  { value: "rent_asc", label: "Kira: Düşükten Yükseğe" },
  { value: "rent_desc", label: "Kira: Yüksekten Düşüğe" },
  { value: "contract_asc", label: "Sözleşme: Eskiden Yeniye" },
  { value: "contract_desc", label: "Sözleşme: Yeniden Eskiye" },
];

type Tenant = {
  id: string;
  fullName: string;
  monthlyRent: string | null;
  contractStart: string | null;
  rating: number | null;
  occupancyStatus: "LIVING" | "VACATED";
  property: { title: string };
};

function MiniStars({ rating }: { rating: number | null }) {
  if (!rating) return <span className="text-slate-400 text-xs">Puanlanmadı</span>;
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
  const searchParams = useSearchParams();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [debouncedSearch, setDebouncedSearch] = useState(searchParams.get("q") || "");
  const [city, setCity] = useState(searchParams.get("city") || "");
  const [sort, setSort] = useState(searchParams.get("sort") || "newest");
  // Mülkler sayfasındaki "N kiracı" bağlantısından gelir; ekranda kaldırılabilir
  // bir rozet olarak gösterilir (açılır menüsü yok).
  const [propertyId, setPropertyId] = useState(searchParams.get("propertyId") || "");
  const [cities, setCities] = useState<string[]>([]);
  const isFirstRun = useRef(true);

  useEffect(() => {
    fetch("/api/dashboard/properties/cities")
      .then((r) => r.json())
      .then((d) => setCities(d.cities || []));
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  async function loadTenants(targetPage: number) {
    setLoading(true);

    const params = new URLSearchParams({ page: String(targetPage), sort });
    if (debouncedSearch) params.set("q", debouncedSearch);
    if (city) params.set("city", city);
    if (propertyId) params.set("propertyId", propertyId);

    const res = await fetch(`/api/dashboard/tenants?${params.toString()}`);
    const data = await res.json();

    setTenants(data.tenants || []);
    setTotal(data.total || 0);
    setPage(targetPage);
    setLoading(false);
    router.replace(`/dashboard/kiraci?${params.toString()}`, { scroll: false });
  }

  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      loadTenants(Number(searchParams.get("page")) || 1);
      return;
    }
    loadTenants(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, city, sort, propertyId]);

  async function handleDelete(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    if (!confirm("Bu kiracıyı silmek istediğinize emin misiniz?")) return;
    setError("");
    const res = await fetch(`/api/dashboard/tenants/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Kiracı silinemedi.");
      return;
    }
    loadTenants(1);
  }

  // Web'de kiracı yeni sekmede açılır; mobil uygulamada sekme kavramı yok,
  // orada her zamanki gibi aynı ekranda gezinilir.
  function acKiraci(tenantId: string) {
    const yol = `/dashboard/kiraci/${tenantId}`;
    if (isNativeApp()) {
      router.push(yol);
      return;
    }
    window.open(yol, "_blank", "noopener,noreferrer");
  }

  const hasActiveFilters = !!(search || city || sort !== "newest" || propertyId);
  // Mülk adını listedeki kayıtlardan türet (ayrı bir istek atmaya gerek yok)
  const filtrelenenMulkAdi = propertyId ? tenants[0]?.property.title : undefined;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Kiracılar</h1>
          <p className="text-sm text-slate-500 mt-1">Mülklerinizdeki tüm kiracılar.</p>
        </div>
        <div className="flex items-center gap-2">
          <ExcelIceAktarButton
            className="inline-flex bg-white hover:bg-gray-50 text-slate-700 font-semibold px-5 py-2.5 rounded-xl transition text-sm border border-gray-200"
            onComplete={() => loadTenants(1)}
          />
          <KiraciEkleButton
            className="inline-flex bg-[#17B6AE] hover:bg-[#149891] text-white font-semibold px-5 py-2.5 rounded-xl transition text-sm"
            onCreated={() => loadTenants(1)}
          />
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
            placeholder="Kiracı ara (ad soyad)..."
            className="w-full pl-10 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#17B6AE]/30"
          />
        </div>
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
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#17B6AE]/30 bg-white text-slate-700"
        >
          {SORT_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
        {propertyId && (
          <span className="inline-flex items-center gap-2 bg-[#17B6AE]/10 text-[#17B6AE] text-sm font-semibold px-3 py-1.5 rounded-xl">
            {filtrelenenMulkAdi ? `Mülk: ${filtrelenenMulkAdi}` : "Mülke göre filtreli"}
            <button
              type="button"
              onClick={() => setPropertyId("")}
              aria-label="Mülk filtresini kaldır"
              className="text-base leading-none hover:text-[#149891]"
            >
              ×
            </button>
          </span>
        )}
        {hasActiveFilters && (
          <button
            onClick={() => {
              setSearch("");
              setCity("");
              setSort("newest");
              setPropertyId("");
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
      ) : tenants.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm text-center py-16">
          {hasActiveFilters ? (
            <p className="text-sm text-slate-500">Filtrelere uyan kiracı bulunamadı.</p>
          ) : (
            <>
              <p className="text-sm text-slate-500 mb-4">Henüz kiracı eklemediniz.</p>
              <KiraciEkleButton
                className="text-sm text-[#17B6AE] font-medium hover:underline"
                onCreated={() => loadTenants(1)}
              />
            </>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tenants.map((t) => (
              <div
                key={t.id}
                onClick={() => acKiraci(t.id)}
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
                      {/* Oturum durumu: kiracıya girmeden listede görünsün */}
                      <span
                        className={`inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          t.occupancyStatus === "VACATED"
                            ? "bg-red-50 text-red-600"
                            : "bg-emerald-50 text-emerald-600"
                        }`}
                      >
                        {t.occupancyStatus === "VACATED" ? "Tahliye etti" : "Oturmaya devam ediyor"}
                      </span>
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
                    <span className="text-slate-500">Aylık Kira</span>
                    <span className="font-semibold text-slate-800">
                      {t.monthlyRent ? `${Number(t.monthlyRent).toLocaleString("tr-TR")} ₺` : "—"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Yıllık Kira</span>
                    <span className="font-medium text-slate-700">
                      {t.monthlyRent ? `${(Number(t.monthlyRent) * 12).toLocaleString("tr-TR")} ₺` : "—"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Başlangıç</span>
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

          <div className="mt-6 flex flex-col items-center gap-3">
            <p className="text-xs text-slate-400">
              Toplam {total} kiracı — Sayfa {page} / {Math.max(1, Math.ceil(total / PAGE_SIZE))}
            </p>
            <Pagination page={page} total={total} pageSize={PAGE_SIZE} onPageChange={loadTenants} />
          </div>
        </>
      )}
    </div>
  );
}
