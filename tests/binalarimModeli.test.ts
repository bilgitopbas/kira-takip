// Binalarım başlangıç modeli testleri. Çalıştır: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { baslangicGruplari, kayitGovdesi, type BMulk } from "@/lib/binalarimModeli";
import { kayitDogrula } from "@/lib/binalarimKayit";

const m = (id: string, title: string, ek: Partial<BMulk> = {}): BMulk => ({
  id, title, address: "", city: "Konya", district: "Selçuklu", propertyType: "OFIS", buildingId: null, block: null, unitNo: null, ...ek,
});

const MULKLER = [
  m("1", "Beştepe A No:10"),
  m("2", "Beştepe 2A No:5"),
  m("3", "Beştepe B No:7"),
  m("4", "Gül Apt. No:1", { buildingId: "b1", block: null, unitNo: "1" }),
  m("5", "Merkez Dükkan"),
];
const BINALAR = [{ id: "b1", name: "Gül Apartmanı", city: "Konya", district: "Meram", lat: 37.84, lng: 32.43, locationVerified: true }];

test("kontrol gerektiren öneri en üstte; kayıtlı bina en sonda, olduğu gibi", () => {
  const g = baslangicGruplari(MULKLER, BINALAR);
  assert.equal(g[0].ad, "Beştepe");
  assert.equal(g[0].oneri, true);
  assert.equal(g[0].onayli, false);
  assert.ok(g[0].birimler.some((b) => b.kontrol));
  assert.deepEqual(g[0].birimler.map((b) => `${b.blok}-${b.daireNo}`), ["A-5", "A-10", "B-7"]);
  assert.equal(g[0].ilce, "Selçuklu");
  const kayitli = g.find((x) => x.id === "b1")!;
  assert.equal(kayitli.oneri, false);
  assert.equal(kayitli.onayli, true);
  assert.deepEqual(kayitli.konum, { lat: 37.84, lng: 32.43, dogrulandi: true });
  assert.equal(g.length, 3);
});

test("kayıt gövdesi yalnız onaylı grupları gönderir ve doğrulamadan geçer", () => {
  const g = baslangicGruplari(MULKLER, BINALAR);
  let govde = kayitGovdesi(g);
  assert.deepEqual(govde.binalar.map((b) => b.id), ["b1"]);
  g[0].onayli = true;
  govde = kayitGovdesi(g);
  assert.equal(govde.binalar.length, 2);
  const r = kayitDogrula(govde, new Set(MULKLER.map((x) => x.id)), new Set(["b1"]));
  assert.ok(r.ok);
});
