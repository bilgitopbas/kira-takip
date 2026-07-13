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

export default function DashboardHeader({
  fullName,
  onMenuClick,
}: {
  fullName: string;
  onMenuClick?: () => void;
}) {
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
    <header
      className="no-print h-16 bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between flex-shrink-0 transition-colors gap-2"
      style={{
        paddingLeft: "max(0.75rem, env(safe-area-inset-left))",
        paddingRight: "max(0.75rem, env(safe-area-inset-right))",
      }}
    >
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onMenuClick}
          className="lg:hidden text-slate-500 hover:text-slate-700 p-1.5 -ml-1 flex-shrink-0"
          aria-label="Menüyü aç"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">{fullName}</p>
          <p className="text-xs text-slate-400 hidden sm:block">{formatToday()}</p>
        </div>
      </div>

      {rates && (
        <div className="hidden md:flex items-center gap-2 flex-shrink-0">
          <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-lg px-3 py-1.5">
            <span className="text-xs font-bold text-slate-400">USD</span>
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
              {rates.usd.selling.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺
            </span>
          </div>
          <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-lg px-3 py-1.5">
            <span className="text-xs font-bold text-slate-400">EUR</span>
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
              {rates.eur.selling.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺
            </span>
          </div>
          <div className="hidden lg:flex items-center gap-1.5 bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 rounded-lg px-3 py-1.5">
            <span className="text-xs font-bold text-amber-500">GAU/TRY</span>
            <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">
              {rates.gramAltin.selling.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺
            </span>
          </div>
        </div>
      )}
    </header>
  );
}
