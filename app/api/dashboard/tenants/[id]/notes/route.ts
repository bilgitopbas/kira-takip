import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { requireWriteAccess } from "@/lib/access";
import { getActor } from "@/lib/actor";

async function getOwnedTenant(id: string, userId: string) {
  const tenant = await prisma.tenant.findUnique({
    where: { id },
    include: { property: true },
  });
  if (!tenant || tenant.property.ownerId !== userId) return null;
  return tenant;
}

export async function POST(
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
  const tenant = await getOwnedTenant(id, session.userId);
  if (!tenant) {
    return NextResponse.json({ error: "Kiracı bulunamadı." }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const content = typeof body?.content === "string" ? body.content.trim() : "";
  if (!content) {
    return NextResponse.json({ error: "Not boş olamaz." }, { status: 400 });
  }

  // Notu yazan kişi kayıt anında saklanır; ekip üyesi sonradan silinse bile
  // notta kimin yazdığı görünmeye devam eder.
  const actor = await getActor(session);

  try {
    const note = await prisma.tenantNote.create({
      data: {
        tenantId: id,
        content,
        authorEmail: actor.email,
        authorName: actor.name,
      },
    });
    return NextResponse.json({ success: true, note });
  } catch {
    return NextResponse.json({ error: "Not kaydedilemedi." }, { status: 500 });
  }
}
