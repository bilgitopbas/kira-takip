import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { odemeBildiriminiSonuclandir } from "@/lib/adminIslemleri";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 403 });
  }

  const { id } = await params;
  const { action, note } = await req.json();

  if (action !== "confirm" && action !== "reject") {
    return NextResponse.json({ error: "Geçersiz işlem." }, { status: 400 });
  }

  const sonuc = await odemeBildiriminiSonuclandir(id, action, note);
  if (sonuc.sonuc === "YOK") {
    return NextResponse.json({ error: "Bildirim bulunamadı." }, { status: 404 });
  }
  if (sonuc.sonuc === "SONUCLANMIS") {
    return NextResponse.json({ error: "Bu bildirim zaten sonuçlandırılmış." }, { status: 409 });
  }
  if (sonuc.sonuc === "REDDEDILDI") {
    return NextResponse.json({ success: true });
  }
  return NextResponse.json({ success: true, periodEnd: sonuc.periodEnd });
}
