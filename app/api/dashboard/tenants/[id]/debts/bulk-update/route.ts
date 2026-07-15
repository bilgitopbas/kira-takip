import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { requireWriteAccess } from "@/lib/access";

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
  const debtIds: string[] = Array.isArray(body?.debtIds) ? body.debtIds : [];
  const amount = Number(body?.amount);

  if (debtIds.length === 0) {
    return NextResponse.json({ error: "Düzeltilecek borç kaydı bulunamadı." }, { status: 400 });
  }
  if (Number.isNaN(amount) || amount <= 0) {
    return NextResponse.json({ error: "Geçerli bir tutar girin." }, { status: 400 });
  }

  const matching = await prisma.debt.count({ where: { id: { in: debtIds }, tenantId: id } });
  if (matching !== debtIds.length) {
    return NextResponse.json({ error: "Borç kayıtları bu kiracıya ait değil." }, { status: 400 });
  }

  await prisma.debt.updateMany({ where: { id: { in: debtIds } }, data: { amount } });

  // Aylık kira bilgisi, tarihi en güncel olan borç dönemine göre belirlenir.
  const latestDebt = await prisma.debt.findFirst({
    where: { tenantId: id },
    orderBy: { dueDate: "desc" },
    select: { amount: true },
  });
  if (latestDebt) {
    await prisma.tenant.update({ where: { id }, data: { monthlyRent: latestDebt.amount } });
  }

  return NextResponse.json({ success: true, updated: debtIds.length });
}
