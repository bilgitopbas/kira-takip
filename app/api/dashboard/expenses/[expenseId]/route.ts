import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { requireWriteAccess } from "@/lib/access";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ expenseId: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
  }

  const access = await requireWriteAccess(session.userId);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: 403 });
  }

  const { expenseId } = await params;

  const expense = await prisma.expense.findUnique({
    where: { id: expenseId },
    include: { property: true },
  });
  if (!expense || expense.property.ownerId !== session.userId) {
    return NextResponse.json({ error: "Masraf kaydı bulunamadı." }, { status: 404 });
  }

  try {
    await prisma.expense.delete({ where: { id: expenseId } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Masraf silinemedi." }, { status: 500 });
  }
}
