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

    (async () => {
      try {
        const { App } = await import("@capacitor/app");
        const handle = await App.addListener("appUrlOpen", async (event: { url: string }) => {
          let url: URL;
          try {
            url = new URL(event.url);
          } catch {
            return;
          }
          if (url.hostname !== "auth-callback") return;

          const token = url.searchParams.get("token");
          const destination = url.searchParams.get("destination") || "/dashboard";
          if (!token) return;

          const res = await fetch(`/api/auth/exchange-session?token=${encodeURIComponent(token)}`);
          if (res.ok) {
            router.replace(destination);
          } else {
            router.replace("/login?error=google_state");
          }
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
