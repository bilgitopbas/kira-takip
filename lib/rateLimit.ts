import type { NextRequest } from "next/server";

const buckets = new Map<string, { count: number; resetAt: number }>();

// Basit bellek-içi hız sınırlayıcı — tek pm2 process (fork mode) için yeterli,
// birden fazla instance'a ölçeklenirse Redis tabanlı bir çözüme geçilmeli.
export function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (bucket.count >= limit) {
    return false;
  }

  bucket.count += 1;
  return true;
}

// x-forwarded-for'un soldaki değerlerini istemci uydurabilir; güvenilen her proxy sağa
// bir değer ekler. Bu yüzden sağdan N. değer alınır. GUVENILEN_PROXY: önümüzdeki proxy
// sayısı (varsayılan 1 = nginx; Cloudflare eklenirse 2; 0 = başlığa güvenme).
export function istemciIpCoz(forwardedFor: string | null, realIp: string | null, guvenilen: string | undefined): string {
  const n = guvenilen !== undefined && /^\d+$/.test(guvenilen) ? Number(guvenilen) : 1;
  const zincir = n > 0 && forwardedFor ? forwardedFor.split(",").map((p) => p.trim()).filter(Boolean) : [];
  return zincir[Math.max(0, zincir.length - n)] || realIp || "unknown";
}

export function getClientIp(req: NextRequest): string {
  return istemciIpCoz(req.headers.get("x-forwarded-for"), req.headers.get("x-real-ip"), process.env.GUVENILEN_PROXY);
}

// Bellek büyümesini önlemek için eski kayıtları periyodik temizle
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (now > bucket.resetAt) buckets.delete(key);
  }
}, 10 * 60 * 1000).unref();
