import { notFound } from "next/navigation";
import type { Metadata } from "next";
import YeniPanel from "@/components/yeni-panel/YeniPanel";
import type { PanelOzeti } from "@/lib/yeniPanelTipleri";

// YALNIZ YEREL GELİŞTİRME: yeni paneli veritabanı ve oturum olmadan, uydurma
// örnek veriyle görmek için. Üretimde (NODE_ENV=production) her zaman 404 döner.
// Gerçek kişi/adres verisi içermez.
export const metadata: Metadata = { robots: { index: false, follow: false } };

const ORNEK: PanelOzeti = {
  mulkSayisi: 24,
  doluSayisi: 21,
  bosSayisi: 3,
  kiraciSayisi: 22,
  buAyTahsilat: 186500,
  buYilTahsilat: 1942300,
  tahsilatOrani: 64,
  gecikmisSayisi: 2,
  gecikmisTutar: 31000,
  gecikenler: [
    { id: "d1", tenantId: "t1", tenantName: "Örnek Kiracı 1", propertyTitle: "Örnek Blok A No:3", year: 2026, month: 9, remaining: 15500 },
    { id: "d2", tenantId: "t2", tenantName: "Örnek Kiracı 2", propertyTitle: "Örnek Blok B No:7", year: 2026, month: 9, remaining: 15500 },
  ],
  mulkTipleri: [
    { label: "Konut", value: 14 },
    { label: "Ofis", value: 7 },
    { label: "Depo", value: 2 },
    { label: "Belirtilmemiş", value: 1 },
  ],
  iller: [
    { il: "Konya", mulkSayisi: 18 },
    { il: "Ankara", mulkSayisi: 5 },
  ],
  ilsizMulkSayisi: 1,
};

export default function GelistirmeYeniPanel() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <div className="min-h-screen bg-gray-50 px-4 sm:px-8 py-6">
      <p className="mb-4 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
        Geliştirme önizlemesi — uydurma veri, üretimde kapalı.
      </p>
      <YeniPanel ozet={ORNEK} tarihMetni="19 Ekim 2026 Pazartesi" />
    </div>
  );
}
