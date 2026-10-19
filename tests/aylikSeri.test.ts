import { test } from "node:test";
import assert from "node:assert/strict";
import { aylikToplam, birikimliSeri, yilIciBirikimli } from "@/lib/aylikSeri";

const BUGUN = new Date(2026, 9, 19);
test("birikimliSeri: ay sonu sayıları", () => {
  const t = [new Date(2026, 2, 5), new Date(2026, 8, 1), new Date(2026, 9, 2)];
  assert.deepEqual(birikimliSeri(t, BUGUN, 3), [1, 2, 3]);
});
test("aylikToplam ve yilIciBirikimli", () => {
  const k = [{ tarih: new Date(2026, 8, 3), tutar: 100 }, { tarih: new Date(2026, 9, 1), tutar: 50 }, { tarih: new Date(2026, 0, 9), tutar: 10 }];
  assert.deepEqual(aylikToplam(k, BUGUN, 2), [100, 50]);
  const y = yilIciBirikimli(k, BUGUN);
  assert.equal(y.length, 10);
  assert.equal(y[0], 10);
  assert.equal(y[9], 160);
});
