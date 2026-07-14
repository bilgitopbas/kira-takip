"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isNativeApp } from "@/lib/native";
import { parseAuthCallbackUrl, exchangeSessionToken } from "@/lib/authCallback";
import { logEvent } from "@/lib/debugLog";

// Native Google girişi Safari'de tamamlandıktan sonra özel URL şemasıyla
// (mizanmulk://auth-callback?token=...) uygulamaya geri döner. Bu bileşen
// "sıcak" senaryoyu (uygulama arka planda canlı kalmışsa) yakalar — "soğuk
// başlangıç" (uygulama tamamen kapanmışsa) senaryosu NativeLoginRedirect'te
// (uygulamanın her zaman "/" ile açıldığı senaryo) App.getLaunchUrl() ile
// ayrıca ele alınıyor; ikisi aynı jetonu iki kez tüketmeye çalışıp
// birbirini ezmesin diye burada tekrar getLaunchUrl kontrolü yapılmıyor.
export default function AppUrlOpenBridge() {
  const router = useRouter();

  useEffect(() => {
    if (!isNativeApp()) return;

    let removeListener: (() => void) | undefined;

    async function handleCallback(rawUrl: string) {
      logEvent(`AppUrlOpenBridge: appUrlOpen event url=${rawUrl}`);
      const parsed = parseAuthCallbackUrl(rawUrl);
      if (!parsed) return;
      const ok = await exchangeSessionToken(parsed.token);
      logEvent(`AppUrlOpenBridge: exchange sonucu=${ok}, yonlendiriliyor=${ok ? parsed.destination : "/login"}`);
      router.replace(ok ? parsed.destination : "/login?error=google_state");
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
