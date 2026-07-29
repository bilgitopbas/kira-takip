"use client";

import { useEffect } from "react";
import { isNativeApp } from "@/lib/native";

const ONESIGNAL_APP_ID = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;

// Cihaz her zaman "şu an girişli hesabı" takip eder:
// - Girişte login(hesapId) → hesaba özel bildirimler bu cihaza gelir
// - Çıkışta / hesap değişiminde logout → eski hesabın bildirimi sızmaz
//   (bu bileşen yalnızca girişli panel kabuklarında durur; panelden
//   ayrılınca unmount olur ve cihaz-hesap bağı çözülür)
// Not: "Kullanıcı ekle" ile davet edilen ekip üyeleri asıl hesabın (owner)
// oturumuyla çalıştığı için userId zaten hesap sahibinin id'sidir — üyenin
// telefonu da otomatik olarak hesabın bildirimlerini alır.

// Bildirim yükünde taşınan yol yalnızca uygulama içi göreli bir adres olabilir;
// "https://..." veya "//" ile başlayan değerler dışarıya yönlendirme riski
// taşıdığı için yok sayılır.
function guvenliYolMu(path: unknown): path is string {
  return typeof path === "string" && path.startsWith("/") && !path.startsWith("//");
}

export default function OneSignalBridge({ userId }: { userId: string }) {
  useEffect(() => {
    if (!isNativeApp() || !ONESIGNAL_APP_ID || !userId) return;
    let OneSignalRef: Awaited<typeof import("onesignal-cordova-plugin")>["default"] | null = null;

    // Bildirime tıklanınca ilgili detay sayfasına git (örn. ilgili kiracı).
    // Sunucu bu yolu push'un `data.path` alanında gönderiyor (bkz. lib/onesignal.ts).
    // Yumuşak yönlendirme yerine tam sayfa geçişi kullanılıyor: uygulama arka
    // plandan öne gelirken WKWebView bazen eski ekranı donmuş halde bırakıyor.
    const tiklama = (event: { notification?: { additionalData?: unknown } }) => {
      const veri = event?.notification?.additionalData as { path?: unknown } | undefined;
      if (guvenliYolMu(veri?.path)) {
        window.location.href = veri.path;
      }
    };

    (async () => {
      try {
        const { default: OneSignal } = await import("onesignal-cordova-plugin");
        OneSignalRef = OneSignal;
        OneSignal.initialize(ONESIGNAL_APP_ID);
        OneSignal.login(userId);
        OneSignal.Notifications.addEventListener("click", tiklama);
        await OneSignal.Notifications.requestPermission(true);
      } catch (err) {
        console.error("OneSignal başlatılamadı:", err);
      }
    })();

    // İlk izin isteği iOS tarafından yutulabiliyor ("Never Prompted" cihazlar).
    // Uygulama öne geldikçe, karar verilene kadar yeniden iste — karar
    // verilmişse iOS soruyu tekrar göstermez (çağrı zararsızdır).
    const gorunurluk = () => {
      if (document.visibilityState === "visible") {
        try {
          OneSignalRef?.Notifications.requestPermission(false).catch(() => {});
        } catch {}
      }
    };
    document.addEventListener("visibilitychange", gorunurluk);

    return () => {
      document.removeEventListener("visibilitychange", gorunurluk);
      try {
        OneSignalRef?.Notifications.removeEventListener("click", tiklama);
      } catch {
        // plugin hazır değilse sessizce geç
      }
      // Panelden çıkış / hesap değişimi: cihaz-hesap bağını çöz
      try {
        OneSignalRef?.logout();
      } catch {
        // plugin hazır değilse sessizce geç
      }
    };
  }, [userId]);

  return null;
}
