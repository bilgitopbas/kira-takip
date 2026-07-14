import { prisma } from "@/lib/prisma";

// TÜFE Genel Endeks (2003=100) ve Yİ-ÜFE Genel Endeks — EVDS "serieList" ile teyit edildi.
const TUFE_SERIES = "TP.GENENDEKS.T1";
const YIUFE_SERIES = "TP.TUFE1YI.T1";

const EVDS_BASE_URL = "https://evds3.tcmb.gov.tr/igmevdsms-dis/";

function formatEvdsDate(d: Date) {
  return `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`;
}

type EvdsItem = Record<string, string | null> & { Tarih: string };

async function fetchSeries(seriesCode: string, startDate: Date, endDate: Date) {
  const apiKey = process.env.EVDS_API_KEY;
  if (!apiKey) throw new Error("EVDS_API_KEY tanımlı değil.");

  const url = `${EVDS_BASE_URL}series=${seriesCode}&startDate=${formatEvdsDate(startDate)}&endDate=${formatEvdsDate(endDate)}&type=json`;

  const res = await fetch(url, {
    headers: { key: apiKey },
  });

  if (!res.ok) {
    throw new Error(`EVDS isteği başarısız: ${res.status}`);
  }

  const data = await res.json();
  const items: EvdsItem[] = data.items || [];
  const valueKey = seriesCode.replace(/\./g, "_");

  return items
    .map((item) => {
      const [yearStr, monthStr] = item.Tarih.split("-");
      const raw = item[valueKey];
      if (!raw) return null;
      return {
        year: Number(yearStr),
        month: Number(monthStr),
        value: Number(raw),
      };
    })
    .filter((v): v is { year: number; month: number; value: number } => v !== null);
}

export async function syncPriceIndices() {
  const endDate = new Date();
  const startDate = new Date(2018, 0, 1);

  const [tufe, yiufe] = await Promise.all([
    fetchSeries(TUFE_SERIES, startDate, endDate),
    fetchSeries(YIUFE_SERIES, startDate, endDate),
  ]);

  for (const entry of tufe) {
    await prisma.priceIndex.upsert({
      where: { type_year_month: { type: "TUFE", year: entry.year, month: entry.month } },
      update: { indexValue: entry.value, fetchedAt: new Date() },
      create: { type: "TUFE", year: entry.year, month: entry.month, indexValue: entry.value },
    });
  }

  for (const entry of yiufe) {
    await prisma.priceIndex.upsert({
      where: { type_year_month: { type: "YIUFE", year: entry.year, month: entry.month } },
      update: { indexValue: entry.value, fetchedAt: new Date() },
      create: { type: "YIUFE", year: entry.year, month: entry.month, indexValue: entry.value },
    });
  }
}

export async function ensureFreshPriceIndices() {
  const latest = await prisma.priceIndex.findFirst({
    where: { type: "TUFE" },
    orderBy: [{ year: "desc" }, { month: "desc" }],
  });

  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;

  // Önceki ayın verisi, bu ayın ~3'ünde açıklanır; güvenli pay için ayın 5'ini bekle.
  const expectedYear = currentMonth === 1 ? currentYear - 1 : currentYear;
  const expectedMonth = currentMonth === 1 ? 12 : currentMonth - 1;
  const dataShouldBeAvailable = today.getDate() >= 5;

  const isStale =
    !latest ||
    latest.year < expectedYear ||
    (latest.year === expectedYear && latest.month < expectedMonth);

  if (isStale && dataShouldBeAvailable) {
    await syncPriceIndices();
  }
}
