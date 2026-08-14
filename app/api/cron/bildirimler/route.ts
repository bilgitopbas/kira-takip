import { NextRequest, NextResponse } from "next/server";
import { cronYetkiHatasi } from "@/lib/cronYetki";
import { tumHesaplarIcinBildirimUret } from "@/lib/notifications";

// Tüm hesaplar için bildirim üretimi. Sunucudaki zamanlanmış görev günde bir
// çağırır; kullanıcının panele girmesine bağlı değildir.
export async function GET(req: NextRequest) {
  const yetkiHatasi = cronYetkiHatasi(req);
  if (yetkiHatasi) return yetkiHatasi;

  try {
    const sonuc = await tumHesaplarIcinBildirimUret();
    console.log("Bildirim uretimi:", sonuc);
    return NextResponse.json({ ok: true, ...sonuc });
  } catch (hata) {
    console.error("Bildirim uretimi calistirilamadi:", hata);
    return NextResponse.json({ error: "İşlem başarısız." }, { status: 500 });
  }
}
