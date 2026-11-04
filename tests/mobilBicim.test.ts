// Mobil API saf kuralları: tür, sözleşme kapısı, abonelik, yenileme kararı, sayfalama.
// Çalıştır: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  abonelikBilgisi,
  kullaniciTuru,
  sayfalama,
  sayiya,
  sorguMetni,
  sorguTarihi,
  sozlesmeGerekli,
  tarihAraligi,
  yenilemeKarari,
  type ErisimOzeti,
} from "@/lib/mobilBicim";

const T = new Date("2026-11-05T10:00:00Z");
const once = (ms: number) => new Date(T.getTime() - ms);
const sonra = (ms: number) => new Date(T.getTime() + ms);

test("kullaniciTuru: üye rolden önce gelir", () => {
  assert.equal(kullaniciTuru("CUSTOMER"), "SAHIP");
  assert.equal(kullaniciTuru("ADMIN"), "ADMIN");
  assert.equal(kullaniciTuru("CUSTOMER", "m1"), "UYE");
  assert.equal(kullaniciTuru("ADMIN", "m1"), "UYE");
});

test("sozlesmeGerekli: yalnız sahipten, iki onay da şart", () => {
  const tam = { termsAcceptedAt: T, marketingConsentAt: T };
  assert.equal(sozlesmeGerekli("SAHIP", tam), false);
  assert.equal(sozlesmeGerekli("SAHIP", { ...tam, termsAcceptedAt: null }), true);
  assert.equal(sozlesmeGerekli("SAHIP", { ...tam, marketingConsentAt: null }), true);
  assert.equal(sozlesmeGerekli("UYE", { termsAcceptedAt: null, marketingConsentAt: null }), false);
  assert.equal(sozlesmeGerekli("ADMIN", { termsAcceptedAt: null, marketingConsentAt: null }), false);
});

test("abonelikBilgisi: yazma kapısı requireWriteAccess kuralıyla aynı", () => {
  const erisim = (state: ErisimOzeti["state"]): ErisimOzeti => ({ state, trialDaysLeft: 0, graceDaysLeft: 0, graceEndsAt: T });
  const sahip = (onayli: boolean) => ({ subscriptionStatus: "TRIAL", trialEndsAt: T, emailVerifiedAt: onayli ? T : null });
  const durum = (state: ErisimOzeti["state"], onayli: boolean) => {
    const a = abonelikBilgisi(sahip(onayli), erisim(state));
    return [a.kilitli, a.yazmaKapali, a.yazmaKapaliSebep];
  };
  assert.deepEqual(durum("TRIAL", false), [false, false, null], "denemede e-posta onayı gerekmez");
  assert.deepEqual(durum("GRACE", false), [false, true, "EPOSTA_ONAYSIZ"]);
  assert.deepEqual(durum("GRACE", true), [false, false, null]);
  assert.deepEqual(durum("ACTIVE", false), [false, true, "EPOSTA_ONAYSIZ"]);
  assert.deepEqual(durum("ACTIVE", true), [false, false, null]);
  assert.deepEqual(durum("LOCKED", true), [true, true, "KILITLI"]);
  assert.deepEqual(durum("LOCKED", false), [true, true, "KILITLI"]);
});

test("yenilemeKarari: tablo", () => {
  const kayit = {
    yenilemeOzeti: "yeni",
    oncekiGecerlilik: sonra(30_000),
    sonKullanma: sonra(1_000_000),
    sessionVersion: 2,
  };
  assert.equal(yenilemeKarari(kayit, "yeni", 2, T), null, "güncel jeton");
  assert.equal(yenilemeKarari(kayit, "eski", 2, T), null, "60 sn içinde eski jeton (yanıt kaybolmuş)");
  assert.equal(yenilemeKarari({ ...kayit, oncekiGecerlilik: once(1) }, "eski", 2, T), "CALINMA_SUPHESI");
  assert.equal(yenilemeKarari({ ...kayit, oncekiGecerlilik: null }, "eski", 2, T), "CALINMA_SUPHESI");
  assert.equal(yenilemeKarari({ ...kayit, sonKullanma: once(1) }, "yeni", 2, T), "SURESI_DOLDU");
  assert.equal(yenilemeKarari(kayit, "yeni", 3, T), "SIFRE_DEGISTI");
});

test("yenilemeKarari: çalınma şüphesi süre ve şifreden önce gelir", () => {
  const kayit = { yenilemeOzeti: "yeni", oncekiGecerlilik: once(1), sonKullanma: once(1), sessionVersion: 1 };
  assert.equal(yenilemeKarari(kayit, "eski", 9, T), "CALINMA_SUPHESI");
});

test("sayfalama: sınırlar ve sarmalayıcı", () => {
  const s = (q: string, v?: number) => sayfalama(new URLSearchParams(q), v);
  assert.deepEqual([s("").sayfa, s("").adet, s("").skip, s("").take], [1, 20, 0, 20]);
  assert.equal(s("adet=500").adet, 100);
  assert.equal(s("adet=0").adet, 20);
  assert.equal(s("adet=-5").adet, 1);
  assert.equal(s("sayfa=-3").sayfa, 1);
  assert.equal(s("sayfa=abc").sayfa, 1);
  assert.equal(s("sayfa=3&adet=10").skip, 20);
  assert.equal(s("", 50).adet, 50);
  assert.deepEqual(s("sayfa=2&adet=2").sar(["a"], 3), { kayitlar: ["a"], sayfa: 2, adet: 2, toplam: 3, sonrakiVar: false });
  assert.equal(s("sayfa=1&adet=2").sar(["a", "b"], 3).sonrakiVar, true);
});

test("sorgu yardımcıları", () => {
  const q = new URLSearchParams("a=%20x%20&b=&t=2026-01-02&z=bozuk");
  assert.equal(sorguMetni(q, "a"), "x");
  assert.equal(sorguMetni(q, "b"), null);
  assert.equal(sorguMetni(q, "yok"), null);
  assert.equal(sorguMetni(new URLSearchParams("a=uzunmetin"), "a", 3), "uzu");
  assert.equal(sorguTarihi(q, "z"), null);
  assert.equal(sorguTarihi(q, "yok"), null);
  assert.equal(sorguTarihi(q, "t")?.toISOString(), "2026-01-02T00:00:00.000Z");
});

test("tarihAraligi ve sayiya", () => {
  assert.equal(tarihAraligi(null, null), undefined);
  assert.deepEqual(tarihAraligi(T, null), { gte: T });
  assert.deepEqual(tarihAraligi(null, T), { lt: T });
  assert.deepEqual(tarihAraligi(T, T), { gte: T, lt: T });
  assert.equal(sayiya(null), null);
  assert.equal(sayiya(undefined), null);
  assert.equal(sayiya(0), 0);
  assert.equal(sayiya({ toString: () => "1250.50" }), 1250.5);
});
