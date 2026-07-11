const ONESIGNAL_APP_ID = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
const ONESIGNAL_REST_API_KEY = process.env.ONESIGNAL_REST_API_KEY;

// Mobil uygulama kullanıcılarına push bildirimi gönderir. Anahtarlar tanımlı
// değilse (örn. yerel geliştirme ortamı) sessizce hiçbir şey yapmaz.
export async function sendPushNotification(
  externalUserId: string,
  title: string,
  message: string,
  url?: string
) {
  if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) return;

  try {
    await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${ONESIGNAL_REST_API_KEY}`,
      },
      body: JSON.stringify({
        app_id: ONESIGNAL_APP_ID,
        include_aliases: { external_id: [externalUserId] },
        target_channel: "push",
        headings: { tr: title },
        contents: { tr: message },
        ...(url ? { url } : {}),
      }),
    });
  } catch (err) {
    console.error("OneSignal push gönderilemedi:", err);
  }
}
