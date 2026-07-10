import { NextRequest } from "next/server";

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

export function getClientIp(req: NextRequest): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}

// Bellek büyümesini önlemek için eski kayıtları periyodik temizle
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (now > bucket.resetAt) buckets.delete(key);
  }
}, 10 * 60 * 1000).unref();
