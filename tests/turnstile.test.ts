// Turnstile sunucu doğrulaması: fail-closed kuralları. Ağ yok, fetch taklit edilir. Çalıştır: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { turnstileDogrula, turnstileHataYaniti } from "@/lib/turnstile";

const yanit = (veri: unknown, durum = 200) =>
  (async () => new Response(JSON.stringify(veri), { status: durum })) as unknown as typeof fetch;
const ortam = (fetchFn: typeof fetch, ek: { gizli?: string; uretim?: boolean } = {}) => ({
  gizli: "gizli",
  uretim: true,
  fetchFn,
  ...ek,
});
const sessiz = <T>(f: () => Promise<T>) => {
  const eski = console.error;
  console.error = () => {};
  return f().finally(() => (console.error = eski));
};

test("anahtar yok: geliştirmede atlanır, üretimde reddedilir", async () => {
  const hicCagrilmaz = (async () => assert.fail("fetch çağrılmamalı")) as unknown as typeof fetch;
  assert.equal(await turnstileDogrula(undefined, null, ortam(hicCagrilmaz, { gizli: undefined, uretim: false })), "TAMAM");
  assert.equal(await sessiz(() => turnstileDogrula("j", null, ortam(hicCagrilmaz, { gizli: undefined }))), "ANAHTAR_YOK");
  assert.equal(await sessiz(() => turnstileDogrula("j", null, ortam(hicCagrilmaz, { gizli: "" }))), "ANAHTAR_YOK");
});

test("jeton yok, boş, metin değil ya da çok uzun: siteverify'a gitmeden ret", async () => {
  const hicCagrilmaz = (async () => assert.fail("fetch çağrılmamalı")) as unknown as typeof fetch;
  for (const j of [undefined, null, "", 5, {}, "x".repeat(2049)]) {
    assert.equal(await turnstileDogrula(j, null, ortam(hicCagrilmaz)), "JETON_YOK", String(j));
  }
});

test("siteverify başarı / ret", async () => {
  assert.equal(await turnstileDogrula("j", null, ortam(yanit({ success: true }))), "TAMAM");
  assert.equal(await turnstileDogrula("j", null, ortam(yanit({ success: false, "error-codes": ["invalid-input-response"] }))), "GECERSIZ");
  assert.equal(await sessiz(() => turnstileDogrula("j", null, ortam(yanit({ success: false, "error-codes": ["invalid-input-secret"] })))), "GECERSIZ");
  assert.equal(await turnstileDogrula("j", null, ortam(yanit({ success: "true" }))), "GECERSIZ");
});

test("ağ hatası, zaman aşımı, HTTP hatası ve bozuk JSON: ret (fail-closed)", async () => {
  const atar = (async () => {
    throw new DOMException("zaman", "TimeoutError");
  }) as unknown as typeof fetch;
  const bozuk = (async () => new Response("<html>", { status: 200 })) as unknown as typeof fetch;
  assert.equal(await sessiz(() => turnstileDogrula("j", null, ortam(atar))), "ULASILAMADI");
  assert.equal(await sessiz(() => turnstileDogrula("j", null, ortam(yanit({}, 500)))), "ULASILAMADI");
  assert.equal(await sessiz(() => turnstileDogrula("j", null, ortam(bozuk))), "ULASILAMADI");
});

test("istek gövdesi: gizli anahtar, jeton ve bilinen IP", async () => {
  let govde = "";
  const yakala = (async (_u: string, i: RequestInit) => {
    govde = String(i.body);
    return new Response(JSON.stringify({ success: true }));
  }) as unknown as typeof fetch;
  await turnstileDogrula("a&b", "1.2.3.4", ortam(yakala));
  const p = new URLSearchParams(govde);
  assert.equal(p.get("secret"), "gizli");
  assert.equal(p.get("response"), "a&b");
  assert.equal(p.get("remoteip"), "1.2.3.4");
  await turnstileDogrula("j", "unknown", ortam(yakala));
  assert.equal(new URLSearchParams(govde).get("remoteip"), null);
});

test("hata yanıtları: yapılandırma/ulaşılamama 503, doğrulama 400, başarıda yok", async () => {
  assert.equal(turnstileHataYaniti("TAMAM"), null);
  assert.equal(turnstileHataYaniti("ANAHTAR_YOK")?.status, 503);
  assert.equal(turnstileHataYaniti("ULASILAMADI")?.status, 503);
  assert.equal(turnstileHataYaniti("JETON_YOK")?.status, 400);
  assert.equal(turnstileHataYaniti("GECERSIZ")?.status, 400);
  assert.ok(typeof (await turnstileHataYaniti("GECERSIZ")!.json()).error === "string");
});
