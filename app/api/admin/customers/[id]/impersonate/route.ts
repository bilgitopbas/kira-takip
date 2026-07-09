import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, createSession } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 403 });
  }

  const { id } = await params;
  const target = await prisma.user.findUnique({ where: { id } });
  if (!target || target.role !== "CUSTOMER") {
    return NextResponse.json({ error: "Kullanıcı bulunamadı." }, { status: 404 });
  }

  await createSession({ userId: target.id, role: "CUSTOMER", impersonatedBy: session.userId });

  return NextResponse.json({ success: true });
}
