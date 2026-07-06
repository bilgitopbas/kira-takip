"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function MulkEklePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [isOccupied, setIsOccupied] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const res = await fetch("/api/dashboard/properties", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, address, city, isOccupied }),
    });

    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Mulk olusturulamadi.");
      return;
    }

    router.push("/dashboard/mulk");
  }

  return (
    <div className="max-w-xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Mulk Ekle</h1>
        <p className="text-sm text-slate-400 mt-1">Yeni bir mulk kaydi olusturun.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
        {error && (
          <div className="bg-red-50 border border-red-100 text-red-500 text-sm px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5">Baslik *</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ornek: Kadikoy Daire"
            className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#17B6AE]/30"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5">Adres *</label>
          <input
            type="text"
            required
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Acik adres"
            className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#17B6AE]/30"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5">Sehir</label>
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Ornek: Istanbul"
            className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#17B6AE]/30"
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={isOccupied}
            onChange={(e) => setIsOccupied(e.target.checked)}
            className="w-4 h-4 rounded accent-[#17B6AE]"
          />
          Bu mulk su anda dolu (kiracisi var)
        </label>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="bg-[#17B6AE] hover:bg-[#149891] disabled:opacity-60 text-white font-semibold px-6 py-2.5 rounded-xl transition text-sm"
          >
            {submitting ? "Kaydediliyor..." : "Kaydet"}
          </button>
          <a href="/dashboard/mulk" className="text-sm text-slate-400 hover:text-slate-600">
            Vazgec
          </a>
        </div>
      </form>
    </div>
  );
}
