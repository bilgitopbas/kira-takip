import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { requireWriteAccess } from "@/lib/access";
import { yeniPanelIzinli } from "@/lib/panelTercihi";
import { gorunumCoz } from "@/lib/binaGorunumu";

// 3D bina panelinden görünüm seçimi (Villa, Plaza…; null = otomatik).
// Yalnız oturum sahibinin binası; yalnız gorunum kolonu değişir.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!yeniPanelIzinli()) return NextResponse.json({ error: "Bulunamadı." }, { status: 404 });
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });

  const access = await requireWriteAccess(session.userId);
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: 403 });

  const { id } = await params;
  const govde = (await req.json().catch(() => null)) as { gorunum?: unknown } | null;
  const gorunum = gorunumCoz(govde?.gorunum ?? null);
  if (gorunum === undefined) return NextResponse.json({ error: "Görünüm listeden seçilmeli." }, { status: 400 });

  const sonuc = await prisma.building.updateMany({ where: { id, ownerId: session.userId }, data: { gorunum } });
  if (sonuc.count === 0) return NextResponse.json({ error: "Bina bulunamadı." }, { status: 404 });

  return NextResponse.json({ success: true });
}
