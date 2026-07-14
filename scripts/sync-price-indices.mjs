// TUIK TUFE / Yi-UFE endekslerini TCMB EVDS API'sinden cekip veritabanina isler.
// Sunucuda gunluk cron ile calistirilir: node scripts/sync-price-indices.mjs
import "dotenv/config";
import { PrismaClient } from "../app/generated/prisma/index.js";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const TUFE_SERIES = "TP.GENENDEKS.T1";
const YIUFE_SERIES = "TP.TUFE1YI.T1";
const EVDS_BASE_URL = "https://evds3.tcmb.gov.tr/igmevdsms-dis/";

function formatEvdsDate(d) {
  return `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`;
}

async function fetchSeries(seriesCode, startDate, endDate) {
  const apiKey = process.env.EVDS_API_KEY;
  if (!apiKey) throw new Error("EVDS_API_KEY tanımlı değil.");

  const url = `${EVDS_BASE_URL}series=${seriesCode}&startDate=${formatEvdsDate(startDate)}&endDate=${formatEvdsDate(endDate)}&type=json`;
  const res = await fetch(url, { headers: { key: apiKey } });
  if (!res.ok) throw new Error(`EVDS isteği başarısız: ${res.status}`);

  const data = await res.json();
  const items = data.items || [];
  const valueKey = seriesCode.replace(/\./g, "_");

  return items
    .map((item) => {
      const [yearStr, monthStr] = item.Tarih.split("-");
      const raw = item[valueKey];
      if (!raw) return null;
      return { year: Number(yearStr), month: Number(monthStr), value: Number(raw) };
    })
    .filter((v) => v !== null);
}

async function main() {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 36);

  const [tufe, yiufe] = await Promise.all([
    fetchSeries(TUFE_SERIES, startDate, endDate),
    fetchSeries(YIUFE_SERIES, startDate, endDate),
  ]);

  let created = 0;
  let updated = 0;

  for (const entry of tufe) {
    const existing = await prisma.priceIndex.findUnique({
      where: { type_year_month: { type: "TUFE", year: entry.year, month: entry.month } },
    });
    await prisma.priceIndex.upsert({
      where: { type_year_month: { type: "TUFE", year: entry.year, month: entry.month } },
      update: { indexValue: entry.value, fetchedAt: new Date() },
      create: { type: "TUFE", year: entry.year, month: entry.month, indexValue: entry.value },
    });
    if (existing) updated++;
    else created++;
  }

  for (const entry of yiufe) {
    const existing = await prisma.priceIndex.findUnique({
      where: { type_year_month: { type: "YIUFE", year: entry.year, month: entry.month } },
    });
    await prisma.priceIndex.upsert({
      where: { type_year_month: { type: "YIUFE", year: entry.year, month: entry.month } },
      update: { indexValue: entry.value, fetchedAt: new Date() },
      create: { type: "YIUFE", year: entry.year, month: entry.month, indexValue: entry.value },
    });
    if (existing) updated++;
    else created++;
  }

  console.log(`[${new Date().toISOString()}] Fiyat endeksi senkronizasyonu tamamlandı. Yeni: ${created}, Güncellenen: ${updated}.`);
}

main()
  .catch((e) => {
    console.error("Fiyat endeksi senkronizasyon hatası:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
