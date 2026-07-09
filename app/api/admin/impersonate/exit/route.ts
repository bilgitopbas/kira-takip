import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, createSession } from "@/lib/auth";

export async function POST() {
  const session = await getSession();
  if (!session || !session.impersonatedBy) {
    return NextResponse.json({ error: "Bir yönetici oturumuna dönülemedi." }, { status: 400 });
  }

  const admin = await prisma.user.findUnique({ where: { id: session.impersonatedBy } });
  if (!admin || admin.role !== "ADMIN") {
    return NextResponse.json({ error: "Yönetici bulunamadı." }, { status: 404 });
  }

  await createSession({ userId: admin.id, role: "ADMIN" });

  return NextResponse.json({ success: true });
}
