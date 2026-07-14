import { logEvent } from "@/lib/debugLog";

export function parseAuthCallbackUrl(rawUrl: string): { token: string; destination: string } | null {
  try {
    const url = new URL(rawUrl);
    if (url.hostname !== "auth-callback") return null;
    const token = url.searchParams.get("token");
    if (!token) return null;
    return { token, destination: url.searchParams.get("destination") || "/dashboard" };
  } catch {
    return null;
  }
}

// Uygulama hangi URL ile baslatildi (soguk baslangic dahil) kontrol eder.
export async function getLaunchUrlRaw(): Promise<string | null> {
  try {
    const { App } = await import("@capacitor/app");
    const launch = await App.getLaunchUrl();
    logEvent(`getLaunchUrlRaw: launchUrl=${launch?.url ?? "yok"}`);
    return launch?.url ?? null;
  } catch (err) {
    logEvent(`getLaunchUrlRaw hata: ${err}`);
    return null;
  }
}

async function exchangeSessionToken(token: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/auth/exchange-session?token=${encodeURIComponent(token)}`);
    logEvent(`exchange-session status=${res.status}`);
    return res.ok;
  } catch (err) {
    logEvent(`exchange-session hata: ${err}`);
    return false;
  }
}

// Capacitor, soguk baslangicta acilis URL'ini HEM App.getLaunchUrl() ile
// HEM DE bir "appUrlOpen" olayi olarak ayrica gonderebiliyor. Ikisi de ayni
// jetonu tuketmeye calisirsa, jeton tek kullanimlik oldugu icin ikinci
// deneme basarisiz olup kullaniciyi zaten basarili olan girisin uzerine
// tekrar /login'e atiyordu. Bu yuzden ayni jeton bu sayfa omru boyunca
// sadece BIR KEZ islenir; ikinci cagri sessizce yok sayilir (null doner,
// cagiran taraf navigasyona dokunmaz).
const processedTokens = new Set<string>();

export async function handleAuthCallbackUrl(
  rawUrl: string,
  source: string
): Promise<{ ok: boolean; destination: string } | null> {
  const parsed = parseAuthCallbackUrl(rawUrl);
  if (!parsed) return null;

  if (processedTokens.has(parsed.token)) {
    logEvent(`${source}: token zaten islendi, tekrar denenmiyor`);
    return null;
  }
  processedTokens.add(parsed.token);

  const ok = await exchangeSessionToken(parsed.token);
  logEvent(`${source}: exchange sonucu=${ok}, yonlendiriliyor=${ok ? parsed.destination : "/login"}`);
  return { ok, destination: parsed.destination };
}
