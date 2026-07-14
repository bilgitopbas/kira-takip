"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isNativeApp } from "@/lib/native";
import { getPendingAuthCallback, exchangeSessionToken } from "@/lib/authCallback";
import { logEvent } from "@/lib/debugLog";

export default function NativeLoginRedirect() {
  const router = useRouter();

  useEffect(() => {
    if (!isNativeApp()) return;

    (async () => {
      logEvent("NativeLoginRedirect: baslatildi");

      // Uygulama Google OAuth geri donusuyle acildiysa (mizanmulk://auth-callback),
      // bu akisi AppUrlOpenBridge yonetir. Burada ayrica "oturum yok, /login'e git"
      // karari vermeyip bekleyelim; aksi halde iki bilesen birbirinin
      // yonlendirmesini eziyordu (Google girisi sonrasi /login'e dusme hatasi).
      const pending = await getPendingAuthCallback();
      if (pending) {
        logEvent("NativeLoginRedirect: bekleyen auth-callback var, kendi yonlendirmesini atliyor");
        const ok = await exchangeSessionToken(pending.token);
        logEvent(`NativeLoginRedirect: exchange sonucu=${ok}, yonlendiriliyor=${ok ? pending.destination : "/login"}`);
        router.replace(ok ? pending.destination : "/login?error=google_state");
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
