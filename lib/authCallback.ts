// Sadece uygulama icindeki gorece bir yola (orn. "/dashboard") izin verir;
// "https://evil.com" veya "//evil.com" gibi disariya yonlendirmeleri reddeder.
function isSafeRelativePath(path: string): boolean {
  return path.startsWith("/") && !path.startsWith("//");
}

export function parseAuthCallbackUrl(rawUrl: string): { token: string; destination: string } | null {
  try {
    const url = new URL(rawUrl);
    if (url.hostname !== "auth-callback") return null;
    const token = url.searchParams.get("token");
    if (!token) return null;
    const destination = url.searchParams.get("destination") || "/dashboard";
    return { token, destination: isSafeRelativePath(destination) ? destination : "/dashboard" };
  } catch {
    return null;
  }
}

// Uygulama hangi URL ile baslatildi (soguk baslangic dahil) kontrol eder.
export async function getLaunchUrlRaw(): Promise<string | null> {
  try {
    const { App } = await import("@capacitor/app");
    const launch = await App.getLaunchUrl();
    return launch?.url ?? null;
  } catch {
    return null;
  }
}

async function exchangeSessionToken(token: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/auth/exchange-session?token=${encodeURIComponent(token)}`);
    return res.ok;
  } catch {
    return false;
  }
}

// App.getLaunchUrl() "yapiskan" davraniyor: uygulama arka plandan tekrar
// one gelince bile onceki acilis URL'ini aynen dondurmeye devam edebiliyor.
// Bu, zaten basariyla kullanilmis (tek kullanimlik) bir jetonun tekrar
// denenmesine ve exchange-session'in "400 zaten kullanildi" donmesine yol
// aciyor. Bu durumda kullaniciyi login'e atmak yanlis - zaten oturumu acik
// olabilir. Bu yuzden jeton basarisiz olunca gercekten oturum var mi diye
// ayrica kontrol ediliyor.
async function resolveFallbackDestination(): Promise<string> {
  try {
    const res = await fetch("/api/dashboard/profile");
    if (!res.ok) return "/login";
    const data = await res.json();
    return data.role === "ADMIN" ? "/admin" : "/dashboard";
  } catch {
    return "/login";
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

export async function handleAuthCallbackUrl(rawUrl: string): Promise<{ destination: string } | null> {
  const parsed = parseAuthCallbackUrl(rawUrl);
  if (!parsed) return null;

  if (processedTokens.has(parsed.token)) {
    return null;
  }
  processedTokens.add(parsed.token);

  const ok = await exchangeSessionToken(parsed.token);
  if (ok) {
    return { destination: parsed.destination };
  }

  const fallback = await resolveFallbackDestination();
  return { destination: fallback };
}
