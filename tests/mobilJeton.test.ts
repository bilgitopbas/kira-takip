// Mobil erişim jetonu testleri: süre, tür, anahtar ayrımı. Çalıştır: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { SignJWT } from "jose";
import {
  ERISIM_SURESI_SN,
  bearerAyikla,
  erisimJetonuCoz,
  erisimJetonuUret,
  jetonOzeti,
  yenilemeJetonuUret,
  type MobilJetonIcerigi,
} from "@/lib/mobilJeton";

process.env.SESSION_SECRET = "deneme-gizli-anahtar-en-az-otuz-iki-karakter";

const ICERIK: MobilJetonIcerigi = { userId: "u1", role: "CUSTOMER", sv: 3, oturumId: "o1" };
const SIMDI = Date.parse("2026-11-05T10:00:00Z");

test("üret/çöz: içerik korunur, süre 5 dk", async () => {
  const { jeton, bitis } = await erisimJetonuUret(ICERIK, SIMDI);
  assert.equal(bitis.getTime(), SIMDI + ERISIM_SURESI_SN * 1000);
  assert.deepEqual(await erisimJetonuCoz(jeton, SIMDI), ICERIK);
});

test("üye alanları taşınır", async () => {
  const uye = { ...ICERIK, memberId: "m1", memberEmail: "uye@x.com", memberName: "Üye" };
  const { jeton } = await erisimJetonuUret(uye, SIMDI);
  assert.deepEqual(await erisimJetonuCoz(jeton, SIMDI), uye);
});

test("süresi dolan jeton reddedilir", async () => {
  const { jeton } = await erisimJetonuUret(ICERIK, SIMDI);
  assert.equal(await erisimJetonuCoz(jeton, SIMDI + (ERISIM_SURESI_SN + 1) * 1000), null);
  assert.notEqual(await erisimJetonuCoz(jeton, SIMDI + (ERISIM_SURESI_SN - 1) * 1000), null);
});

test("web çerezi anahtarıyla imzalı jeton mobil jeton sayılmaz", async () => {
  const webAnahtari = new TextEncoder().encode(process.env.SESSION_SECRET!);
  const web = await new SignJWT({ tur: "mobil-erisim", ...ICERIK })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt(Math.floor(SIMDI / 1000))
    .setExpirationTime(Math.floor(SIMDI / 1000) + 60)
    .sign(webAnahtari);
  assert.equal(await erisimJetonuCoz(web, SIMDI), null);
});

test("bozuk, boş ve aşırı uzun jeton null", async () => {
  const { jeton } = await erisimJetonuUret(ICERIK, SIMDI);
  assert.equal(await erisimJetonuCoz(null, SIMDI), null);
  assert.equal(await erisimJetonuCoz("", SIMDI), null);
  assert.equal(await erisimJetonuCoz("a.b.c", SIMDI), null);
  assert.equal(await erisimJetonuCoz(`${jeton.slice(0, -2)}xx`, SIMDI), null);
  assert.equal(await erisimJetonuCoz("x".repeat(5000), SIMDI), null);
});

test("anahtar değişince eski jeton geçersiz", async () => {
  const { jeton } = await erisimJetonuUret(ICERIK, SIMDI);
  const eski = process.env.SESSION_SECRET;
  process.env.SESSION_SECRET = "bambaska-gizli-anahtar-en-az-otuz-iki-karakter";
  assert.equal(await erisimJetonuCoz(jeton, SIMDI), null);
  process.env.SESSION_SECRET = eski;
});

test("bearerAyikla", () => {
  assert.equal(bearerAyikla("Bearer abc"), "abc");
  assert.equal(bearerAyikla("Bearer  abc "), "abc");
  assert.equal(bearerAyikla("Bearer "), null);
  assert.equal(bearerAyikla("Basic abc"), null);
  assert.equal(bearerAyikla(null), null);
});

test("yenileme jetonu rastgele, özet düz metni içermez", () => {
  const a = yenilemeJetonuUret();
  assert.notEqual(a, yenilemeJetonuUret());
  assert.ok(a.length >= 43);
  assert.equal(jetonOzeti(a).length, 64);
  assert.ok(!jetonOzeti(a).includes(a));
});
