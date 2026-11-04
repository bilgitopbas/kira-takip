// Push biçimi ve APNs gönderim döngüsü testleri. Çalıştır: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { EventEmitter } from "node:events";
import type { ClientHttp2Session } from "node:http2";
import {
  apnsAyari,
  apnsGovdesi,
  apnsJwt,
  apnsOluMu,
  fcmAyari,
  fcmJwt,
  fcmMesaji,
  fcmOluMu,
  jetonGecerliMi,
  type ApnsAyari,
} from "@/lib/pushBicim";
import { baglantiKur, iosTopluGonder } from "@/lib/push";

const b64 = (s: string) => Buffer.from(s).toString("base64");
const ec = crypto.generateKeyPairSync("ec", { namedCurve: "P-256" });
const rsa = crypto.generateKeyPairSync("rsa", { modulusLength: 2048 });
const p8 = ec.privateKey.export({ type: "pkcs8", format: "pem" }) as string;
const hesap = JSON.stringify({
  project_id: "proje",
  client_email: "x@proje.iam",
  private_key: rsa.privateKey.export({ type: "pkcs8", format: "pem" }),
});
const TAM = {
  PUSH_ACIK: "1",
  APNS_KEY_B64: b64(p8),
  APNS_KEY_ID: "KID",
  APNS_TEAM_ID: "TEAM",
  APNS_BUNDLE_ID: "com.x",
  FCM_SERVICE_ACCOUNT_B64: b64(hesap),
};

test("PUSH_ACIK olmadan ve eksik anahtarla kapalı", () => {
  assert.equal(apnsAyari({ ...TAM, PUSH_ACIK: undefined }), null);
  assert.equal(fcmAyari({ ...TAM, PUSH_ACIK: undefined }), null);
  assert.equal(apnsAyari({ ...TAM, PUSH_ACIK: "0" }), null);
  for (const eksik of ["APNS_KEY_B64", "APNS_KEY_ID", "APNS_TEAM_ID", "APNS_BUNDLE_ID"]) {
    assert.equal(apnsAyari({ ...TAM, [eksik]: undefined }), null, eksik);
  }
  assert.equal(fcmAyari({ ...TAM, FCM_SERVICE_ACCOUNT_B64: b64("{bozuk") }), null);
  assert.equal(fcmAyari({ ...TAM, FCM_SERVICE_ACCOUNT_B64: b64('{"project_id":"p"}') }), null);
});

test("APNs sunucusu: varsayılan üretim, deneme yalnız bayrakla", () => {
  assert.equal(apnsAyari(TAM)?.konak, "api.push.apple.com");
  assert.equal(apnsAyari({ ...TAM, APNS_ORTAM: "deneme" })?.konak, "api.sandbox.push.apple.com");
});

test("apnsJwt: ES256 düz imza doğrulanır", () => {
  const [b, g, i] = apnsJwt(apnsAyari(TAM)!, 1000).split(".");
  assert.deepEqual(JSON.parse(Buffer.from(b, "base64url").toString()), { alg: "ES256", kid: "KID" });
  assert.deepEqual(JSON.parse(Buffer.from(g, "base64url").toString()), { iss: "TEAM", iat: 1000 });
  const imza = Buffer.from(i, "base64url");
  assert.equal(imza.length, 64, "DER değil r||s");
  const dogru = crypto
    .createVerify("SHA256")
    .update(`${b}.${g}`)
    .verify({ key: ec.publicKey, dsaEncoding: "ieee-p1363" }, imza);
  assert.equal(dogru, true);
});

test("fcmJwt: RS256 ve kapsam", () => {
  const [b, g, i] = fcmJwt(fcmAyari(TAM)!, 1000).split(".");
  const yuk = JSON.parse(Buffer.from(g, "base64url").toString());
  assert.equal(yuk.iss, "x@proje.iam");
  assert.equal(yuk.scope, "https://www.googleapis.com/auth/firebase.messaging");
  assert.equal(yuk.exp, 4600);
  assert.equal(crypto.createVerify("RSA-SHA256").update(`${b}.${g}`).verify(rsa.publicKey, Buffer.from(i, "base64url")), true);
});

