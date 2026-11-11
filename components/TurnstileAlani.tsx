"use client";

import { useEffect, useRef, useState } from "react";

// Cloudflare Turnstile (Managed) widget'ı. Betik yalnız alan ekrana yaklaşınca yüklenir:
// ana sayfadaki "Sizi Arayalım" formu sayfa açılışını yavaşlatmaz. Sunucu doğrulaması
// lib/turnstile.ts'te. Jeton tek kullanımlık: form her hatada `sifirla` değerini artırır.
// Site anahtarı derleme anında gömülür (NEXT_PUBLIC_*): .env değişince yeniden derlenmeli.

export const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

const BETIK = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

type Secenekler = {
  sitekey: string;
  action?: string;
  theme?: "auto" | "light" | "dark";
  size?: "normal" | "flexible" | "compact";
  language?: string;
  callback?: (jeton: string) => void;
  "expired-callback"?: () => void;
  "error-callback"?: () => void;
};

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, s: Secenekler) => string;
      reset: (id: string) => void;
      remove: (id: string) => void;
    };
  }
}

let yukleme: Promise<void> | null = null;
function betikYukle(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  yukleme ??= new Promise<void>((tamam, hata) => {
    const s = document.createElement("script");
    s.src = BETIK;
    s.async = true;
    s.onload = () => tamam();
    s.onerror = () => {
      yukleme = null;
      s.remove();
      hata(new Error("turnstile"));
    };
    document.head.appendChild(s);
  });
  return yukleme;
}

export default function TurnstileAlani({
  eylem,
  onJeton,
  sifirla,
  className,
}: {
  eylem: string;
  onJeton: (jeton: string | null) => void;
  /** Her artışta widget yeni jeton üretir (gönderim hatasından sonra) */
  sifirla: number;
  className?: string;
}) {
  const kap = useRef<HTMLDivElement>(null);
  const widget = useRef<string | null>(null);
  const geriCagri = useRef(onJeton);
  const [hata, setHata] = useState("");

  useEffect(() => {
    geriCagri.current = onJeton;
  }, [onJeton]);

  useEffect(() => {
    const el = kap.current;
    if (!TURNSTILE_SITE_KEY || !el) return;
    let iptal = false;

    const kur = () => {
      betikYukle()
        .then(() => {
          if (iptal || !window.turnstile || widget.current) return;
          setHata("");
          widget.current = window.turnstile.render(el, {
            sitekey: TURNSTILE_SITE_KEY,
            action: eylem,
            theme: "light",
            // flexible en az 300 px: dar kartta (ör. /register, 360 px ekran) taşmasın diye compact
            size: el.clientWidth >= 300 ? "flexible" : "compact",
            language: "tr",
            callback: (j) => geriCagri.current(j),
            "expired-callback": () => geriCagri.current(null),
            "error-callback": () => geriCagri.current(null),
          });
        })
        .catch(() => {
          if (!iptal) setHata("Güvenlik doğrulaması yüklenemedi. Bağlantınızı kontrol edip sayfayı yenileyin.");
        });
    };

    const gozcu = new IntersectionObserver(
      (girdiler) => {
        if (girdiler.some((g) => g.isIntersecting)) {
          gozcu.disconnect();
          kur();
        }
      },
      { rootMargin: "400px 0px" }
    );
    gozcu.observe(el);

    return () => {
      iptal = true;
      gozcu.disconnect();
      if (widget.current) window.turnstile?.remove(widget.current);
      widget.current = null;
    };
  }, [eylem]);

  useEffect(() => {
    if (sifirla === 0 || !widget.current) return;
    geriCagri.current(null);
    window.turnstile?.reset(widget.current);
  }, [sifirla]);

  if (!TURNSTILE_SITE_KEY) return null;
  return (
    <div className={className}>
      <div ref={kap} style={{ minHeight: 65, maxWidth: "100%" }} />
      {hata && (
        <p role="alert" style={{ color: "#b91c1c", fontSize: 13, marginTop: 6 }}>
          {hata}
        </p>
      )}
    </div>
  );
}
