"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isNativeApp } from "@/lib/native";
import { getLaunchUrlRaw, parseAuthCallbackUrl, handleAuthCallbackUrl } from "@/lib/authCallback";

export default function NativeLoginRedirect() {
  const router = useRouter();

  useEffect(() => {
    if (!isNativeApp()) return;

    (async () => {
      // Uygulama Google OAuth geri donusuyle acildiysa (mizanmulk://auth-callback),
      // bu URL'i AppUrlOpenBridge de ayrica bir olay olarak alabiliyor - ayni
      // jetonu iki kez tuketmeyi handleAuthCallbackUrl engelliyor (bkz. orada).
      const rawUrl = await getLaunchUrlRaw();
      const parsed = rawUrl ? parseAuthCallbackUrl(rawUrl) : null;

      if (parsed) {
        const result = await handleAuthCallbackUrl(rawUrl!);
        if (result) {
          // router.replace (yumusak gecis) bazen WKWebView arka plandan one
          // gelince ekrani gorsel olarak tazelemiyordu. Tam sayfa yenileme
          // bu belirsizligi ortadan kaldiriyor.
          window.location.href = result.destination;
        }
        // result null ise jeton baska bir yerde zaten islendi, navigasyona dokunma
        return;
      }

      fetch("/api/dashboard/profile")
        .then(async (r) => {
          if (!r.ok) {
            router.replace("/login");
            return;
          }
          const data = await r.json();
          router.replace(data.role === "ADMIN" ? "/admin" : "/dashboard");
        })
        .catch(() => {
          router.replace("/login");
        });
    })();
  }, [router]);

  return null;
}
