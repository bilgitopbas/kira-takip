import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
  }

  const { id } = await params;
  const member = await prisma.accountMember.findUnique({ where: { id } });
  if (!member || member.ownerId !== session.userId) {
    return NextResponse.json({ error: "Kayıt bulunamadı." }, { status: 404 });
  }

  await prisma.accountMember.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
