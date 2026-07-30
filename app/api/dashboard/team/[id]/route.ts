import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { requireWriteAccess } from "@/lib/access";

export async function DELETE(
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
  const member = await prisma.accountMember.findUnique({ where: { id } });
  if (!member || member.ownerId !== session.userId) {
    return NextResponse.json({ error: "Kayıt bulunamadı." }, { status: 404 });
  }

  await prisma.accountMember.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
