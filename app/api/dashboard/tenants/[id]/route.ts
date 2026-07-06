import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
  }

  const { id } = await params;

  const tenant = await prisma.tenant.findUnique({
    where: { id },
    include: { property: true },
  });
  if (!tenant || tenant.property.ownerId !== session.userId) {
    return NextResponse.json({ error: "Kiracı bulunamadı." }, { status: 404 });
  }

  try {
    await prisma.tenant.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Kiracı silinemedi." }, { status: 500 });
  }
}
