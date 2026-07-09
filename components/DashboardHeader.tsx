"use client";

import { useEffect, useState } from "react";

type MarketRates = {
  usd: { buying: number; selling: number };
  eur: { buying: number; selling: number };
  gramAltin: { buying: number; selling: number };
  updatedAt: string;
};

const REFRESH_MS = 15 * 60 * 1000;

function formatToday() {
  return new Date().toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    weekday: "long",
  });
}

export default function DashboardHeader({ fullName }: { fullName: string }) {
  const [rates, setRates] = useState<MarketRates | null>(null);

  useEffect(() => {
    function load() {
      fetch("/api/dashboard/market-rates")
        .then((r) => r.json())
        .then((d) => {
          if (!d.error) setRates(d);
        })
        .catch(() => {});
    }
    load();
    const interval = setInterval(load, REFRESH_MS);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="no-print h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 flex-shrink-0">
      <div>
        <p className="text-sm font-semibold text-slate-800">{fullName}</p>
        <p className="text-xs text-slate-400">{formatToday()}</p>
      </div>

      {rates && (
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-100 rounded-lg px-3 py-1.5">
            <span className="text-xs font-bold text-slate-400">USD</span>
            <span className="text-xs font-semibold text-slate-700">
              {rates.usd.selling.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺
            </span>
          </div>
          <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-100 rounded-lg px-3 py-1.5">
            <span className="text-xs font-bold text-slate-400">EUR</span>
            <span className="text-xs font-semibold text-slate-700">
              {rates.eur.selling.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺
            </span>
          </div>
          <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-100 rounded-lg px-3 py-1.5">
            <span className="text-xs font-bold text-amber-500">Gram Altın</span>
            <span className="text-xs font-semibold text-amber-700">
              {rates.gramAltin.selling.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺
            </span>
          </div>
        </div>
      )}
    </header>
  );
}
