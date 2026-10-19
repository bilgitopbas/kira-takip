// Bina görünüm modeli testleri. Çalıştır: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { binaCoz } from "@/lib/binaEslestir";
import { binalariKur, birimEslesir, birimleriSirala, durumMetni, ozetle } from "@/lib/yeniPanelBina";
import type { BirimDurumu, PanelBirimi } from "@/lib/yeniPanelTipleri";

let sira = 0;
function birim(title: string, durum: BirimDurumu, kira: number | null, borc = 0, kiraciAdi = "Örnek Kiracı"): PanelBirimi {
  const id = `p${++sira}`;
  const c = binaCoz({ id, title, address: "", city: "Konya" });
  const bos = durum === "bos";
  return {
    id,
    title,
    address: "Örnek Mah.",
    city: "Konya",
    district: "Selçuklu",
    propertyType: "KONUT",
    isOccupied: !bos,
    il: c.il,
    bina: { anahtar: c.binaAnahtari, ad: c.binaAdi, blok: c.blok, birimNo: c.birimNo, guven: c.guven, kaynak: c.kaynak },
    kiraci: bos ? null : { id: `t${id}`, fullName: kiraciAdi, monthlyRent: kira, contractStart: null, rating: null },
    oturanKiraciSayisi: bos ? 0 : 1,
    durum,
    kiraGirilmemis: !bos && kira === null,
    borcKaydiYok: false,
    gecikmisBorc: borc,
    gecikmeGun: borc ? 10 : 0,
    buAyVade: null,
  };
}

const BIRIMLER = [
  birim("Beştepe A No:10", "odendi", 20000),
  birim("Beştepe 2A No:2", "gecikmis", 18000, 18000, "Ayşe Örnek"),
  birim("Beştepe B No:5", "bos", null),
  birim("Beştepe B No:12", "bekliyor", null),
  birim("KONYA DORUK SAN. 1M-1N", "odendi", 90000),
];

test("binalariKur: Beştepe tek bina, A/B blokları; eşleşmeyen tek birim", () => {
  const binalar = binalariKur(BIRIMLER);
  assert.equal(binalar.length, 2);
  const b = binalar.find((x) => x.ad === "Beştepe")!;
  assert.deepEqual(b.bloklar.map((x) => [x.ad, x.birimler.map((u) => u.bina.birimNo)]), [
    ["A", ["2", "10"]],
    ["B", ["5", "12"]],
  ]);
  assert.equal(b.kontrolGerekli, true);
  assert.equal(b.ilce, "Selçuklu");
  assert.equal(binalar.find((x) => x.ad !== "Beştepe")!.tekBirim, true);
});

test("ozetle: sayaçlar, doluluk, kira toplamı (girilmemiş kira 0), gecikmiş, en kötü", () => {
  const o = ozetle(BIRIMLER.slice(0, 4));
  assert.deepEqual(o.sayac, { odendi: 1, bekliyor: 1, gecikmis: 1, bos: 1 });
  assert.equal(o.dolu, 3);
  assert.equal(o.aylikKira, 38000);
  assert.equal(o.gecikmisBorc, 18000);
  assert.equal(o.enKotu, "gecikmis");
});

test("birimleriSirala: No / Gecikmiş önce / Kira", () => {
  const b = binalariKur(BIRIMLER).find((x) => x.ad === "Beştepe")!.birimler;
  assert.deepEqual(birimleriSirala(b, "no").map((u) => u.bina.birimNo), ["2", "5", "10", "12"]);
  assert.deepEqual(birimleriSirala(b, "gec").map((u) => u.durum), ["gecikmis", "bekliyor", "odendi", "bos"]);
  assert.deepEqual(birimleriSirala(b, "kira").map((u) => u.bina.birimNo), ["10", "2", "5", "12"]);
});

test("birimEslesir: daire no ve kiracı adı (Türkçe büyük/küçük harf)", () => {
  const u = BIRIMLER[1];
  assert.ok(birimEslesir(u, "2"));
  assert.ok(birimEslesir(u, "AYŞE"));
  assert.ok(!birimEslesir(u, "mehmet"));
});

test("durumMetni", () => {
  assert.equal(durumMetni(BIRIMLER[1]), "Gecikmiş · 10 gün");
  assert.equal(durumMetni(BIRIMLER[2]), "Boş · kiracı yok");
  assert.equal(durumMetni({ ...BIRIMLER[3], borcKaydiYok: true }), "Bu ay borç kaydı yok");
  assert.equal(durumMetni({ ...BIRIMLER[3], buAyVade: "2026-10-25" }), "Bekliyor · vade 25.10.2026");
});
