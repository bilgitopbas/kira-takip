import { notFound } from "next/navigation";
import type { Metadata } from "next";
import YeniPanel from "@/components/yeni-panel/YeniPanel";
import { binaCoz } from "@/lib/binaEslestir";
import type { BirimDurumu, BugunListeleri, PanelBirimi, PanelOzeti } from "@/lib/yeniPanelTipleri";

// YALNIZ YEREL GELİŞTİRME: yeni paneli veritabanı ve oturum olmadan, uydurma
// örnek veriyle görmek için. Üretimde (NODE_ENV=production) her zaman 404 döner.
// Gerçek kişi/adres verisi içermez. Dal main'e birleşmeden önce SİLİNECEK.
export const metadata: Metadata = { robots: { index: false, follow: false } };

const DURUMLAR: BirimDurumu[] = ["odendi", "odendi", "bekliyor", "gecikmis", "odendi", "bos", "odendi", "bekliyor"];

function ornekBirimler(): PanelBirimi[] {
  const tanimlar: { title: string; city: string; district: string; tip: string }[] = [];
  for (let i = 1; i <= 12; i++) tanimlar.push({ title: `Örnektepe ${i % 3 === 0 ? "2A" : "A"} No:${i}`, city: "Konya", district: "Selçuklu", tip: "OFIS" });
  for (let i = 1; i <= 12; i++) tanimlar.push({ title: `Örnektepe B No:${i}`, city: "KONYA ", district: "Selçuklu", tip: "OFIS" });
  for (let i = 1; i <= 6; i++) tanimlar.push({ title: `DENEME A-BLOK NO:${i}`, city: "konya", district: "Meram", tip: "KONUT" });
  for (let i = 1; i <= 4; i++) tanimlar.push({ title: `Gül Apt. No:${i}`, city: "Ankara", district: "Çankaya", tip: "KONUT" });
  tanimlar.push({ title: "ÖRNEK SAN. 1M-1N", city: "Konya", district: "Karatay", tip: "FABRIKA" });
  tanimlar.push({ title: "Çarşı Dükkanı", city: "", district: "", tip: "DEPO" });

  return tanimlar.map((t, i) => {
    const id = `ornek${i + 1}`;
    const c = binaCoz({ id, title: t.title, address: `Örnek Mah. ${t.title}`, city: t.city });
    const durum = DURUMLAR[i % DURUMLAR.length];
    const bos = durum === "bos";
    const kira = i % 11 === 4 ? null : 15000 + (i % 7) * 2500;
    return {
      id,
      title: t.title,
      address: `Örnek Mah. Deneme Sk. ${t.title}`,
      city: t.city || null,
      district: t.district || null,
      propertyType: t.tip,
      isOccupied: !bos,
      il: c.il,
      bina: { anahtar: c.binaAnahtari, ad: c.binaAdi, blok: c.blok, birimNo: c.birimNo, guven: c.guven, kaynak: c.kaynak },
      kiraci: bos ? null : { id: `k${i + 1}`, fullName: `Örnek Kiracı ${i + 1}`, monthlyRent: kira, contractStart: "2025-03-01", rating: i % 4 === 0 ? 4 : null },
      oturanKiraciSayisi: bos ? 0 : 1,
      durum,
      kiraGirilmemis: !bos && kira === null,
      borcKaydiYok: durum === "bekliyor" && i % 2 === 0,
      gecikmisBorc: durum === "gecikmis" ? (kira ?? 15000) * (1 + (i % 2)) : 0,
      gecikmeGun: durum === "gecikmis" ? 14 + i : 0,
      buAyVade: durum === "bekliyor" && i % 2 === 1 ? "2026-10-25" : null,
    };
  });
}

export default function GelistirmeYeniPanel() {
  if (process.env.NODE_ENV === "production") notFound();

  const birimler = ornekBirimler();
  const dolu = birimler.filter((b) => b.isOccupied).length;
  const gecikmis = birimler.filter((b) => b.durum === "gecikmis");
  const ozet: PanelOzeti = {
    mulkSayisi: birimler.length,
    doluSayisi: dolu,
    bosSayisi: birimler.length - dolu,
    kiraciSayisi: dolu,
    buAyTahsilat: 186500,
    buYilTahsilat: 1942300,
    tahsilatOrani: 64,
    gecikmisSayisi: gecikmis.length,
    gecikmisTutar: gecikmis.reduce((t, b) => t + b.gecikmisBorc, 0),
    gecikenler: gecikmis.map((b) => ({ id: `d${b.id}`, tenantId: b.kiraci!.id, tenantName: b.kiraci!.fullName, propertyTitle: b.title, year: 2026, month: 9, remaining: b.gecikmisBorc })),
    mulkTipleri: [
      { label: "Ofis", value: 24 },
      { label: "Konut", value: 10 },
      { label: "Fabrika", value: 1 },
      { label: "Depo", value: 1 },
    ],
    iller: [
      { il: "Konya", mulkSayisi: 31 },
      { il: "Ankara", mulkSayisi: 4 },
    ],
    ilsizMulkSayisi: 1,
  };
  const dolular = birimler.filter((b) => b.kiraci);
  const bugun: BugunListeleri = {
    vadesiGelenler: dolular.filter((b) => b.buAyVade).map((b) => ({ birimId: b.id, tenantId: b.kiraci!.id, tenantName: b.kiraci!.fullName, propertyTitle: b.title, tarih: b.buAyVade!, tutar: b.kiraci!.monthlyRent ?? 0 })),
    sozlesmeYenilemeleri: dolular.slice(0, 2).map((b, i) => ({ birimId: b.id, tenantId: b.kiraci!.id, tenantName: b.kiraci!.fullName, propertyTitle: b.title, tarih: i ? "2026-12-01" : "2026-11-15" })),
    kiraArtislari: dolular.slice(4, 5).map((b) => ({ birimId: b.id, tenantId: b.kiraci!.id, tenantName: b.kiraci!.fullName, propertyTitle: b.title, tarih: "2026-11-01" })),
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 sm:px-8 py-6">
      <p className="mb-4 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
        Geliştirme önizlemesi — uydurma veri, üretimde kapalı.
      </p>
      <YeniPanel ozet={ozet} birimler={birimler} bugun={bugun} tarihMetni="19 Ekim 2026 Pazartesi" />
    </div>
  );
}
