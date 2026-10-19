// Binalarım kayıt doğrulaması testleri. Çalıştır: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { kayitDogrula, konumDogrula } from "@/lib/binalarimKayit";

const MULK = new Set(["m1", "m2", "m3"]);
const BINA = new Set(["b1"]);
const gecerli = () => ({
  binalar: [
    { id: "b1", ad: "  Beştepe  ", il: "Konya", ilce: "Selçuklu", konum: { lat: 37.93, lng: 32.5, dogrulandi: true }, birimler: [{ propertyId: "m1", blok: "a", daireNo: "10" }] },
    { id: null, ad: "Gül Apt.", il: null, ilce: "", konum: null, birimler: [{ propertyId: "m2", blok: "", daireNo: "102-103" }] },
  ],
});

test("geçerli kayıt: metinler sadeleşir, blok büyük harf, boş alanlar null", () => {
  const r = kayitDogrula(gecerli(), MULK, BINA);
  assert.ok(r.ok);
  if (!r.ok) return;
  assert.equal(r.binalar[0].ad, "Beştepe");
  assert.equal(r.binalar[0].birimler[0].blok, "A");
  assert.equal(r.binalar[1].ilce, null);
  assert.equal(r.binalar[1].birimler[0].blok, null);
  assert.equal(r.binalar[1].birimler[0].daireNo, "102-103");
});

test("başka hesabın mülkü ya da binası reddedilir (yetki)", () => {
  const g1 = gecerli();
  g1.binalar[1].birimler[0].propertyId = "baskasinin";
  assert.equal(kayitDogrula(g1, MULK, BINA).ok, false);
  const g2 = gecerli();
  g2.binalar[0].id = "baska-bina";
  assert.equal(kayitDogrula(g2, MULK, BINA).ok, false);
});

test("bir mülk iki binada olamaz; aynı bina iki kez gönderilemez", () => {
  const g1 = gecerli();
  g1.binalar[1].birimler.push({ propertyId: "m1", blok: "", daireNo: "" });
  assert.equal(kayitDogrula(g1, MULK, BINA).ok, false);
  const g2 = gecerli();
  g2.binalar[1].id = "b1";
  assert.equal(kayitDogrula(g2, MULK, BINA).ok, false);
});

test("il listeden olmalı; konum Türkiye kutusunda; blok biçimi; boş ad; birimsiz bina", () => {
  const kontrol = (deg: (g: ReturnType<typeof gecerli>) => void) => {
    const g = gecerli();
    deg(g);
    return kayitDogrula(g, MULK, BINA).ok;
  };
  assert.equal(kontrol((g) => (g.binalar[0].il = "KONYA ")), false);
  assert.equal(kontrol((g) => (g.binalar[0].konum = { lat: 0, lng: 0, dogrulandi: true })), false);
  assert.equal(kontrol((g) => (g.binalar[0].birimler[0].blok = "<script>")), false);
  assert.equal(kontrol((g) => (g.binalar[0].ad = "   ")), false);
  assert.equal(kontrol((g) => (g.binalar[0].birimler = [])), false);
  assert.equal(kayitDogrula({}, MULK, BINA).ok, false);
});

test("konumDogrula", () => {
  assert.deepEqual(konumDogrula({ lat: 37.9, lng: 32.5 }), { lat: 37.9, lng: 32.5, dogrulandi: true });
  assert.equal(konumDogrula({ lat: "x", lng: 32 }), null);
  assert.equal(konumDogrula(null), null);
});
