import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { musteriPaketiDegistir } from "@/lib/adminIslemleri";
import { paketMi } from "@/lib/paketler";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 403 });
  }

  const { id } = await params;
  const { status } = await req.json();

  if (!paketMi(status)) {
    return NextResponse.json({ error: "Geçersiz durum." }, { status: 400 });
  }

  const updated = await musteriPaketiDegistir(id, status);

  return NextResponse.json({ success: true, user: updated });
}