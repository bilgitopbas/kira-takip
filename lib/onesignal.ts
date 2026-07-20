const ONESIGNAL_APP_ID = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
const ONESIGNAL_REST_API_KEY = process.env.ONESIGNAL_REST_API_KEY;

// Yeni OneSignal anahtarları (os_v2_...) "Key", eskiler "Basic" başlığı ister.
function authHeader() {
  const key = (ONESIGNAL_REST_API_KEY || "").trim().replace(/^['"]|['"]$/g, "");
  return key.startsWith("os_v2_") ? `Key ${key}` : `Basic ${key}`;
}

async function oneSignalRequest(body: Record<string, unknown>) {
  const res = await fetch("https://onesignal.com/api/v1/notifications", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: authHeader(),
    },
    body: JSON.stringify({ app_id: ONESIGNAL_APP_ID, ...body }),
  });
  return res.json();
}

// Tek kullanıcıya push bildirimi (external_id ile eşleşen cihazlara).
// Anahtarlar tanımlı değilse (örn. yerel geliştirme) sessizce hiçbir şey yapmaz.
export async function sendPushNotification(
  externalUserId: string,
  title: string,
  message: string,
  url?: string
) {
  if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) return;

  try {
    const result = await oneSignalRequest({
      include_aliases: { external_id: [externalUserId] },
      target_channel: "push",
      headings: { tr: title, en: title },
      contents: { tr: message, en: message },
      ...(url ? { url } : {}),
    });
    if (result?.errors) {
      console.error("OneSignal push hatası:", JSON.stringify(result.errors));
    }
    return result;
  } catch (err) {
    console.error("OneSignal push gönderilemedi:", err);
  }
}

// Uygulamayı kurmuş HERKESE push (genel duyuru). Segment adı hesaba göre
// değişebildiği için iki isim sırayla denenir; hatalar loglanır.
export async function sendPushToAll(title: string, message: string, subtitle?: string | null) {
  if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) return null;

  const base = {
    headings: { tr: title, en: title },
    contents: { tr: message, en: message },
    ...(subtitle ? { subtitle: { tr: subtitle, en: subtitle } } : {}),
  };

  try {
    let result = await oneSignalRequest({ ...base, included_segments: ["Total Subscriptions"] });
    if (result?.errors) {
      console.error("OneSignal 1. deneme hatası:", JSON.stringify(result.errors));
      result = await oneSignalRequest({ ...base, included_segments: ["Subscribed Users"] });
    }
    if (result?.errors) {
      console.error("OneSignal 2. deneme hatası:", JSON.stringify(result.errors));
    }
    return result;
  } catch (err) {
    console.error("OneSignal genel duyuru gönderilemedi:", err);
    return null;
  }
}
