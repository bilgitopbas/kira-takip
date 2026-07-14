"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isNativeApp } from "@/lib/native";

// Native Google girişi Safari'de tamamlandıktan sonra özel URL şemasıyla
// (mizanmulk://auth-callback?token=...) uygulamaya geri döner. Bu bileşen o
// açılışı yakalayıp jetonu uygulamanın kendi WebView'ından sunucuya sunarak
// gerçek oturumu burada kurar (bkz. lib/googleOAuthState.ts).
export default function AppUrlOpenBridge() {
  const router = useRouter();

  useEffect(() => {
    if (!isNativeApp()) return;

    let removeListener: (() => void) | undefined;

    function parseAuthCallback(rawUrl: string) {
      try {
        const url = new URL(rawUrl);
        if (url.hostname !== "auth-callback") return null;
        const token = url.searchParams.get("token");
        if (!token) return null;
        return { token, destination: url.searchParams.get("destination") || "/dashboard" };
      } catch {
        return null;
      }
    }

    async function handleCallback(rawUrl: string) {
      const parsed = parseAuthCallback(rawUrl);
      if (!parsed) return;
      const res = await fetch(`/api/auth/exchange-session?token=${encodeURIComponent(parsed.token)}`);
      router.replace(res.ok ? parsed.destination : "/login?error=google_state");
    }

    (async () => {
      try {
        const { App } = await import("@capacitor/app");

        // "Sıcak" senaryo: uygulama arka planda canlı kalmışsa bu olay çalışır.
        const handle = await App.addListener("appUrlOpen", (event: { url: string }) => {
          handleCallback(event.url);
        });
        removeListener = () => handle.remove();

        // "Soğuk başlangıç" senaryosu: OAuth akışı uzun sürdüğü için iOS
        // uygulamayı arka planda kapatmış olabilir. Bu durumda yukarıdaki
        // dinleyici henüz kayıtlı değilken açılış URL'i "kaçırılır" — bu
        // yüzden başlangıçta ayrıca hangi URL ile açıldığımızı soruyoruz.
        const launch = await App.getLaunchUrl();
        if (launch?.url) {
          handleCallback(launch.url);
        }
      } catch (err) {
        console.error("AppUrlOpenBridge başlatılamadı:", err);
      }
    })();

    return () => removeListener?.();
  }, [router]);

  return null;
}
