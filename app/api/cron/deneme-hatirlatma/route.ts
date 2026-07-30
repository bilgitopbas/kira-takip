import { NextRequest, NextResponse } from "next/server";
import { denemeHatirlatmalariniGonder } from "@/lib/denemeHatirlatma";

// Sunucudaki zamanlanmış görev günde bir kez çağırır.
// Herkese açık olmasın diye CRON_SECRET ile korunur.
export async function GET(req: NextRequest) {
  const gizli = process.env.CRON_SECRET;

  if (!gizli) {
    console.error("CRON_SECRET tanimli degil; deneme hatirlatmasi calistirilmadi.");
    return NextResponse.json({ error: "Yapılandırma eksik." }, { status: 500 });
  }

  const gelen =
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
    req.nextUrl.searchParams.get("key");

  if (gelen !== gizli) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  }

  try {
    const sonuc = await denemeHatirlatmalariniGonder();
    console.log("Deneme hatirlatmasi:", sonuc);
    return NextResponse.json({ ok: true, ...sonuc });
  } catch (hata) {
    console.error("Deneme hatirlatmasi calistirilamadi:", hata);
    return NextResponse.json({ error: "İşlem başarısız." }, { status: 500 });
  }
}
