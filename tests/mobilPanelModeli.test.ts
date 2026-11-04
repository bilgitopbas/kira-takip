// Mobil panel saf hesapları: birim süzme, il sayıları, 5. yıl listesi, harita. Çalıştır: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { besYilListesi, birimleriSuz, durumOku, durumSayaci, haritaVerisi, ilSayilari } from "@/lib/mobilPanelModeli";
import { binalariKur } from "@/lib/yeniPanelBina";
import type { BirimDurumu, PanelBirimi } from "@/lib/yeniPanelTipleri";

function birim(id: string, o: Partial<PanelBirimi> & { kiraciAdi?: string; anahtar?: string; binaAdi?: string } = {}): PanelBirimi {
  return {
    id,
    title: o.title ?? `Daire ${id}`,
    address: o.address ?? "Adres",
    city: null,
    district: o.district ?? null,
    propertyType: o.propertyType ?? "KONUT",
    isOccupied: true,
    il: o.il === undefined ? "Konya" : o.il,
    bina: {
      anahtar: o.anahtar ?? `a:${id}`,
      ad: o.binaAdi ?? `Bina ${id}`,
      blok: null,
      birimNo: null,
      guven: "yuksek",
      kaynak: "baslik",
      binaId: null,
      konum: null,
      ...o.bina,
    },
    kiraci: o.kiraciAdi
      ? { id: `k${id}`, fullName: o.kiraciAdi, monthlyRent: 1000, contractStart: null, rating: null, rentPaymentDate: null, toplamBorc: 0 }
      : null,
    oturanKiraciSayisi: o.kiraciAdi ? 1 : 0,
    durum: o.durum ?? "bos",
    kiraGirilmemis: false,
    borcKaydiYok: false,
    gecikmisBorc: 0,
    gecikmeGun: 0,
    buAyVade: null,
  };
}

const BIRIMLER = [
  birim("1", { il: "Konya", durum: "gecikmis", kiraciAdi: "Ayşe Yılmaz", propertyType: "KONUT" }),
  birim("2", { il: "Konya", durum: "odendi", kiraciAdi: "Ömer Şen", propertyType: "OFIS", address: "Çarşı Cad." }),
  birim("3", { il: "Ankara", durum: "bos", propertyType: "KONUT" }),
  birim("4", { il: null, durum: "bekliyor", kiraciAdi: "Işık Demir" }),
];
const idler = (l: PanelBirimi[]) => l.map((b) => b.id);

test("birimleriSuz: her süzgeç ve birleşimi", () => {
  assert.deepEqual(idler(birimleriSuz(BIRIMLER, {})), ["1", "2", "3", "4"]);
  assert.deepEqual(idler(birimleriSuz(BIRIMLER, { il: "Konya" })), ["1", "2"]);
  assert.deepEqual(idler(birimleriSuz(BIRIMLER, { durum: "bos" })), ["3"]);
  assert.deepEqual(idler(birimleriSuz(BIRIMLER, { tip: "OFIS" })), ["2"]);
  assert.deepEqual(idler(birimleriSuz(BIRIMLER, { il: "Konya", tip: "KONUT", durum: "gecikmis" })), ["1"]);
  assert.deepEqual(idler(birimleriSuz(BIRIMLER, { il: "Ankara", tip: "OFIS" })), []);
});

test("birimleriSuz: arama Türkçe duyarlı; başlık, adres, kiracı", () => {
  assert.deepEqual(idler(birimleriSuz(BIRIMLER, { q: "AYŞE" })), ["1"]);
  assert.deepEqual(idler(birimleriSuz(BIRIMLER, { q: "IŞIK" })), ["4"], "I → ı");
  assert.deepEqual(idler(birimleriSuz(BIRIMLER, { q: "çarşı" })), ["2"]);
  assert.deepEqual(idler(birimleriSuz(BIRIMLER, { q: "daire 3" })), ["3"]);
});

test("durumOku ve durumSayaci", () => {
  assert.equal(durumOku("gecikmis"), "gecikmis");
  assert.equal(durumOku("uydurma"), null);
  assert.equal(durumOku(null), null);
  const beklenen: Record<BirimDurumu, number> = { odendi: 1, bekliyor: 1, gecikmis: 1, bos: 1 };
  assert.deepEqual(durumSayaci(BIRIMLER), beklenen);
});

test("ilSayilari: çoktan aza, ilsizler ayrı", () => {
  assert.deepEqual(ilSayilari(BIRIMLER), {
    iller: [
      { il: "Konya", mulkSayisi: 2 },
      { il: "Ankara", mulkSayisi: 1 },
    ],
    ilsizMulkSayisi: 1,
  });
});

test("besYilListesi: −30…+90 gün, sıralı, boş başlangıç atlanır", () => {
  const bugun = new Date(2026, 10, 5, 15, 30); // 5 Kasım 2026
  const k = (id: string, baslangic: Date | null) => ({
    id,
    fullName: `K${id}`,
    contractStart: baslangic,
    propertyId: `p${id}`,
    propertyTitle: `M${id}`,
  });
  const liste = besYilListesi(
    [
      k("ileri90", new Date(2022, 1, 3)), // 3 Şubat 2027 = +90
      k("ileri91", new Date(2022, 1, 4)), // +91 dışarıda
      k("bugun", new Date(2021, 10, 5)),
      k("geri30", new Date(2021, 9, 6)), // 6 Ekim 2026 = −30
      k("geri31", new Date(2021, 9, 5)), // −31 dışarıda
      k("yok", null),
    ],
    bugun
  );
  assert.deepEqual(
    liste.map((s) => [s.tenantId, s.tarih]),
    [
      ["geri30", "2026-10-06"],
      ["bugun", "2026-11-05"],
      ["ileri90", "2027-02-03"],
    ]
  );
  assert.deepEqual(liste[1], { birimId: "pbugun", tenantId: "bugun", tenantName: "Kbugun", propertyTitle: "Mbugun", tarih: "2026-11-05" });
});

test("haritaVerisi: ad ve binaId eklenir; ilsiz bina konumsuz; kayıtlı konum [boylam, enlem]", () => {
  const binalar = binalariKur([
    birim("1", { il: "Konya", binaAdi: "Merkez Apt", anahtar: "m", bina: { anahtar: "m", ad: "Merkez Apt", blok: null, birimNo: null, guven: "yuksek", kaynak: "kayit", binaId: "b1", konum: { lat: 37.87, lng: 32.48, dogrulandi: true } } }),
    birim("2", { il: "Konya", binaAdi: "Türetilen" }),
    birim("3", { il: null, binaAdi: "İlsiz" }),
  ]);
  const { konumlar, konumsuz } = haritaVerisi(binalar);

  const kayitli = konumlar.find((k) => k.anahtar === "m")!;
  assert.deepEqual(kayitli.nokta, [32.48, 37.87]);
  assert.equal(kayitli.kaynak, "kayit");
  assert.equal(kayitli.dogrulanmadi, false);
  assert.equal(kayitli.ad, "Merkez Apt");
  assert.equal(kayitli.binaId, "b1");

  const turetilen = konumlar.find((k) => k.ad === "Türetilen")!;
  assert.equal(turetilen.dogrulanmadi, true);
  assert.equal(turetilen.binaId, null);

  assert.deepEqual(konumsuz, [{ anahtar: "a:3", ad: "İlsiz", il: null, binaId: null }]);
});
