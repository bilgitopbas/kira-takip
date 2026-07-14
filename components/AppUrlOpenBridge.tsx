"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();

  useEffect(() => {
    if (!isNativeApp()) return;

    let removeListener: (() => void) | undefined;

    async function handleCallback(rawUrl: string) {
      logEvent(`AppUrlOpenBridge: appUrlOpen event url=${rawUrl}`);
      const result = await handleAuthCallbackUrl(rawUrl, "AppUrlOpenBridge");
      if (result) {
        router.replace(result.ok ? result.destination : "/login?error=google_state");
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
  }, [router]);

  return null;
}
