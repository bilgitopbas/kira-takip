// Bina 3D görünümü seçimi testleri. Çalıştır: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { gorunumCoz, gorunumdenAile, GORUNUMLER } from "@/lib/binaGorunumu";
import { aileSec, sehirBinasi } from "@/lib/sehir3dModeli";
import { kayitDogrula, atamaDogrula } from "@/lib/binalarimKayit";
import type { Bina } from "@/lib/yeniPanelBina";
import type { PanelBirimi } from "@/lib/yeniPanelTipleri";

const birim = (id: string): PanelBirimi =>
  ({ id, title: id, address: "", city: "Ankara", district: null, propertyType: "KONUT", isOccupied: true, il: "Ankara", durum: "odendi", bina: { blok: null, birimNo: null } }) as unknown as PanelBirimi;
const bina = (ad: string, n: number, ek: Partial<Bina> = {}): Bina =>
  ({ anahtar: `k:${ad}`, ad, il: "Ankara", ilce: null, adres: "", tip: "KONUT", bloklar: [], bloksuz: [], birimler: Array.from({ length: n }, (_, i) => birim(`${ad}${i}`)), kontrolGerekli: false, binaId: null, konum: null, tekBirim: n === 1, ...ek }) as Bina;

test("görünüm değerleri: 8 seçenek; boş = otomatik; geçersiz reddedilir", () => {
  assert.equal(GORUNUMLER.length, 8);
  assert.equal(gorunumCoz("plaza"), "plaza");
  assert.equal(gorunumCoz(""), null);
  assert.equal(gorunumCoz(null), null);
  assert.equal(gorunumCoz(undefined), undefined);
  assert.equal(gorunumCoz("kale"), undefined);
  assert.equal(gorunumdenAile("ofis", 1), "kucukofis");
  assert.equal(gorunumdenAile("ofis", 8), "han");
});

test("seçilen görünüm otomatik kuralın önüne geçer; çok birimli villa birimlerini korur", () => {
  assert.equal(aileSec(bina("Towerpark Sitesi", 1)), "plaza", "ad ipucu: tower");
  assert.equal(aileSec(bina("Gül Evi", 1, { gorunum: "plaza" })), "plaza");
  assert.equal(aileSec(bina("Beştepe", 40, { gorunum: "villa" })), "villa");
  assert.equal(sehirBinasi(bina("Beştepe", 40, { gorunum: "villa" })).birimler.length, 40);
  assert.equal(aileSec(bina("Adalet Plaza", 3)), "plaza");
  assert.equal(aileSec(bina("Mavi Kuleleri", 2)), "plaza");
  assert.notEqual(aileSec(bina("Okul Evi", 1)), "plaza", "ipucu yalnız anahtar kelimelerde");
  assert.equal(aileSec(bina("Depo", 1, { tip: "DEPO" })), "fabrika", "tip kuralı ad ipucundan önce");
});

test("Binalarım kaydı ve form ataması görünümü doğrular; gönderilmeyen görünüm korunur", () => {
  const M = new Set(["m1"]);
  const r = kayitDogrula({ binalar: [{ id: null, ad: "Towerpark", il: "Ankara", ilce: null, konum: null, gorunum: "plaza", birimler: [{ propertyId: "m1" }] }] }, M, new Set());
  assert.ok(r.ok && r.binalar[0].gorunum === "plaza");
  const yok = kayitDogrula({ binalar: [{ id: null, ad: "X", il: null, ilce: null, konum: null, birimler: [{ propertyId: "m1" }] }] }, M, new Set());
  assert.ok(yok.ok && !("gorunum" in yok.binalar[0]), "gönderilmeyen görünüm kayıttaki değeri ezmez");
  const kotu = kayitDogrula({ binalar: [{ id: null, ad: "X", il: null, ilce: null, konum: null, gorunum: "kale", birimler: [{ propertyId: "m1" }] }] }, M, new Set());
  assert.ok(!kotu.ok);
  const a = atamaDogrula({ propertyId: "m1", bina: { id: null, ad: "Towerpark", il: "Ankara", ilce: null, konum: null, gorunum: "plaza" } }, M, new Set());
  assert.ok(a.ok && a.atama.bina?.gorunum === "plaza");
});
