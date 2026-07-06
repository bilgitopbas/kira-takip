"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Property = { id: string; title: string };

export default function KiraciEklePage() {
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loadingProperties, setLoadingProperties] = useState(true);

  const [propertyId, setPropertyId] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [monthlyRent, setMonthlyRent] = useState("");
  const [contractStart, setContractStart] = useState("");
  const [contractEnd, setContractEnd] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadProperties() {
      setLoadingProperties(true);
      const res = await fetch("/api/dashboard/properties");
      const data = await res.json();
      const list: Property[] = data.properties || [];
      setProperties(list);
      if (list.length > 0) setPropertyId(list[0].id);
      setLoadingProperties(false);
    }
    loadProperties();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const res = await fetch("/api/dashboard/tenants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        propertyId,
        fullName,
        phone,
        email,
        monthlyRent: monthlyRent ? Number(monthlyRent) : null,
        contractStart: contractStart || null,
        contractEnd: contractEnd || null,
      }),
    });

    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Kiraci olusturulamadi.");
      return;
    }

    router.push("/dashboard/kiraci");
  }

  return (
    <div className="max-w-xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Kiraci Ekle</h1>
        <p className="text-sm text-slate-400 mt-1">Bir mulke yeni kiraci ekleyin.</p>
      </div>

      {!loadingProperties && properties.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
          <p className="text-sm text-slate-500 mb-4">
            Kiraci ekleyebilmek icin once bir mulk eklemeniz gerekiyor.
          </p>
          <a
            href="/dashboard/mulk/ekle"
            className="inline-flex bg-[#17B6AE] hover:bg-[#149891] text-white font-semibold px-6 py-3 rounded-xl transition text-sm"
          >
            Mulk Ekle
          </a>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-500 text-sm px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Mulk *</label>
            <select
              required
              value={propertyId}
              onChange={(e) => setPropertyId(e.target.value)}
              className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#17B6AE]/30 bg-white"
            >
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Ad Soyad *</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#17B6AE]/30"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Telefon</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#17B6AE]/30"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">E-posta</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#17B6AE]/30"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Aylik Kira (TL) *</label>
            <input
              type="number"
              required
              min="0"
              step="0.01"
              value={monthlyRent}
              onChange={(e) => setMonthlyRent(e.target.value)}
              className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#17B6AE]/30"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Sozlesme Baslangic</label>
              <input
                type="date"
                value={contractStart}
                onChange={(e) => setContractStart(e.target.value)}
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#17B6AE]/30"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Sozlesme Bitis</label>
              <input
                type="date"
                value={contractEnd}
                onChange={(e) => setContractEnd(e.target.value)}
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#17B6AE]/30"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="bg-[#17B6AE] hover:bg-[#149891] disabled:opacity-60 text-white font-semibold px-6 py-2.5 rounded-xl transition text-sm"
            >
              {submitting ? "Kaydediliyor..." : "Kaydet"}
            </button>
            <a href="/dashboard/kiraci" className="text-sm text-slate-400 hover:text-slate-600">
              Vazgec
            </a>
          </div>
        </form>
      )}
    </div>
  );
}
