import crypto from "node:crypto";

// Push'un SAF kısmı: ayar okuma, sağlayıcı jetonları, gövde biçimi, jeton süzgeci.
// Veritabanı ve ağ yok; gönderim lib/push.ts'te. Tablo testi: tests/pushBicim.test.ts
//
// Anahtarlar .env'de BASE64 durur (.p8 ve servis hesabı JSON'u çok satırlı):
//   PUSH_ACIK=1                 açıkça açılmadıkça hiçbir şey gönderilmez
//   APNS_KEY_B64, APNS_KEY_ID, APNS_TEAM_ID, APNS_BUNDLE_ID, APNS_ORTAM=deneme (isteğe bağlı)
//   FCM_SERVICE_ACCOUNT_B64     Firebase servis hesabı JSON'u

type Ortam = Record<string, string | undefined>;

export type ApnsAyari = { anahtar: string; anahtarId: string; takim: string; konu: string; konak: string };
export type FcmAyari = { anahtar: string; eposta: string; proje: string };

/** yol = Notification.link (web yolu, derin bağlantı); tur = NotificationType */
export type PushIleti = { baslik: string; altBaslik?: string | null; govde: string; tur?: string; yol?: string | null };

const acik = (env: Ortam) => env.PUSH_ACIK === "1" || env.PUSH_ACIK === "true";

function b64Coz(ham: string | undefined): string | null {
  return ham ? Buffer.from(ham, "base64").toString("utf8") : null;
}

export function apnsAyari(env: Ortam = process.env): ApnsAyari | null {
  if (!acik(env)) return null;
  const anahtar = b64Coz(env.APNS_KEY_B64);
  const anahtarId = env.APNS_KEY_ID;
  const takim = env.APNS_TEAM_ID;
  const konu = env.APNS_BUNDLE_ID;
  if (!anahtar || !anahtarId || !takim || !konu) return null;
  // Üretim ve deneme ayrı sunucu: yanlışı "BadDeviceToken" verir ve jeton ölü sanılıp
  // silinir. Varsayılan üretim, deneme yalnız açık bayrakla.
  const konak = env.APNS_ORTAM === "deneme" ? "api.sandbox.push.apple.com" : "api.push.apple.com";
  return { anahtar, anahtarId, takim, konu, konak };
}

export function fcmAyari(env: Ortam = process.env): FcmAyari | null {
  if (!acik(env)) return null;
  const ham = b64Coz(env.FCM_SERVICE_ACCOUNT_B64);
  if (!ham) return null;
  try {
    const hesap = JSON.parse(ham);
    if (!hesap.private_key || !hesap.client_email || !hesap.project_id) return null;
    return { anahtar: hesap.private_key, eposta: hesap.client_email, proje: hesap.project_id };
  } catch {
    return null;
  }
}

const taban64 = (veri: string) => Buffer.from(veri).toString("base64url");

// APNs sağlayıcı jetonu (ES256). İmza DER değil düz r||s olmalı: dsaEncoding.
export function apnsJwt(ayar: ApnsAyari, simdiSn = Math.floor(Date.now() / 1000)) {
  const imzalanan = `${taban64(JSON.stringify({ alg: "ES256", kid: ayar.anahtarId }))}.${taban64(JSON.stringify({ iss: ayar.takim, iat: simdiSn }))}`;
  const imza = crypto
    .createSign("SHA256")
    .update(imzalanan)
    .sign({ key: ayar.anahtar, dsaEncoding: "ieee-p1363" })
    .toString("base64url");
  return `${imzalanan}.${imza}`;
}

// FCM servis hesabı iddiası (RS256) → OAuth2 erişim jetonuyla değiştirilir
export function fcmJwt(ayar: FcmAyari, simdiSn = Math.floor(Date.now() / 1000)) {
  const imzalanan = `${taban64(JSON.stringify({ alg: "RS256", typ: "JWT" }))}.${taban64(
    JSON.stringify({
      iss: ayar.eposta,
      scope: "https://www.googleapis.com/auth/firebase.messaging",
      aud: "https://oauth2.googleapis.com/token",
      iat: simdiSn,
      exp: simdiSn + 3600,
    })
  )}`;
  const imza = crypto.createSign("RSA-SHA256").update(imzalanan).sign(ayar.anahtar).toString("base64url");
  return `${imzalanan}.${imza}`;
}

// iOS'ta kök ve data ikisi de gider: Expo içeriği data altında da okuyabilir
export function apnsGovdesi(ileti: PushIleti) {
  const ek = { ...(ileti.yol ? { yol: ileti.yol } : {}), ...(ileti.tur ? { tur: ileti.tur } : {}) };
  return {
    aps: {
      alert: {
        title: ileti.baslik,
        ...(ileti.altBaslik ? { subtitle: ileti.altBaslik } : {}),
        body: ileti.govde,
      },
      sound: "default",
      "thread-id": ileti.tur || "genel",
    },
    ...ek,
    ...(Object.keys(ek).length ? { data: ek } : {}),
  };
}

// Android bildiriminde alt başlık yok
export function fcmMesaji(jeton: string, ileti: PushIleti) {
  return {
    message: {
      token: jeton,
      notification: { title: ileti.baslik, body: ileti.govde },
      data: { ...(ileti.yol ? { yol: String(ileti.yol) } : {}), ...(ileti.tur ? { tur: String(ileti.tur) } : {}) },
      android: { priority: "high" },
    },
  };
}

// Yerel jeton biçimi: APNs hex, FCM URL güvenli metin. Jeton APNs isteğinin yoluna girer.
export function cihazJetonuGecerli(platform: "ios" | "android", jeton: unknown): jeton is string {
  if (typeof jeton !== "string") return false;
  return platform === "ios" ? /^[0-9a-fA-F]{32,200}$/.test(jeton) : /^[A-Za-z0-9_:.-]{20,1024}$/.test(jeton);
}

// Silinmesi gereken jetonlar: uygulama kaldırılmış / jeton geçersiz
export const apnsOluMu = (durum: number, sebep: string) =>
  durum === 410 || sebep === "BadDeviceToken" || sebep === "Unregistered";
// INVALID_ARGUMENT bozuk gövdede de döner: tek hatalı duyuru tüm Android jetonlarını sildirmesin.
export const fcmOluMu = (hataAdi: string, mesaj = "") =>
  hataAdi === "UNREGISTERED" || (hataAdi === "INVALID_ARGUMENT" && /token/i.test(mesaj));

// Şifre değişince oturum yenileme denemesini beklemeden push kesilir: çalınan telefon
// bildirim almaz. Süresi dolmuş oturum da aynı.
export const jetonGecerliMi = (
  j: { mobilOturum: { sessionVersion: number; sonKullanma: Date }; user: { sessionVersion: number } },
  simdi: Date
) => j.mobilOturum.sessionVersion === j.user.sessionVersion && j.mobilOturum.sonKullanma > simdi;
