// Ana sayfa grafik/etiket yardımcıları testleri. Çalıştır: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { egriYolu, olcekle, trSayi, yavaslayan, tohumluRastgele, kapakEsle, etiketKonumu, kesisir } from "@/lib/anasayfaGrafik";
import izler from "@/components/anasayfa/sehirEtiketleri.json";

test("eğri yolu: ilk nokta M, sonrakiler kübik; boş dizi boş yol", () => {
  assert.equal(egriYolu([]), "");
  assert.equal(egriYolu([[0, 10], [10, 0]]), "M0,10 C5,10 5,0 10,0");
  assert.equal(egriYolu(olcekle([1, 2, 3], 100, 50, 1, 3)).split(" C").length, 3);
});

test("ölçekleme: büyük değer yukarıda, uçlar alanın kenarında", () => {
  const n = olcekle([0, 5, 10], 200, 100, 0, 10);
  assert.deepEqual(n[0], [0, 100]);
  assert.deepEqual(n[2], [200, 0]);
  assert.equal(n[1][1], 50);
});

test("Türkçe sayı biçimi ve sayaç ilerlemesi", () => {
  assert.equal(trSayi(5000), "5.000");
  assert.equal(trSayi(1.62, 2), "1,62");
  assert.equal(yavaslayan(0), 0);
  assert.equal(yavaslayan(1), 1);
  assert.ok(yavaslayan(0.5) > 0.9, "başta hızlı, sonda yavaş");
});

test("tohumlu rastgele: aynı tohum aynı dizi (sunucu ve istemci aynı çizer)", () => {
  const a = tohumluRastgele(7), b = tohumluRastgele(7);
  const da = [a(), a(), a()], db = [b(), b(), b()];
  assert.deepEqual(da, db);
  assert.ok(da.every((x) => x >= 0 && x < 1));
});

test("kapak eşlemesi: geniş kapta video yatay sığar, dikey taşan kısım konuma göre kırpılır", () => {
  const esle = kapakEsle({ g: 1600, y: 900 }, { g: 1600, y: 1200 }, 0.7, 0.5);
  const [x0, y0] = esle(0, 0);
  const [x1, y1] = esle(1, 1);
  assert.ok(Math.abs(y1 - y0 - 1200) < 1e-6, "yükseklik kaba eşit");
  assert.ok(x0 < 0 && x1 > 1600, "genişlik taşar");
  assert.ok(Math.abs(x0 + (x1 - 1600)) > 0, "konum 0.7: sol taraf daha çok kırpılır");
});

test("etiket konumu: kareler arası enterpolasyon, döngü ve gizli kare", () => {
  const k = [[[0, 0], null], [[1000, 500], [10, 10]]] as ([number, number] | null)[][];
  assert.deepEqual(etiketKonumu(k, 10, 0.05, 0), [0.5, 0.25]);
  assert.deepEqual(etiketKonumu(k, 10, 0.2, 0), [0, 0], "döngü başa sarar");
  assert.equal(etiketKonumu(k, 10, 0, 1), null, "görünmeyen etiket");
});

test("kayıtlı etiket izleri: 24 sn tam tur, 10 kare/sn, iki görünüm, 7 bina", () => {
  assert.equal(izler.bilgi.length, 7);
  assert.ok(izler.bilgi.some((b) => b.ad === "Bahçe Villası"), "Türkçe harfler bozulmamış");
  assert.ok(izler.bilgi.every((b) => !/Ã|Ä/.test(b.ad)));
  for (const g of [izler.masaustu, izler.telefon]) {
    assert.equal(g.fps, 10);
    assert.equal(g.kareler.length, 240);
    assert.ok(g.kareler.every((f) => f.length === 7));
  }
  assert.ok(kesisir({ l: 0, t: 0, r: 10, b: 10 }, { l: 5, t: 5, r: 15, b: 15 }));
  assert.ok(!kesisir({ l: 0, t: 0, r: 10, b: 10 }, { l: 10, t: 0, r: 20, b: 10 }));
});
