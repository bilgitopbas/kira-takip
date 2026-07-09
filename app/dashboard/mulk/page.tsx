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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadProperties() {
    setLoading(true);
    const res = await fetch("/api/dashboard/properties");
    const data = await res.json();
    setProperties(data.properties || []);
    setLoading(false);
  }

  useEffect(() => {
    loadProperties();
  }, []);

  async function handleDelete(id: string) {
    if (!confirm("Bu mülkü silmek istediğinize emin misiniz?")) return;
    setError("");
    const res = await fetch(`/api/dashboard/properties/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Mülk silinemedi.");
      return;
    }
    loadProperties();
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Mülklerim</h1>
          <p className="text-sm text-slate-500 mt-1">Kayıtlı tüm mülkleriniz.</p>
        </div>
        <div className="flex items-center gap-2">
          <ExcelIceAktarButton
            className="inline-flex bg-white hover:bg-gray-50 text-slate-700 font-semibold px-5 py-2.5 rounded-xl transition text-sm border border-gray-200"
            onComplete={loadProperties}
          />
          <MulkEkleButton className="inline-flex bg-[#17B6AE] hover:bg-[#149891] text-white font-semibold px-5 py-2.5 rounded-xl transition text-sm" />
        </div>
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
            <p className="text-sm text-slate-500 mb-4">Henüz mülk eklemediniz.</p>
            <MulkEkleButton className="text-sm text-[#17B6AE] font-medium hover:underline" />
          </div>
        ) : (
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
        )}
      </div>
    </div>
  );
}
