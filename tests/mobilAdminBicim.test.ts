// Mobil yönetim uçlarının gövde denetimi. Çalıştır: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { duyuruGirdisi, kullaniciDegisikligi, odemeDurumuMu, odemeIslemi } from "@/lib/mobilAdminBicim";
import { paketMi } from "@/lib/paketler";

test("paketMi", () => {
  for (const p of ["TRIAL", "ACTIVE", "DANISMAN", "PASSIVE"]) assert.equal(paketMi(p), true);
  for (const p of ["trial", "", null, undefined, 1, "ADMIN"]) assert.equal(paketMi(p), false);
});

test("kullaniciDegisikligi: geçerli alanlar", () => {
  assert.deepEqual(kullaniciDegisikligi({ paket: "DANISMAN" }), { paket: "DANISMAN" });
  assert.deepEqual(kullaniciDegisikligi({ yonetimIstiyor: false }), { yonetimIstiyor: false });
  assert.deepEqual(kullaniciDegisikligi({ mulkLimiti: 5 }), { mulkLimiti: 5 });
  assert.deepEqual(
    kullaniciDegisikligi({ paket: "ACTIVE", yonetimIstiyor: true, mulkLimiti: 1, fazla: "x" }),
    { paket: "ACTIVE", yonetimIstiyor: true, mulkLimiti: 1 }
  );
});

test("kullaniciDegisikligi: bozuk alan ya da boş gövde hata", () => {
  const hata = (g: Record<string, unknown>) => "hata" in kullaniciDegisikligi(g);
  assert.ok(hata({}));
  assert.ok(hata({ fazla: 1 }));
  assert.ok(hata({ paket: "ADMIN" }));
  assert.ok(hata({ yonetimIstiyor: "true" }));
  assert.ok(hata({ yonetimIstiyor: 1 }));
  for (const n of [0, -1, 1.5, "3", null, Infinity, NaN, 100001]) assert.ok(hata({ mulkLimiti: n }), String(n));
  // Bir alan bozuksa diğerleri de yazılmaz
  assert.ok(hata({ paket: "ACTIVE", mulkLimiti: 0 }));
});

test("odemeIslemi", () => {
  assert.deepEqual(odemeIslemi({ islem: "onayla" }), { action: "confirm", note: null });
  assert.deepEqual(odemeIslemi({ islem: "reddet", not: "  dekont yok " }), { action: "reject", note: "dekont yok" });
  assert.deepEqual(odemeIslemi({ islem: "reddet", not: "   " }), { action: "reject", note: null });
  assert.equal((odemeIslemi({ islem: "onayla", not: "x".repeat(600) }) as { note: string }).note.length, 500);
  assert.ok("hata" in odemeIslemi({ islem: "confirm" }));
  assert.ok("hata" in odemeIslemi({}));
  assert.ok("hata" in odemeIslemi({ islem: "onayla", not: 5 }));
});

test("odemeDurumuMu", () => {
  for (const d of ["PENDING", "CONFIRMED", "REJECTED"]) assert.equal(odemeDurumuMu(d), true);
  for (const d of ["pending", "", null]) assert.equal(odemeDurumuMu(d), false);
});

test("duyuruGirdisi", () => {
  assert.deepEqual(duyuruGirdisi({ baslik: " B ", mesaj: " M " }), {
    title: "B",
    subtitle: null,
    message: "M",
    targetId: null,
  });
  assert.deepEqual(duyuruGirdisi({ baslik: "B", altBaslik: "A", mesaj: "M", hedefId: "u1" }), {
    title: "B",
    subtitle: "A",
    message: "M",
    targetId: "u1",
  });
  assert.equal((duyuruGirdisi({ baslik: "B", altBaslik: "  ", mesaj: "M", hedefId: "" }) as { subtitle: null }).subtitle, null);
  const hata = (g: Record<string, unknown>) => "hata" in duyuruGirdisi(g);
  assert.ok(hata({ baslik: "B" }));
  assert.ok(hata({ mesaj: "M" }));
  assert.ok(hata({ baslik: "  ", mesaj: "M" }));
  assert.ok(hata({ baslik: 1, mesaj: "M" }));
  assert.ok(hata({ baslik: "x".repeat(201), mesaj: "M" }));
  assert.ok(hata({ baslik: "B", mesaj: "x".repeat(4001) }));
  assert.ok(hata({ baslik: "B", mesaj: "M", hedefId: 5 }));
});
