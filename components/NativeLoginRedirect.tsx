"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isNativeApp } from "@/lib/native";
import { getLaunchUrlRaw, parseAuthCallbackUrl, handleAuthCallbackUrl } from "@/lib/authCallback";
import { logEvent } from "@/lib/debugLog";

export default function NativeLoginRedirect() {
  const router = useRouter();

  useEffect(() => {
    if (!isNativeApp()) return;

    (async () => {
      logEvent("NativeLoginRedirect: baslatildi");

      // Uygulama Google OAuth geri donusuyle acildiysa (mizanmulk://auth-callback),
      // bu URL'i AppUrlOpenBridge de ayrica bir olay olarak alabiliyor - ayni
      // jetonu iki kez tuketmeyi handleAuthCallbackUrl engelliyor (bkz. orada).
      const rawUrl = await getLaunchUrlRaw();
      const parsed = rawUrl ? parseAuthCallbackUrl(rawUrl) : null;

      if (parsed) {
        const result = await handleAuthCallbackUrl(rawUrl!, "NativeLoginRedirect");
        if (result) {
          router.replace(result.destination);
        }
        // result null ise jeton baska bir yerde zaten islendi, navigasyona dokunma
        return;
      }

      fetch("/api/dashboard/profile")
        .then(async (r) => {
          if (!r.ok) {
            logEvent("NativeLoginRedirect: profile 401, /login'e gidiliyor");
            router.replace("/login");
            return;
          }
          const data = await r.json();
          logEvent(`NativeLoginRedirect: profile ok, role=${data.role}`);
          router.replace(data.role === "ADMIN" ? "/admin" : "/dashboard");
        })
        .catch(() => {
          router.replace("/login");
        });
    })();
  }, [router]);

  return null;
}
