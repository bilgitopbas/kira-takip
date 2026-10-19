import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { requireWriteAccess } from "@/lib/access";
import { yeniPanelIzinli } from "@/lib/panelTercihi";
import { konumDogrula } from "@/lib/binalarimKayit";

// Haritada sürüklenen pinin konumunu kayıtlı binaya yazar ("doğrulandı").
// Yalnız oturum sahibinin binası; yalnız lat/lng/locationVerified değişir.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!yeniPanelIzinli()) return NextResponse.json({ error: "Bulunamadı." }, { status: 404 });
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });

  const access = await requireWriteAccess(session.userId);
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: 403 });

  const { id } = await params;
  const konum = konumDogrula(await req.json().catch(() => null));
  if (!konum) return NextResponse.json({ error: "Konum Türkiye sınırları dışında." }, { status: 400 });

  const sonuc = await prisma.building.updateMany({
    where: { id, ownerId: session.userId },
    data: { lat: konum.lat, lng: konum.lng, locationVerified: true },
  });
  if (sonuc.count === 0) return NextResponse.json({ error: "Bina bulunamadı." }, { status: 404 });

  return NextResponse.json({ success: true });
}
