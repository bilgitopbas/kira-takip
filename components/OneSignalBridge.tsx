"use client";

import { useEffect } from "react";
import { isNativeApp } from "@/lib/native";

const ONESIGNAL_APP_ID = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;

export default function OneSignalBridge({ userId }: { userId: string }) {
  useEffect(() => {
    if (!isNativeApp() || !ONESIGNAL_APP_ID) return;

    (async () => {
      try {
        const { default: OneSignal } = await import("onesignal-cordova-plugin");
        OneSignal.initialize(ONESIGNAL_APP_ID);
        OneSignal.login(userId);
        await OneSignal.Notifications.requestPermission(true);
      } catch (err) {
        console.error("OneSignal başlatılamadı:", err);
      }
    })();
  }, [userId]);

  return null;
}
