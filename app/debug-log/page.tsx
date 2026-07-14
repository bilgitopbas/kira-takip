"use client";

import { useEffect, useState } from "react";
import { readLog, clearLog } from "@/lib/debugLog";

export default function DebugLogPage() {
  const [entries, setEntries] = useState<string[]>([]);

  useEffect(() => {
    setEntries(readLog());
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg font-bold text-slate-800">Hata Günlüğü</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setEntries(readLog())}
              className="text-xs px-3 py-1.5 rounded-lg bg-white border border-gray-200"
            >
              Yenile
            </button>
            <button
              onClick={() => {
                clearLog();
                setEntries([]);
              }}
              className="text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-600 border border-red-100"
            >
              Temizle
            </button>
          </div>
        </div>
        {entries.length === 0 ? (
          <p className="text-sm text-slate-400">Kayıt yok.</p>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 p-3 font-mono text-[11px] leading-relaxed whitespace-pre-wrap break-all select-text">
            {entries.join("\n")}
          </div>
        )}
      </div>
    </div>
  );
}
