"use client";

import YazdirButonu from "@/components/YazdirButonu";
import { HIZLI_ARALIKLAR, type HizliAralik } from "@/lib/tarihAraligi";

// Tahsilat defteri ve finans raporlarinin ortak filtre kartı.
export default function TarihAraligiFiltresi({
  startDate,
  endDate,
  seciliAy,
  aktifAralik,
  elleTarihDegistir,
  aySec,
  hizliAralikSec,
  onExcel,
}: {
  startDate: string;
  endDate: string;
  seciliAy: string;
  aktifAralik: string | null;
  elleTarihDegistir: (tip: "start" | "end", deger: string) => void;
  aySec: (deger: string) => void;
  hizliAralikSec: (secenek: HizliAralik) => void;
  onExcel?: () => void;
}) {
  const girdi =
    "px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#17B6AE]/30";

  return (
    <div className="no-print bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6 space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Başlangıç</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => elleTarihDegistir("start", e.target.value)}
            className={girdi}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Bitiş</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => elleTarihDegistir("end", e.target.value)}
            className={girdi}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Tek Ay Seç</label>
          <input
            type="month"
            value={seciliAy}
            onChange={(e) => aySec(e.target.value)}
            className={girdi}
          />
        </div>
        <div className="flex-1" />
        {onExcel && (
          <button
            type="button"
            onClick={onExcel}
            className="bg-white hover:bg-gray-50 text-slate-700 font-semibold px-4 py-2.5 rounded-xl transition text-sm border border-gray-200"
          >
            Excel&apos;e Aktar
          </button>
        )}
        <YazdirButonu />
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-gray-100 pt-3">
        <span className="text-xs font-semibold text-slate-500 mr-1">Hızlı aralık:</span>
        {HIZLI_ARALIKLAR.map((a) => (
          <button
            key={a.key}
            type="button"
            onClick={() => hizliAralikSec(a)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition ${
              aktifAralik === a.key
                ? "bg-[#17B6AE] text-white border-[#17B6AE]"
                : "bg-white text-slate-600 border-gray-200 hover:border-[#17B6AE]"
            }`}
          >
            {a.label}
          </button>
        ))}
      </div>
    </div>
  );
}
