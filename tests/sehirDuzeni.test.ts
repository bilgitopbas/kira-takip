// Mülk Şehrim bina düzeni testleri. Çalıştır: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { bosHedefler, duzenDogrula, hedefGecerli, kenarSiniri, kisaAd, tasi, yerlesimCoz } from "@/lib/sehirDuzeni";
import { izgaraYerlesimi } from "@/lib/sehir3dModeli";

const A = ["a", "b", "c", "d", "e"];

test("düzen yoksa varsayılan ızgara (eski görünüm birebir)", () => {
  assert.deepEqual(yerlesimCoz(A, null), izgaraYerlesimi(5).hucreler);
  assert.deepEqual(yerlesimCoz(A, {}), izgaraYerlesimi(5).hucreler);
});

test("kayıtlı hücreler uygulanır; geçersiz, çakışan, sınır dışı kayıt varsayılana düşer", () => {
  const h = yerlesimCoz(A, { a: [4, 4], b: [4, 4], c: [9, 0], d: [1.5, 0] as unknown as [number, number] });
  assert.deepEqual(h[0], [4, 4], "a kayıtlı yerinde");
  assert.notDeepEqual(h[1], [4, 4], "b çakıştı → varsayılan");
  assert.ok(h[2][0] < kenarSiniri(5), "c sınır dışı → varsayılan");
  assert.equal(new Set(h.map((x) => x.join(","))).size, 5, "hiçbir hücre iki kez kullanılmaz");
  // Yeni eklenen bina (düzende yok) boş bir varsayılan hücreye düşer
  const yeni = yerlesimCoz([...A, "f"], tasi(A, yerlesimCoz(A, null), 0, [2, 1])!);
  assert.equal(new Set(yeni.map((x) => x.join(","))).size, 6);
});

test("taşı: boş hücreye taşır, dolu hücrede yer değiştirir, sol üst (0,0)'a hizalar", () => {
  const h = yerlesimCoz(A, null); // a(0,0) b(1,0) c(2,0) d(0,1) e(1,1)
  const bos = tasi(A, h, 0, [2, 1])!;
  assert.deepEqual(bos.a, [2, 1]);
  assert.deepEqual(bos.b, [1, 0]);
  const takas = tasi(A, h, 0, [2, 0])!;
  assert.deepEqual([takas.a, takas.c], [[2, 0], [0, 0]]);
  // Sola (sütun -1) taşıma: herkes bir sağa kayar, göreli düzen korunur
  const sol = tasi(A, h, 2, [-1, 0])!;
  assert.deepEqual(sol.c, [0, 0]);
  assert.deepEqual(sol.a, [1, 0]);
  assert.equal(tasi(A, h, 0, [5, 5]), null, "dolu alanın bir halka dışı geçersiz");
});

test("bırakma hedefleri: bir halka genişletilmiş alanın boş hücreleri; kenar sınırı aşılmaz", () => {
  const h = yerlesimCoz(A, null);
  const hedefler = bosHedefler(h, 0);
  assert.ok(hedefler.some(([i, j]) => i === 2 && j === 1), "ızgaradaki boş hücre");
  assert.ok(hedefler.some(([i, j]) => i === -1 && j === 0), "sol halka");
  assert.ok(!hedefler.some(([i, j]) => i === 0 && j === 0), "dolu hücre hedef listesinde yok (takas ayrıca)");
  // Tek bina: 3x3 sınır
  assert.equal(hedefGecerli([[0, 0]], 0, [1, 0]), true);
  assert.equal(kenarSiniri(1), 3);
});

test("sunucu doğrulaması", () => {
  assert.ok(duzenDogrula({ il: "Konya", duzen: { "b:x": [0, 0], "ankara|bestepe": [1, 0] } }).ok);
  assert.ok(duzenDogrula({ il: "*", duzen: {} }).ok, "boş düzen = sıfırla");
  assert.equal(duzenDogrula({ il: "", duzen: {} }).ok, false);
  assert.equal(duzenDogrula({ il: "Konya", duzen: { a: [0, 0], b: [0, 0] } }).ok, false, "çakışma");
  assert.equal(duzenDogrula({ il: "Konya", duzen: { a: [-1, 0] } }).ok, false);
  assert.equal(duzenDogrula({ il: "Konya", duzen: { a: [0, 9] } }).ok, false, "1 bina için sınır 3");
  assert.equal(duzenDogrula({ il: "Konya", duzen: [] }).ok, false);
  assert.equal(duzenDogrula({ il: "Konya", duzen: { a: [0.5, 0] } }).ok, false);
});

test("kısa ad", () => {
  assert.equal(kisaAd("Beştepe"), "Beştepe");
  assert.equal(kisaAd("Çakıroğlu İş Merkezi"), "Çakıroğlu");
  assert.equal(kisaAd("Örnektepe Konutları"), "Örnektepe");
});
