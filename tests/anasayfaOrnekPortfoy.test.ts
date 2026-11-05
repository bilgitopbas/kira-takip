// Ana sayfa "Mülk Şehrim" vitrini örnek portföyü testleri. Çalıştır: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { ornekBinalar, ornekBirimler } from "@/lib/anasayfaOrnekPortfoy";
import { aileSec } from "@/lib/sehir3dModeli";

test("örnek portföy: 8 bina, adlar uygulama ekranlarıyla aynı, birim sayıları tutarlı", () => {
  const b = ornekBinalar();
  const ad = (n: string) => b.find((x) => x.ad === n);
  assert.equal(b.length, 8);
  assert.equal(ad("Mavi Kule")?.birimler.length, 24);
  assert.equal(ad("Mavi Kule")?.bloklar.length, 2, "A ve B blok");
  assert.equal(ad("Örnek Çarşı")?.birimler.length, 12);
  assert.equal(ad("Deneme Lojistik Deposu")?.birimler.length, 1);
  assert.equal(b.reduce((t, x) => t + x.birimler.length, 0), ornekBirimler().length);
});

test("örnek portföy: 3D biçimleri mülk tipinden gelir (kule, AVM, depo, arsa)", () => {
  const b = ornekBinalar();
  const aile = (n: string) => aileSec(b.find((x) => x.ad === n)!);
  assert.equal(aile("Mavi Kule"), "plaza");
  assert.equal(aile("Örnek Çarşı"), "avm");
  assert.equal(aile("Deneme Lojistik Deposu"), "fabrika");
  assert.equal(aile("Yeşil Arsa"), "arsa");
});

test("örnek portföy: yalnız uydurma veri; kayıtlı bina, konum ya da gerçek kimlik yok", () => {
  const u = ornekBirimler();
  assert.ok(u.every((x) => x.id.startsWith("ornek") && x.bina.binaId === null && x.bina.konum === null));
  assert.ok(u.every((x) => !x.kiraci || x.kiraci.fullName.startsWith("Örnek Kiracı")));
  assert.ok(u.every((x) => x.il !== null), "her birimin ili eşlenir (haritada pin çıkar)");
  assert.ok(u.some((x) => x.durum === "gecikmis") && u.some((x) => x.durum === "bos"), "tüm durumlar görünür");
});
