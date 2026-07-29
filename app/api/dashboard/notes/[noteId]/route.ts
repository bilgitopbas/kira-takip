import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { requireWriteAccess } from "@/lib/access";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ noteId: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
  }

  const access = await requireWriteAccess(session.userId);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: 403 });
  }

  const { noteId } = await params;

  const note = await prisma.tenantNote.findUnique({
    where: { id: noteId },
    include: { tenant: { include: { property: true } } },
  });
  if (!note || note.tenant.property.ownerId !== session.userId) {
    return NextResponse.json({ error: "Not bulunamadı." }, { status: 404 });
  }

  try {
    await prisma.tenantNote.delete({ where: { id: noteId } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Not silinemedi." }, { status: 500 });
  }
}
