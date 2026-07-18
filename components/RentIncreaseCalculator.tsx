"use client";

import { useEffect, useState } from "react";

const MONTH_NAMES = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
];

type RateResult = { rate: number; referenceYear: number; referenceMonth: number } | null;
type Rates = { tufe: RateResult; yiufe: RateResult; average: RateResult };

type Method = "TUFE" | "YIUFE" | "AVERAGE" | "CUSTOM";

export default function RentIncreaseCalculator() {
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());
  const [currentRent, setCurrentRent] = useState("");
  const [method, setMethod] = useState<Method>("TUFE");
  const [customRate, setCustomRate] = useState("");
  const [rates, setRates] = useState<Rates | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    rate: number;
    newRent: number;
    increaseAmount: number;
    referenceYear: number | null;
    referenceMonth: number | null;
  } | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/dashboard/rent-increase-rates?year=${year}&month=${month}`)
      .then((r) => r.json())
      .then((d) => setRates(d))
      .finally(() => setLoading(false));
  }, [year, month]);

  function rateFor(m: Method): number | null {
    if (m === "CUSTOM") return customRate ? Number(customRate) : null;
    if (!rates) return null;
    const key = m === "TUFE" ? "tufe" : m === "YIUFE" ? "yiufe" : "average";
    return rates[key]?.rate ?? null;
  }

  function handleCalculate() {
    const rent = Number(currentRent);
    const rate = rateFor(method);
    if (!rent || rate === null) return;

    const increaseAmount = Math.round(rent * (rate / 100) * 100) / 100;
    const newRent = Math.round((rent + increaseAmount) * 100) / 100;
    const ref = method === "TUFE" ? rates?.tufe : method === "YIUFE" ? rates?.yiufe : method === "AVERAGE" ? rates?.average : null;
    setResult({
      rate,
      newRent,
      increaseAmount,
      referenceYear: ref?.referenceYear ?? null,
      referenceMonth: ref?.referenceMonth ?? null,
    });
  }

  function handleReset() {
    setCurrentRent("");
    setCustomRate("");
    setMethod("TUFE");
    setResult(null);
  }

  const options: { key: Method; label: string; hint: string }[] = [
    { key: "TUFE", label: "TÜFE", hint: "Yasal üst sınır — TBK 344" },
    { key: "YIUFE", label: "Yİ-ÜFE", hint: "Yurt İçi Üretici Fiyat Endeksi" },
    { key: "AVERAGE", label: "TÜFE/2 + Yİ-ÜFE/2", hint: "İkisinin ortalaması" },
    { key: "CUSTOM", label: "Özel Artış Oranı %", hint: "Tarafların belirlediği oran" },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-base font-bold text-slate-800 mb-4">Bilgileri Girin</h2>

        <div className="mb-4">
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Sözleşme Yenileme Ayı *</label>
          <div className="grid grid-cols-2 gap-2">
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#17B6AE]/30"
            >
              {MONTH_NAMES.map((m, i) => (
                <option key={m} value={i + 1}>{m}</option>
              ))}
            </select>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#17B6AE]/30"
            >
              {Array.from({ length: today.getFullYear() + 1 - 2020 + 1 }, (_, i) => 2020 + i).map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          {!loading && rates && !rates.tufe && (
            <p className="text-xs text-slate-400 mt-1.5 px-1">Bu döneme ait veri henüz mevcut değil</p>
          )}
        </div>

        <div className="mb-4">
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Mevcut Aylık Kira (₺) *</label>
          <input
            type="number"
            min={0}
            value={currentRent}
            onChange={(e) => setCurrentRent(e.target.value)}
            placeholder="0"
            className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#17B6AE]/30"
          />
        </div>

        <div className="mb-5">
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Artış Oranı Seçimi</label>
          <div className="space-y-2">
            {options.map((opt) => {
              const rate = rateFor(opt.key);
              const active = method === opt.key;
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setMethod(opt.key)}
                  className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl border text-sm transition ${active ? "border-[#17B6AE] bg-[#17B6AE]/5" : "border-gray-200 hover:border-gray-300"}`}
                >
                  <span className="font-medium text-slate-700">
                    {opt.label}
                    {opt.key !== "CUSTOM" && (
                      <span className="text-slate-400 font-normal"> ({rate !== null ? `%${rate.toLocaleString("tr-TR")}` : "Veri yok"})</span>
                    )}
                  </span>
                  <span className="text-xs text-slate-400">{opt.hint}</span>
                </button>
              );
            })}
          </div>
          {method === "CUSTOM" && (
            <input
              type="number"
              min={0}
              value={customRate}
              onChange={(e) => setCustomRate(e.target.value)}
              placeholder="Özel oran %"
              className="w-full mt-2 px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#17B6AE]/30"
            />
          )}
        </div>

        <div className="flex gap-3 mt-4">
          <button
            type="button"
            onClick={handleCalculate}
            className="flex-1 bg-[#17B6AE] hover:bg-[#149891] text-white font-semibold px-6 py-2.5 rounded-xl transition text-sm"
          >
            Hesapla
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="bg-white border border-gray-200 hover:border-gray-300 text-slate-600 font-semibold px-6 py-2.5 rounded-xl transition text-sm"
          >
            Sıfırla
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex items-center justify-center">
        {result ? (
          <div className="w-full text-center">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Yeni Kira Bedeli</p>
            <p className="text-4xl font-bold text-[#17B6AE] mb-4">
              {result.newRent.toLocaleString("tr-TR")} ₺
            </p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-gray-50 rounded-xl px-4 py-3">
                <p className="text-xs text-slate-400">Artış Oranı</p>
                <p className="font-semibold text-slate-700">%{result.rate.toLocaleString("tr-TR")}</p>
              </div>
              <div className="bg-gray-50 rounded-xl px-4 py-3">
                <p className="text-xs text-slate-400">Artış Tutarı</p>
                <p className="font-semibold text-slate-700">{result.increaseAmount.toLocaleString("tr-TR")} ₺</p>
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-4">
              {MONTH_NAMES[month - 1]} {year} itibariyle geçerli
            </p>
            {result.referenceMonth && result.referenceYear && (
              <p className="text-xs text-slate-400 mt-1">
                {MONTH_NAMES[month - 1]} {year} döneminde yapılacak kira artışı için TÜİK&apos;in{" "}
                <span className="font-semibold text-slate-600">
                  {MONTH_NAMES[result.referenceMonth - 1]} {result.referenceYear}
                </span>{" "}
                verisi kullanılmaktadır.
              </p>
            )}
          </div>
        ) : (
          <div className="text-center text-slate-400">
            <div className="text-5xl mb-3">🏠</div>
            <p className="text-sm">Hesaplamak için bilgileri doldurun</p>
          </div>
        )}
      </div>
    </div>
  );
}