test("apnsGovdesi: yol ve tur kökte ve data altında; boşsa yok", () => {
  assert.deepEqual(apnsGovdesi({ baslik: "B", altBaslik: "A", govde: "G", tur: "PAYMENT_OVERDUE", yol: "/dashboard/kiraci/1" }), {
    aps: { alert: { title: "B", subtitle: "A", body: "G" }, sound: "default", "thread-id": "PAYMENT_OVERDUE" },
    yol: "/dashboard/kiraci/1",
    tur: "PAYMENT_OVERDUE",
    data: { yol: "/dashboard/kiraci/1", tur: "PAYMENT_OVERDUE" },
  });
  const sade = apnsGovdesi({ baslik: "B", govde: "G" });
  assert.deepEqual(sade, { aps: { alert: { title: "B", body: "G" }, sound: "default", "thread-id": "genel" } });
});

test("fcmMesaji: alt başlık yok, data metin", () => {
  assert.deepEqual(fcmMesaji("j", { baslik: "B", altBaslik: "A", govde: "G", tur: "T", yol: "/y" }), {
    message: {
      token: "j",
      notification: { title: "B", body: "G" },
      data: { yol: "/y", tur: "T" },
      android: { priority: "high" },
    },
  });
  assert.deepEqual(fcmMesaji("j", { baslik: "B", govde: "G" }).message.data, {});
});

test("ölü jeton kuralları", () => {
  assert.equal(apnsOluMu(410, ""), true);
  assert.equal(apnsOluMu(400, "BadDeviceToken"), true);
  assert.equal(apnsOluMu(400, "Unregistered"), true);
  assert.equal(apnsOluMu(400, "BadTopic"), false, "yapılandırma hatası jeton sildirmez");
  assert.equal(apnsOluMu(500, ""), false);
  assert.equal(fcmOluMu("UNREGISTERED"), true);
  assert.equal(fcmOluMu("INVALID_ARGUMENT", "The registration token is not valid"), true);
  assert.equal(fcmOluMu("INVALID_ARGUMENT", "Invalid JSON payload"), false, "bozuk gövde tüm jetonları sildirmez");
  assert.equal(fcmOluMu("QUOTA_EXCEEDED"), false);
});

test("jetonGecerliMi: şifre değişince ve süre dolunca geçersiz", () => {
  const simdi = new Date("2026-11-05T10:00:00Z");
  const j = (oturumSurum: number, hesapSurum: number, sonKullanma: string) => ({
    mobilOturum: { sessionVersion: oturumSurum, sonKullanma: new Date(sonKullanma) },
    user: { sessionVersion: hesapSurum },
  });
  assert.equal(jetonGecerliMi(j(1, 1, "2026-12-01"), simdi), true);
  assert.equal(jetonGecerliMi(j(1, 2, "2026-12-01"), simdi), false);
  assert.equal(jetonGecerliMi(j(1, 1, "2026-11-01"), simdi), false);
});

// --- APNs döngüsü: sahte http2 oturumu ---

const AYAR: ApnsAyari = { ...apnsAyari(TAM)! };

type Yanit = { durum: number; sebep?: string } | "asili" | "kopuk";

function sahteOturum(yanitla: (jeton: string) => Yanit, kayit: { acik: number; enCok: number; yollar: string[] }) {
  const oturum = new EventEmitter() as EventEmitter & { destroyed: boolean; closed: boolean; close(): void; request(b: Record<string, string | number>): EventEmitter };
  oturum.destroyed = false;
  oturum.closed = false;
  oturum.close = () => {
    oturum.closed = true;
  };
  oturum.request = (b) => {
    const akis = new EventEmitter() as EventEmitter & { end(g: string): void; close(): void };
    const jeton = String(b[":path"]).replace("/3/device/", "");
    kayit.yollar.push(jeton);
    kayit.acik++;
    kayit.enCok = Math.max(kayit.enCok, kayit.acik);
    let kapandi = false;
    const kapat = () => {
      if (!kapandi) kayit.acik--;
      kapandi = true;
    };
    akis.close = kapat;
    akis.end = () => {
      setImmediate(() => {
        const y = yanitla(jeton);
        if (y === "asili") return;
        if (y === "kopuk") {
          kapat();
          akis.emit("error", new Error("kopuk"));
          return;
        }
        akis.emit("response", { ":status": y.durum });
        if (y.sebep) akis.emit("data", JSON.stringify({ reason: y.sebep }));
        kapat();
        akis.emit("end");
      });
    };
    return akis;
  };
  return oturum as unknown as ClientHttp2Session;
}

