import { NextRequest, NextResponse } from "next/server";

/**
 * Zamanlanmış görev uçlarının ortak doğrulaması.
 * Anahtar `Authorization: Bearer ...` başlığında veya `?key=` ile gelebilir.
 *
 * Uygun değilse döndürülecek yanıtı verir; uygunsa null döner.
 */
export function cronYetkiHatasi(req: NextRequest): NextResponse | null {
  const gizli = process.env.CRON_SECRET;

  if (!gizli) {
    console.error("CRON_SECRET tanimli degil; zamanlanmis gorev calistirilmadi.");
    return NextResponse.json({ error: "Yapılandırma eksik." }, { status: 500 });
  }

  const gelen =
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
    req.nextUrl.searchParams.get("key");

  if (gelen !== gizli) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  }

  return null;
}
