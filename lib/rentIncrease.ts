import { prisma } from "@/lib/prisma";
import type { PriceIndexType } from "@/app/generated/prisma";

// TBK 344: yenileme ayından bir önceki ayın TÜİK tarafından açıklanan
// 12 aylık ortalama TÜFE/Yİ-ÜFE değişim oranı esas alınır.
// Örn. Ocak'ta yenilenen kira için Aralık verisi, Eylül'de yenilenen kira için Ağustos verisi kullanılır.
function getReferenceMonth(renewalYear: number, renewalMonth: number) {
  let year = renewalYear;
  let month = renewalMonth - 1;
  if (month <= 0) {
    month += 12;
    year -= 1;
  }
  return { year, month };
}

function shiftMonth(year: number, month: number, delta: number) {
  const total = year * 12 + (month - 1) + delta;
  return { year: Math.floor(total / 12), month: (total % 12) + 1 };
}

export async function getTwelveMonthAverageRate(
  type: PriceIndexType,
  renewalYear: number,
  renewalMonth: number
): Promise<{ rate: number; referenceYear: number; referenceMonth: number } | null> {
  const { year: refYear, month: refMonth } = getReferenceMonth(renewalYear, renewalMonth);

  const months: { year: number; month: number }[] = [];
  for (let i = 23; i >= 0; i--) {
    months.push(shiftMonth(refYear, refMonth, -i));
  }

  const rows = await prisma.priceIndex.findMany({
    where: {
      type,
      OR: months.map((m) => ({ year: m.year, month: m.month })),
    },
  });

  if (rows.length < 24) return null;

  const valueMap = new Map(rows.map((r) => [`${r.year}-${r.month}`, Number(r.indexValue)]));
  const last12 = months.slice(12).map((m) => valueMap.get(`${m.year}-${m.month}`)!);
  const prev12 = months.slice(0, 12).map((m) => valueMap.get(`${m.year}-${m.month}`)!);

  const avgLast12 = last12.reduce((a, b) => a + b, 0) / 12;
  const avgPrev12 = prev12.reduce((a, b) => a + b, 0) / 12;

  const rate = (avgLast12 / avgPrev12 - 1) * 100;

  return { rate: Math.round(rate * 100) / 100, referenceYear: refYear, referenceMonth: refMonth };
}

export async function getRentIncreaseRates(renewalYear: number, renewalMonth: number) {
  const [tufe, yiufe] = await Promise.all([
    getTwelveMonthAverageRate("TUFE", renewalYear, renewalMonth),
    getTwelveMonthAverageRate("YIUFE", renewalYear, renewalMonth),
  ]);

  const average =
    tufe && yiufe
      ? { rate: Math.round(((tufe.rate + yiufe.rate) / 2) * 100) / 100, referenceYear: tufe.referenceYear, referenceMonth: tufe.referenceMonth }
      : null;

  return { tufe, yiufe, average };
}
