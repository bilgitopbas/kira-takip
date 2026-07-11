"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const PROPERTY_TYPES = [
  { value: "ARSA", label: "Arsa" },
  { value: "AVM", label: "AVM" },
  { value: "DEPO", label: "Depo" },
  { value: "DEVREMULK", label: "Devremülk" },
  { value: "FABRIKA", label: "Fabrika" },
  { value: "KONUT", label: "Konut" },
  { value: "OFIS", label: "Ofis" },
];

type Property = {
  id: string;
  title: string;
  address: string;
  city: string | null;
  district: string | null;
  squareMeters: number | null;
  propertyType: string | null;
  notes: string | null;
  isOccupied: boolean;
};

export default function MulkForm({
  propertyId,
  onSuccess,
  onCancel,
}: {
  propertyId?: string;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const router = useRouter();
  const isEdit = !!propertyId;
  const [loading, setLoading] = useState(isEdit);
  const [title, setTitle] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [isOccupied, setIsOccupied] = useState(false);
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [squareMeters, setSquareMeters] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!propertyId) return;
    async function load() {
      const res = await fetch(`/api/dashboard/properties/${propertyId}`);
      if (res.ok) {
        const { property }: { property: Property } = await res.json();
        setTitle(property.title);
        setPropertyType(property.propertyType || "");
        setIsOccupied(property.isOccupied);
        setCity(property.city || "");
        setDistrict(property.district || "");
        setSquareMeters(property.squareMeters ? String(property.squareMeters) : "");
        setAddress(property.address || "");
        setNotes(property.notes || "");
      }
      setLoading(false);
    }
    load();
  }, [propertyId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const res = await fetch(
      isEdit ? `/api/dashboard/properties/${propertyId}` : "/api/dashboard/properties",
      {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          address,
          city,
          district,
          squareMeters: squareMeters ? Number(squareMeters) : null,
          propertyType: propertyType || null,
          notes,
          isOccupied,
        }),
      }
    );

    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || (isEdit ? "Mülk güncellenemedi." : "Mülk oluşturulamadı."));
      return;
    }

    onSuccess();
    if (!isEdit) {
      router.push("/dashboard/kiraci");
      router.refresh();
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-[#17B6AE] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="bg-[#17B6AE]/5 border border-[#17B6AE]/20 text-sm text-slate-600 px-4 py-3 rounded-xl">
        {isEdit
          ? "Mülk bilgilerini güncelleyin."
          : "Mülkün türünü, durumunu ve görünen adını belirleyin. Mülkünüzü ekledikten sonra kiracı eklemeyi unutmayın."}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-500 text-sm px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1.5">Mülk Adı *</label>
        <input
          type="text"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Örnek: Daire 5, Dükkan No:2"
          className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#17B6AE]/30"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-2">Mülk Tipi</label>
        <div className="grid grid-cols-4 gap-2">
          {PROPERTY_TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setPropertyType(t.value)}
              className={`text-sm rounded-lg border px-3 py-2 transition ${
                propertyType === t.value
                  ? "bg-[#17B6AE] text-white border-[#17B6AE]"
                  : "bg-white text-slate-600 border-gray-300 hover:border-[#17B6AE]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-2">Durum</label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setIsOccupied(false)}
            className={`text-sm font-medium rounded-lg border px-3 py-2.5 transition ${
              !isOccupied
                ? "bg-red-50 text-red-600 border-red-300"
                : "bg-white text-slate-500 border-gray-300 hover:border-red-200"
            }`}
          >
            Boş
          </button>
          <button
            type="button"
            onClick={() => setIsOccupied(true)}
            className={`text-sm font-medium rounded-lg border px-3 py-2.5 transition ${
              isOccupied
                ? "bg-emerald-50 text-emerald-600 border-emerald-300"
                : "bg-white text-slate-500 border-gray-300 hover:border-emerald-200"
            }`}
          >
            Dolu
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Şehir</label>
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="İstanbul"
            className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#17B6AE]/30"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">İlçe</label>
          <input
            type="text"
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            placeholder="Kadıköy"
            className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#17B6AE]/30"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">m²</label>
          <input
            type="number"
            min="0"
            value={squareMeters}
            onChange={(e) => setSquareMeters(e.target.value)}
            className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#17B6AE]/30"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1.5">Adres *</label>
        <input
          type="text"
          required
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Açık adres"
          className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#17B6AE]/30"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1.5">Notlar</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#17B6AE]/30 resize-none"
        />
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={submitting}
          className="bg-[#17B6AE] hover:bg-[#149891] disabled:opacity-60 text-white font-semibold px-6 py-2.5 rounded-xl transition text-sm"
        >
          {submitting ? "Kaydediliyor..." : "Kaydet"}
        </button>
        <button type="button" onClick={onCancel} className="text-sm text-slate-500 hover:text-slate-700">
          Vazgeç
        </button>
      </div>
    </form>
  );
}
