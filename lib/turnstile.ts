import { NextResponse } from "next/server";

// Cloudflare Turnstile sunucu doğrulaması: kayıt ve "Sizi Arayalım" formları.
// FAIL-CLOSED (üretim): anahtar yoksa, Cloudflare'e ulaşılamazsa / zaman aşımında ya da
// doğrulama olumsuzsa istek reddedilir. Geliştirmede anahtar yoksa doğrulama atlanır.
// Jeton tek kullanımlıktır; istemci her hatada widget'ı sıfırlar (components/TurnstileAlani.tsx).
// Testler: tests/turnstile.test.ts

const SITEVERIFY = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const ZAMAN_ASIMI_MS = 5000;
const JETON_SINIRI = 2048;

export type TurnstileSonucu = "TAMAM" | "ANAHTAR_YOK" | "JETON_YOK" | "GECERSIZ" | "ULASILAMADI";

type Ortam = { gizli?: string; uretim: boolean; fetchFn: typeof fetch };

const varsayilanOrtam = (): Ortam => ({
  gizli: process.env.TURNSTILE_SECRET,
  uretim: process.env.NODE_ENV === "production",
  fetchFn: fetch,
});

export async function turnstileDogrula(
  jeton: unknown,
  ip: string | null,
  ortam: Ortam = varsayilanOrtam()
): Promise<TurnstileSonucu> {
  if (!ortam.gizli) {
    if (!ortam.uretim) return "TAMAM";
    // Değer basılmaz; dağıtımda .env eksikse bu satır görünür
    console.error("Turnstile: TURNSTILE_SECRET tanımlı değil; korumalı formlar reddediliyor.");
    return "ANAHTAR_YOK";
  }
  if (typeof jeton !== "string" || !jeton || jeton.length > JETON_SINIRI) return "JETON_YOK";

  const govde = new URLSearchParams({ secret: ortam.gizli, response: jeton });
  if (ip && ip !== "unknown") govde.set("remoteip", ip);
  try {
    const yanit = await ortam.fetchFn(SITEVERIFY, {
      method: "POST",
      body: govde,
      signal: AbortSignal.timeout(ZAMAN_ASIMI_MS),
    });
    if (!yanit.ok) {
      console.error(`Turnstile: siteverify HTTP ${yanit.status}`);
      return "ULASILAMADI";
    }
    const veri = (await yanit.json()) as { success?: unknown; "error-codes"?: unknown };
    if (veri.success === true) return "TAMAM";
    const kodlar = Array.isArray(veri["error-codes"]) ? veri["error-codes"].join(",") : "";
    // Sunucu tarafı yapılandırma hatası (yanlış/eksik gizli anahtar) ayrı görünsün
    if (/secret/.test(kodlar)) console.error(`Turnstile: gizli anahtar reddedildi (${kodlar})`);
    return "GECERSIZ";
  } catch (err) {
    console.error("Turnstile: siteverify'a ulaşılamadı:", err instanceof Error ? err.name : "hata");
    return "ULASILAMADI";
  }
}

/** TAMAM değilse istemciye dönecek yanıt; web uçlarının biçimi: { error } */
export function turnstileHataYaniti(sonuc: TurnstileSonucu): NextResponse | null {
  switch (sonuc) {
    case "TAMAM":
      return null;
    case "ANAHTAR_YOK":
      return NextResponse.json(
        { error: "Form şu an kullanılamıyor. Lütfen daha sonra tekrar deneyin." },
        { status: 503 }
      );
    case "ULASILAMADI":
      return NextResponse.json(
        { error: "Güvenlik doğrulaması şu an yapılamadı. Lütfen birkaç saniye sonra tekrar deneyin." },
        { status: 503 }
      );
    default:
      return NextResponse.json(
        { error: "Güvenlik doğrulaması tamamlanamadı. Lütfen doğrulamayı yenileyip tekrar deneyin." },
        { status: 400 }
      );
  }
}