const ILETI = { baslik: "B", govde: "G" };
const kayitYeni = () => ({ acik: 0, enCok: 0, yollar: [] as string[] });

test("iosTopluGonder: başarı, ölü jeton ve eşzamanlılık sınırı", async () => {
  const kayit = kayitYeni();
  let baglantiSayisi = 0;
  const baglanti = baglantiKur(() => {
    baglantiSayisi++;
    return sahteOturum((j) => (j === "olu" ? { durum: 410 } : { durum: 200 }), kayit);
  }, 5);
  const jetonlar = ["olu", ...Array.from({ length: 30 }, (_, i) => `j${i}`)];
  const sonuc = await iosTopluGonder(AYAR, jetonlar, ILETI, { baglanti, eszamanli: 8 });
  assert.equal(sonuc.length, 31);
  assert.equal(sonuc.filter((r) => r.tamam).length, 30);
  assert.deepEqual(sonuc.find((r) => r.jeton === "olu"), { jeton: "olu", tamam: false, olu: true });
  assert.ok(kayit.enCok <= 8, `en çok ${kayit.enCok} açık`);
  assert.equal(baglantiSayisi, 1, "tek bağlantı");
});

test("iosTopluGonder: bağlantı gönderimler arasında paylaşılır, boşta kapanır", async () => {
  const kayit = kayitYeni();
  let baglantiSayisi = 0;
  const baglanti = baglantiKur(() => {
    baglantiSayisi++;
    return sahteOturum(() => ({ durum: 200 }), kayit);
  }, 5);
  await iosTopluGonder(AYAR, ["a"], ILETI, { baglanti });
  await iosTopluGonder(AYAR, ["b"], ILETI, { baglanti });
  assert.equal(baglantiSayisi, 1, "ardışık gönderimler aynı bağlantı");
  await new Promise((r) => setTimeout(r, 20));
  await iosTopluGonder(AYAR, ["c"], ILETI, { baglanti });
  assert.equal(baglantiSayisi, 2, "boşta kapandıktan sonra yeni bağlantı");
});

test("iosTopluGonder: GOAWAY sonrası yeniden bağlanır", async () => {
  const kayit = kayitYeni();
  const oturumlar: ClientHttp2Session[] = [];
  const baglanti = baglantiKur(() => {
    const o = sahteOturum(() => ({ durum: 200 }), kayit);
    oturumlar.push(o);
    return o;
  }, 5);
  await iosTopluGonder(AYAR, ["a"], ILETI, { baglanti });
  oturumlar[0].emit("goaway");
  await iosTopluGonder(AYAR, ["b"], ILETI, { baglanti });
  assert.equal(oturumlar.length, 2);
});

test("iosTopluGonder: asılı istek yalnız kendini düşürür", async () => {
  const kayit = kayitYeni();
  const baglanti = baglantiKur(() => sahteOturum((j) => (j === "asili" ? "asili" : { durum: 200 }), kayit), 5);
  const sonuc = await iosTopluGonder(AYAR, ["asili", "a", "b"], ILETI, { baglanti, sureMs: 20 });
  assert.deepEqual(sonuc.map((r) => r.tamam), [false, true, true]);
  assert.equal(sonuc[0].olu, undefined, "zaman aşımı jetonu ölü saymaz");
});

test("iosTopluGonder: art arda kopukta kalanlar denenmez", async () => {
  const kayit = kayitYeni();
  const eski = console.error;
  console.error = () => {};
  try {
    const baglanti = baglantiKur(() => sahteOturum(() => "kopuk", kayit), 5);
    const jetonlar = Array.from({ length: 200 }, (_, i) => `j${i}`);
    const sonuc = await iosTopluGonder(AYAR, jetonlar, ILETI, { baglanti, eszamanli: 2 });
    assert.equal(sonuc.length, 200);
    assert.ok(kayit.yollar.length < 40, `${kayit.yollar.length} istek gönderildi`);
    assert.ok(sonuc.every((r) => !r.tamam && !("olu" in r && r.olu)));
  } finally {
    console.error = eski;
  }
});
