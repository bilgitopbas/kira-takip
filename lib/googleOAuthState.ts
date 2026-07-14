import { randomBytes } from "crypto";

const STATE_TTL_MS = 10 * 60 * 1000;
const EXCHANGE_TOKEN_TTL_MS = 2 * 60 * 1000;

type StateEntry = { expiresAt: number; native: boolean };
const states = new Map<string, StateEntry>();

// Google OAuth "state" değerini cookie yerine sunucu bellekli bir mağazada
// tutar. Mobil uygulamada OAuth akışı Capacitor WebView'dan başlayıp Google
// hesap seçiminden sonra Safari'de tamamlanıyor; bu iki bağlam farklı cookie
// depoları kullandığı için cookie tabanlı state doğrulaması native uygulamada
// hep başarısız oluyordu. Tek pm2 process (fork mode) için bellek-içi yeterli.
export function createOAuthState(native: boolean): string {
  const state = randomBytes(16).toString("hex");
  states.set(state, { expiresAt: Date.now() + STATE_TTL_MS, native });
  return state;
}

export function consumeOAuthState(state: string | null): { valid: boolean; native: boolean } {
  if (!state) return { valid: false, native: false };
  const entry = states.get(state);
  states.delete(state);
  if (!entry || Date.now() > entry.expiresAt) return { valid: false, native: false };
  return { valid: true, native: entry.native };
}

type ExchangeEntry = { userId: string; role: "ADMIN" | "CUSTOMER"; expiresAt: number };
const exchangeTokens = new Map<string, ExchangeEntry>();

// Native OAuth tamamlandığında Safari'de oluşan oturum çerezi, uygulamanın
// kendi WebView'ına taşınamıyor (ayrı cookie depoları). Bunun yerine tek
// kullanımlık kısa ömürlü bir "değiş tokuş" jetonu üretilip özel URL şeması
// ile uygulamaya geri gönderilir; uygulama bu jetonu KENDİ WebView'ından
// (fetch ile) sunucuya sunup gerçek oturum çerezini o context'te alır.
export function createSessionExchangeToken(userId: string, role: "ADMIN" | "CUSTOMER"): string {
  const token = randomBytes(24).toString("hex");
  exchangeTokens.set(token, { userId, role, expiresAt: Date.now() + EXCHANGE_TOKEN_TTL_MS });
  return token;
}

export function consumeSessionExchangeToken(token: string | null): ExchangeEntry | null {
  if (!token) return null;
  const entry = exchangeTokens.get(token);
  exchangeTokens.delete(token);
  if (!entry || Date.now() > entry.expiresAt) return null;
  return entry;
}

setInterval(() => {
  const now = Date.now();
  for (const [state, entry] of states) {
    if (now > entry.expiresAt) states.delete(state);
  }
  for (const [token, entry] of exchangeTokens) {
    if (now > entry.expiresAt) exchangeTokens.delete(token);
  }
}, 10 * 60 * 1000).unref();
