import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { ensureFreshPriceIndices } from "@/lib/evds";
import { getTwelveMonthAverageRate } from "@/lib/rentIncrease";
import RentIncreaseCalculator from "@/components/RentIncreaseCalculator";

const MONTH_NAMES = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
];

async function getCurrentRateSummary() {
  const today = new Date();
  const results: { year: number; month: number; rate: number | null }[] = [];

  for (let i = 0; i < 4; i++) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    // "renewalMonth" burada d + 1 ay olarak veriliyor ki referans ay d'nin kendisi olsun
    const next = new Date(year, month, 1);
    const result = await getTwelveMonthAverageRate("TUFE", next.getFullYear(), next.getMonth() + 1);
    results.push({ year, month, rate: result?.rate ?? null });
  }

  return results;
}

export default async function KiraArtisHesaplaPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  try {
    await ensureFreshPriceIndices();
  } catch (err) {
    console.error("Fiyat endeksi güncellenemedi:", err);
  }

  const summary = await getCurrentRateSummary();
  const [current, ...previous] = summary;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">Kira Artış Oranı Hesaplama</h1>
        <p className="text-sm text-slate-500 mt-1">TBK Md. 344 — TÜFE 12 Aylık Ortalama (TÜİK Resmi Verileri)</p>
      </div>

      <div className="bg-slate-900 rounded-2xl p-6 mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <p className="text-xs text-slate-400 font-semibold">{MONTH_NAMES[current.month - 1]} {current.year} — Güncel Yasal Tavan</p>
          <p className="text-4xl font-bold text-white mt-1">
            {current.rate !== null ? `%${current.rate.toLocaleString("tr-TR")}` : "Veri yok"}
          </p>
          <p className="text-xs text-slate-400 mt-1">TÜİK — TÜFE 12 Aylık Ortalama</p>
        </div>
        <div className="flex gap-6">
          {previous.map((p) => (
            <div key={`${p.year}-${p.month}`} className="text-right">
              <p className="text-xs text-slate-400">{MONTH_NAMES[p.month - 1]} {p.year}</p>
              <p className="text-sm font-semibold text-slate-200">
                {p.rate !== null ? `%${p.rate.toLocaleString("tr-TR")}` : "—"}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-100 rounded-2xl px-5 py-4 mb-6 text-sm text-amber-800 flex gap-3">
        <span>⚖️</span>
        <p>
          <strong>Önemli:</strong> Kira artış oranı, sözleşmenin yenilendiği aydan bir önceki ayın TÜFE 12 aylık ortalamasıdır.
          Yİ-ÜFE artık konut kiralarında yasal tavan değil — yalnızca bilgi amaçlı gösterilmektedir. Bu oranın üzerindeki artışlar hukuken geçersizdir.
        </p>
      </div>

      <RentIncreaseCalculator />
    </div>
  );
}
