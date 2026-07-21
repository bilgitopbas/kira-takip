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
export default function OneSignalBridge({ userId }: { userId: string }) {
  useEffect(() => {
    if (!isNativeApp() || !ONESIGNAL_APP_ID || !userId) return;
    let OneSignalRef: Awaited<typeof import("onesignal-cordova-plugin")>["default"] | null = null;

    (async () => {
      try {
        const { default: OneSignal } = await import("onesignal-cordova-plugin");
        OneSignalRef = OneSignal;
        OneSignal.initialize(ONESIGNAL_APP_ID);
        OneSignal.login(userId);
        await OneSignal.Notifications.requestPermission(true);
      } catch (err) {
        console.error("OneSignal başlatılamadı:", err);
      }
    })();

    return () => {
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
