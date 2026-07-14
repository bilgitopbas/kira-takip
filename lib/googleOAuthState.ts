import { randomBytes } from "crypto";

const states = new Map<string, number>();
const STATE_TTL_MS = 10 * 60 * 1000;

// Google OAuth "state" değerini cookie yerine sunucu bellekli bir mağazada
// tutar. Mobil uygulamada OAuth akışı Capacitor WebView'dan başlayıp Google
// hesap seçiminden sonra Safari'de tamamlanıyor; bu iki bağlam farklı cookie
// depoları kullandığı için cookie tabanlı state doğrulaması native uygulamada
// hep başarısız oluyordu. Tek pm2 process (fork mode) için bellek-içi yeterli.
export function createOAuthState(): string {
  const state = randomBytes(16).toString("hex");
  states.set(state, Date.now() + STATE_TTL_MS);
  return state;
}

export function consumeOAuthState(state: string | null): boolean {
  if (!state) return false;
  const expiresAt = states.get(state);
  states.delete(state);
  if (!expiresAt) return false;
  return Date.now() <= expiresAt;
}

setInterval(() => {
  const now = Date.now();
  for (const [state, expiresAt] of states) {
    if (now > expiresAt) states.delete(state);
  }
}, 10 * 60 * 1000).unref();
