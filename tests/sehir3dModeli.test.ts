// Mülk Şehrim 3D modeli testleri. Çalıştır: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { binaCoz } from "@/lib/binaEslestir";
import { binalariKur } from "@/lib/yeniPanelBina";
import { aileSec, izgaraYerlesimi, kuleGenisligi, sehirBinasi } from "@/lib/sehir3dModeli";
import type { PanelBirimi } from "@/lib/yeniPanelTipleri";

let s = 0;
function birim(title: string, tip: string): PanelBirimi {
  const id = `u${++s}`;
  const c = binaCoz({ id, title, address: "", city: "Konya" });
  return {
    id, title, address: "", city: "Konya", district: null, propertyType: tip, isOccupied: true, il: c.il,
    bina: { anahtar: c.binaAnahtari, ad: c.binaAdi, blok: c.blok, birimNo: c.birimNo, guven: c.guven, kaynak: c.kaynak, binaId: null, konum: null },
    kiraci: null, oturanKiraciSayisi: 0, durum: "odendi", kiraGirilmemis: false, borcKaydiYok: false, gecikmisBorc: 0, gecikmeGun: 0, buAyVade: null,
  };
}
const coklu = (onEk: string, n: number, tip: string) => Array.from({ length: n }, (_, i) => birim(`${onEk} No:${i + 1}`, tip));

test("aileSec: tip ve birim sayısına göre", () => {
  const kur = (b: PanelBirimi[]) => binalariKur(b)[0];
  assert.equal(aileSec(kur([birim("Çarşı AVM", "AVM")])), "avm");
  assert.equal(aileSec(kur([birim("Depo 1", "DEPO")])), "fabrika");
  assert.equal(aileSec(kur([birim("Tıp Merkezi", "OFIS")])), "kucukofis");
  assert.equal(aileSec(kur(coklu("İş Hanı", 8, "OFIS"))), "han");
  assert.equal(aileSec(kur(coklu("İş Hanı", 21, "OFIS"))), "plaza");
  assert.equal(aileSec(kur(coklu("Gül Apt.", 10, "KONUT"))), "apt");
  assert.equal(aileSec(kur(coklu("Gül Apt.", 30, "KONUT"))), "plaza");
  const tek = aileSec(kur([birim("Bağ Evi", "KONUT")]));
  assert.ok(tek === "villa" || tek === "mustakil");
  const ab = binalariKur([...coklu("Beştepe A", 3, "OFIS"), ...coklu("Beştepe B", 3, "OFIS")])[0];
  assert.equal(aileSec(ab), "plaza");
});

test("sehirBinasi: plaza blok başına kule, her birim tam bir hücrede", () => {
  const birimler = [...coklu("Beştepe A", 34, "OFIS"), ...coklu("Beştepe B", 34, "OFIS")];
  const b = sehirBinasi(binalariKur(birimler)[0]);
  assert.equal(b.aile, "plaza");
  assert.deepEqual(b.kuleler.map((k) => k.ad), ["A", "B"]);
  const ids = b.kuleler.flatMap((k) => k.izgara.flat()).filter(Boolean).map((h) => h!.id);
  assert.equal(ids.length, 68);
  assert.equal(new Set(ids).size, 68);
  assert.ok(b.w <= 38 && b.w >= 2 * kuleGenisligi(b.kat_basi));
});

test("sehirBinasi: apartman 2 birim/kat, kat sayısı yukarı yuvarlanır", () => {
  const b = sehirBinasi(binalariKur(coklu("Gül Apt.", 7, "KONUT"))[0]);
  assert.equal(b.aile, "apt");
  assert.equal(b.katlar, 4);
  assert.equal(b.izgara.flat().filter(Boolean).length, 7);
});

test("sehirBinasi: aynı anahtar her seferinde aynı görünüm (kararlı)", () => {
  const a = sehirBinasi(binalariKur([birim("Bağ Evi", "KONUT")])[0]);
  const b = sehirBinasi(binalariKur([{ ...birim("Bağ Evi", "KONUT"), id: "farkli" }])[0]);
  assert.equal(a.aile, b.aile);
  assert.equal(a.renk.duvar, b.renk.duvar);
});

test("izgaraYerlesimi: boş arsa yok, yalnız ilk N hücre", () => {
  assert.deepEqual(izgaraYerlesimi(1), { gx: 1, gz: 1, hucreler: [[0, 0]] });
  const y = izgaraYerlesimi(5);
  assert.equal(y.gx, 3);
  assert.equal(y.gz, 2);
  assert.equal(y.hucreler.length, 5);
  assert.deepEqual(y.hucreler[4], [1, 1]);
  assert.equal(izgaraYerlesimi(10).gx, 4);
});

test("ARSA: bina yerine çevrili boş parsel ailesi", () => {
  const b = sehirBinasi(binalariKur([birim("Organize Arsa", "ARSA")])[0]);
  assert.equal(b.aile, "arsa");
  assert.equal(b.katlar, 0);
});
