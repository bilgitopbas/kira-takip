"use client";

import { useEffect } from "react";
import { isNativeApp } from "@/lib/native";

// iOS, ozel URL semasiyla (mizanmulk://) baska bir uygulamadan (Safari/Chrome)
// donulup uygulama one gelince, JS/DOM zaten guncellenmis olsa bile ekranda
// eski bir "dondurulmus" gorunumu (app switcher snapshot) birakabiliyor -
// gercek dokunusa kadar duzelmiyor. Uygulama her aktif hale geldiginde
// WKWebView'i ucuz bir DOM degisikligiyle yeniden boyamaya zorluyoruz.
function forceRepaint() {
  const el = document.documentElement;
  const original = el.style.opacity;
  el.style.opacity = "0.9999";
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      el.style.opacity = original;
    });
  });
}

export default function ForceRepaintOnResume() {
  useEffect(() => {
    if (!isNativeApp()) return;

    let removeListener: (() => void) | undefined;

    (async () => {
      try {
        const { App } = await import("@capacitor/app");
        const handle = await App.addListener("appStateChange", (state: { isActive: boolean }) => {
          if (state.isActive) {
            forceRepaint();
            // Navigasyon/oturum degisimi biraz gecikebiliyor, bir kez daha dene
            setTimeout(forceRepaint, 400);
            setTimeout(forceRepaint, 1200);
          }
        });
        removeListener = () => handle.remove();
      } catch (err) {
        console.error("ForceRepaintOnResume başlatılamadı:", err);
      }
    })();

    return () => removeListener?.();
  }, []);

  return null;
}
