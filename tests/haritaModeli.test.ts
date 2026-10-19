// Konum haritası modeli testleri. Çalıştır: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { binaKonumlari, haritaSeviyesi, kumele, sinirKutusu } from "@/lib/haritaModeli";
import type { Bina } from "@/lib/yeniPanelBina";

function bina(anahtar: string, il: string | null, ilce: string | null): Bina {
  return { anahtar, ad: anahtar, il, ilce, adres: "", tip: "KONUT", bloklar: [], bloksuz: [], birimler: [], kontrolGerekli: false, tekBirim: true, binaId: null, konum: null };
}

test("haritaSeviyesi: <11 il, 11–13 ilçe, ≥13 pin", () => {
  assert.equal(haritaSeviyesi(6), "il");
  assert.equal(haritaSeviyesi(10.99), "il");
  assert.equal(haritaSeviyesi(11), "ilce");
  assert.equal(haritaSeviyesi(12.9), "ilce");
  assert.equal(haritaSeviyesi(13), "pin");
});

test("binaKonumlari: ilçe merkezi, il merkezi, ilsiz → konumsuz; hepsi doğrulanmadı", () => {
  const { konumlar, konumsuz } = binaKonumlari([
    bina("a", "Konya", "Meram"),
    bina("b", "Konya", "Bilinmeyen"),
    bina("c", null, null),
  ]);
  assert.deepEqual(konumlar.map((k) => [k.anahtar, k.kaynak, k.dogrulanmadi]), [
    ["a", "ilce", true],
    ["b", "il", true],
  ]);
  assert.deepEqual(konumsuz.map((b) => b.anahtar), ["c"]);
});

test("binaKonumlari: aynı merkeze düşen binalar üst üste binmez", () => {
  const { konumlar } = binaKonumlari([bina("a", "Konya", "Meram"), bina("b", "Konya", "Meram"), bina("c", "Konya", "Meram")]);
  const noktalar = new Set(konumlar.map((k) => k.nokta.join(",")));
  assert.equal(noktalar.size, 3);
  for (const k of konumlar) assert.ok(Math.abs(k.nokta[0] - konumlar[0].nokta[0]) < 0.02);
});

test("binaKonumlari: oturumdaki elle düzeltme önceliklidir", () => {
  const { konumlar } = binaKonumlari([bina("a", "Konya", "Meram")], { a: [32.5, 37.9] });
  assert.deepEqual(konumlar[0].nokta, [32.5, 37.9]);
  assert.equal(konumlar[0].kaynak, "duzeltildi");
});

test("kumele: il seviyesinde tek binalık il kümelenmez, seçili bina hariç tutulur", () => {
  const { konumlar } = binaKonumlari([bina("a", "Konya", "Meram"), bina("b", "Konya", "Selçuklu"), bina("c", "Ankara", "Çankaya")]);
  const il = kumele(konumlar, "il", null);
  assert.deepEqual(il.kumeler.map((k) => [k.ad, k.binaSayisi]), [["Konya", 2]]);
  assert.equal(il.kumedekiler.has("c"), false);

  const ilce = kumele(konumlar, "ilce", null);
  assert.equal(ilce.kumeler.length, 0);

  const secili = kumele(konumlar, "il", "a");
  assert.equal(secili.kumeler.length, 0);
  assert.equal(kumele(konumlar, "pin", null).kumeler.length, 0);
});

test("sinirKutusu: tek noktaya pay bırakır, boşsa null", () => {
  assert.equal(sinirKutusu([]), null);
  const k = sinirKutusu([[32.5, 37.9]])!;
  assert.ok(k[0][0] < 32.5 && k[1][0] > 32.5);
});
