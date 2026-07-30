"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Bildirim = {
  id: string;
  referenceCode: string;
  propertyCount: number;
  months: number;
  amount: number;
  note: string | null;
  status: "PENDING" | "CONFIRMED" | "REJECTED";
  reviewNote: string | null;
  createdAt: string;
  fullName: string;
  email: string;
  phone: string | null;
};

const DURUM_STIL: Record<Bildirim["status"], { etiket: string; sinif: string }> = {
  PENDING: { etiket: "Bekliyor", sinif: "bg-amber-500 text-white" },
  CONFIRMED: { etiket: "Onaylandı", sinif: "bg-emerald-500 text-white" },
  REJECTED: { etiket: "Reddedildi", sinif: "bg-red-500 text-white" },
};

function periyotEtiketi(ay: number) {
  return ay === 12 ? "1 Yıl" : `${ay} Ay`;
}

export default function OdemeBildirimleriView({ bildirimler }: { bildirimler: Bildirim[] }) {
  const router = useRouter();
  const [islemdeki, setIslemdeki] = useState<string | null>(null);
  const [notlar, setNotlar] = useState<Record<string, string>>({});
  const [hata, setHata] = useState("");

  async function isle(id: string, action: "confirm" | "reject") {
    if (action === "confirm" && !confirm("Ödemeyi onaylıyor musunuz? Abonelik hemen açılacak.")) {
      return;
    }
    setHata("");
    setIslemdeki(id);
    try {
      const cevap = await fetch(`/api/admin/odeme-bildirimleri/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, note: notlar[id] || null }),
      });
      const veri = await cevap.json();
      if (!cevap.ok) {
        setHata(veri.error || "İşlem başarısız.");
        return;
      }
      router.refresh();
    } catch {
      setHata("Bağlantı hatası.");
    } finally {
      setIslemdeki(null);
    }
  }

  if (bildirimler.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-10 text-center">
        <p className="text-sm text-slate-500">Henüz ödeme bildirimi yok.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {hata && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
          {hata}
        </p>
      )}

      {bildirimler.map((b) => {
        const durum = DURUM_STIL[b.status];
        return (
          <div
            key={b.id}
            className={`bg-white dark:bg-slate-800 rounded-2xl border shadow-sm p-6 ${
              b.status === "PENDING"
                ? "border-amber-200 dark:border-amber-900"
                : "border-gray-100 dark:border-slate-700"
            }`}
          >
            <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-sm font-bold text-[#17B6AE]">
                    {b.referenceCode}
                  </span>
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${durum.sinif}`}>
                    {durum.etiket}
                  </span>
                </div>
                <p className="text-base font-semibold text-slate-800 dark:text-white mt-1">
                  {b.fullName}
                </p>
                <p className="text-xs text-slate-500">
                  {b.email}
                  {b.phone ? ` · ${b.phone}` : ""}
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
                  {b.amount.toLocaleString("tr-TR")} ₺
                </p>
                <p className="text-xs text-slate-500">
                  {b.propertyCount} mülk · {periyotEtiketi(b.months)}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {new Date(b.createdAt).toLocaleString("tr-TR")}
                </p>
              </div>
            </div>

            {b.note && (
              <p className="text-xs text-slate-600 dark:text-slate-300 bg-gray-50 dark:bg-slate-900 rounded-xl px-3 py-2 mb-3">
                <span className="font-semibold">Müşteri notu:</span> {b.note}
              </p>
            )}

            {b.status === "PENDING" ? (
              <div className="flex flex-wrap items-center gap-3">
                <input
                  type="text"
                  placeholder="Not (isteğe bağlı)"
                  value={notlar[b.id] ?? ""}
                  onChange={(e) => setNotlar((n) => ({ ...n, [b.id]: e.target.value }))}
                  className="flex-1 min-w-[180px] px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#17B6AE]/30"
                />
                <button
                  type="button"
                  disabled={islemdeki === b.id}
                  onClick={() => isle(b.id, "confirm")}
                  className="bg-[#17B6AE] hover:bg-[#149891] disabled:opacity-60 text-white font-semibold px-5 py-2 rounded-xl transition text-sm"
                >
                  Onayla ve Aboneliği Aç
                </button>
                <button
                  type="button"
                  disabled={islemdeki === b.id}
                  onClick={() => isle(b.id, "reject")}
                  className="bg-white dark:bg-slate-900 hover:bg-gray-50 disabled:opacity-60 text-slate-700 dark:text-slate-200 font-semibold px-5 py-2 rounded-xl transition text-sm border border-gray-300 dark:border-slate-600"
                >
                  Reddet
                </button>
              </div>
            ) : (
              b.reviewNote && (
                <p className="text-xs text-slate-500">
                  <span className="font-semibold">Notunuz:</span> {b.reviewNote}
                </p>
              )
            )}
          </div>
        );
      })}
    </div>
  );
}
