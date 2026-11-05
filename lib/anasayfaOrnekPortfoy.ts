// Ana sayfadaki "Mülk Şehrim" vitrini için uydurma örnek portföy. Gerçek kişi,
// adres ya da hesap verisi içermez; adlar mobil uygulama ekranlarındaki örnek
// verilerle aynıdır. Panelin gerçek 3D ve harita bileşenleri bununla çizilir.
import { binaCoz } from "@/lib/binaEslestir";
import { binalariKur, type Bina } from "@/lib/yeniPanelBina";
import type { BirimDurumu, PanelBirimi } from "@/lib/yeniPanelTipleri";

type Tanim = { bina: string; il: string; ilce: string; tip: string; adet: number; bloklu?: boolean; durumlar: BirimDurumu[] };

const TANIMLAR: Tanim[] = [
  { bina: "Mavi Kule", il: "Ankara", ilce: "Çankaya", tip: "OFIS", adet: 24, bloklu: true, durumlar: ["odendi", "odendi", "odendi", "bekliyor", "gecikmis", "odendi", "bos", "odendi"] },
  { bina: "Örnek Çarşı", il: "Konya", ilce: "Karatay", tip: "AVM", adet: 12, durumlar: ["odendi", "gecikmis", "odendi", "bekliyor", "odendi", "odendi"] },
  { bina: "Liman İş Hanı", il: "Konya", ilce: "Selçuklu", tip: "OFIS", adet: 10, durumlar: ["odendi", "bekliyor", "odendi", "odendi", "bos"] },
  { bina: "Çınar Apartmanı", il: "Konya", ilce: "Meram", tip: "KONUT", adet: 8, durumlar: ["odendi", "gecikmis", "bekliyor", "odendi", "odendi", "bos", "odendi", "odendi"] },
  { bina: "Papatya Evleri", il: "İzmir", ilce: "Karşıyaka", tip: "KONUT", adet: 6, durumlar: ["odendi", "odendi", "bekliyor", "odendi", "bos", "odendi"] },
  { bina: "Deneme Lojistik Deposu", il: "Ankara", ilce: "Sincan", tip: "DEPO", adet: 1, durumlar: ["gecikmis"] },
  { bina: "Bahçe Villası", il: "Konya", ilce: "Meram", tip: "KONUT", adet: 1, durumlar: ["odendi"] },
  { bina: "Yeşil Arsa", il: "Konya", ilce: "Selçuklu", tip: "ARSA", adet: 1, durumlar: ["bos"] },
];

export function ornekBirimler(): PanelBirimi[] {
  const birimler: PanelBirimi[] = [];
  let sira = 0;
  for (const t of TANIMLAR) {
    for (let i = 1; i <= t.adet; i++) {
      sira++;
      const id = `ornek${sira}`;
      const title = t.adet === 1 ? t.bina : t.bloklu ? `${t.bina} ${i <= t.adet / 2 ? "A" : "B"} No:${i}` : `${t.bina} No:${i}`;
      const c = binaCoz({ id, title, address: `Örnek Mah. ${title}`, city: t.il });
      const durum = t.durumlar[(i - 1) % t.durumlar.length];
      const bos = durum === "bos";
      const kira = 12000 + ((sira * 37) % 9) * 3500;
      birimler.push({
        id,
        title,
        address: `Örnek Mah. Deneme Cad. ${title}`,
        city: t.il,
        district: t.ilce,
        propertyType: t.tip,
        isOccupied: !bos,
        il: c.il,
        bina: { anahtar: c.binaAnahtari, ad: c.binaAdi, blok: c.blok, birimNo: c.birimNo, guven: c.guven, kaynak: c.kaynak, binaId: null, konum: null },
        kiraci: bos
          ? null
          : { id: `k${sira}`, fullName: `Örnek Kiracı ${sira}`, monthlyRent: kira, contractStart: "2025-03-01", rating: null, rentPaymentDate: null, toplamBorc: durum === "gecikmis" ? kira : 0 },
        oturanKiraciSayisi: bos ? 0 : 1,
        durum,
        kiraGirilmemis: false,
        borcKaydiYok: false,
        gecikmisBorc: durum === "gecikmis" ? kira : 0,
        gecikmeGun: durum === "gecikmis" ? 8 + (sira % 12) : 0,
        buAyVade: durum === "bekliyor" ? "2026-11-15" : null,
      });
    }
  }
  return birimler;
}

export function ornekBinalar(): Bina[] {
  return binalariKur(ornekBirimler());
}
