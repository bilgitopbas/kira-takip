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

// Uygulama native OAuth geri dönüşüyle mi açıldı (soğuk başlangıç dahil)
// kontrol eder. Hem AppUrlOpenBridge hem NativeLoginRedirect bunu kullanır;
// ikisinin de kendi başına "oturum yok, /login'e git" kararı vermesini,
// birbirini ezmesini önlemek için.
export async function getPendingAuthCallback(): Promise<{ token: string; destination: string } | null> {
  try {
    const { App } = await import("@capacitor/app");
    const launch = await App.getLaunchUrl();
    logEvent(`getPendingAuthCallback: launchUrl=${launch?.url ?? "yok"}`);
    if (!launch?.url) return null;
    return parseAuthCallbackUrl(launch.url);
  } catch (err) {
    logEvent(`getPendingAuthCallback hata: ${err}`);
    return null;
  }
}

export async function exchangeSessionToken(token: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/auth/exchange-session?token=${encodeURIComponent(token)}`);
    logEvent(`exchange-session status=${res.status}`);
    return res.ok;
  } catch (err) {
    logEvent(`exchange-session hata: ${err}`);
    return false;
  }
}
