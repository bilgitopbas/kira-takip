"use client";

import { useEffect } from "react";
import { isNativeApp } from "@/lib/native";
import { handleAuthCallbackUrl } from "@/lib/authCallback";
import { logEvent } from "@/lib/debugLog";

// Native Google girişi Safari'de tamamlandıktan sonra özel URL şemasıyla
// (mizanmulk://auth-callback?token=...) uygulamaya geri döner. Bu bileşen
// bu geri dönüşü canlı olarak yakalar. Ayrıca soğuk başlangıçta Capacitor
// aynı açılış URL'ini hem NativeLoginRedirect'in App.getLaunchUrl()
// çağrısına hem de buradaki appUrlOpen olayına verebiliyor -
// handleAuthCallbackUrl aynı jetonun iki kez tüketilmesini engelliyor.
export default function AppUrlOpenBridge() {
  useEffect(() => {
    if (!isNativeApp()) return;

    let removeListener: (() => void) | undefined;

    async function handleCallback(rawUrl: string) {
      logEvent(`AppUrlOpenBridge: appUrlOpen event url=${rawUrl}`);
      const result = await handleAuthCallbackUrl(rawUrl, "AppUrlOpenBridge");
      if (result) {
        // router.replace (yumusak gecis) bazen WKWebView arka plandan one
        // gelince ekrani gorsel olarak tazelemiyordu. Tam sayfa yenileme
        // bu belirsizligi ortadan kaldiriyor.
        logEvent(`AppUrlOpenBridge: sert yonlendirme -> ${result.destination}`);
        window.location.href = result.destination;
      }
    }

    (async () => {
      try {
        const { App } = await import("@capacitor/app");
        const handle = await App.addListener("appUrlOpen", (event: { url: string }) => {
          handleCallback(event.url);
        });
        removeListener = () => handle.remove();
      } catch (err) {
        console.error("AppUrlOpenBridge başlatılamadı:", err);
      }
    })();

    return () => removeListener?.();
  }, []);

  return null;
}
