import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { requireWriteAccess } from "@/lib/access";

// Kiracı hâlâ oturuyor mu (LIVING) yoksa tahliye mi etti (VACATED)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
  }

  const access = await requireWriteAccess(session.userId);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: 403 });
  }

  const { id } = await params;

  const tenant = await prisma.tenant.findUnique({
    where: { id },
    include: { property: true },
  });
  if (!tenant || tenant.property.ownerId !== session.userId) {
    return NextResponse.json({ error: "Kiracı bulunamadı." }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const status = body?.status;
  if (status !== "LIVING" && status !== "VACATED") {
    return NextResponse.json({ error: "Geçersiz durum." }, { status: 400 });
  }

  try {
    await prisma.tenant.update({ where: { id }, data: { occupancyStatus: status } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Durum güncellenemedi." }, { status: 500 });
  }
}
