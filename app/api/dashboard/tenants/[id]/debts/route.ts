import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { generateMonthlyDebts } from "@/lib/debts";
import { requireWriteAccess } from "@/lib/access";

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

  const tenant = await prisma.tenant.findUnique({
    where: { id },
    include: { property: true },
  });
  if (!tenant || tenant.property.ownerId !== session.userId) {
    return NextResponse.json({ error: "Kiracı bulunamadı." }, { status: 404 });
  }

  const { monthlyRent, startDate } = await req.json();
  const rent = Number(monthlyRent);
  if (!startDate || Number.isNaN(rent) || rent <= 0) {
    return NextResponse.json({ error: "Geçerli bir tarih ve kira bedeli girin." }, { status: 400 });
  }

  const existingDebts = await prisma.debt.findMany({
    where: { tenantId: id },
    select: { year: true, month: true },
  });
  const existingKeys = new Set(existingDebts.map((d) => `${d.year}-${d.month}`));

  const newDebts = generateMonthlyDebts(new Date(startDate), rent).filter(
    (d) => !existingKeys.has(`${d.year}-${d.month}`)
  );

  if (newDebts.length === 0) {
    return NextResponse.json(
      { error: "Bu tarih aralığı için borç kayıtları zaten mevcut." },
      { status: 400 }
    );
  }

  await prisma.debt.createMany({
    data: newDebts.map((d) => ({ ...d, tenantId: id })),
  });

  // Aylık kira bilgisi, tarihi en güncel olan borç dönemine göre belirlenir
  // (borçlandırmaların hangi sırayla girildiğine değil, tarihe bakılır).
  const latestDebt = await prisma.debt.findFirst({
    where: { tenantId: id },
    orderBy: { dueDate: "desc" },
    select: { amount: true },
  });
  if (latestDebt) {
    await prisma.tenant.update({
      where: { id },
      data: { monthlyRent: latestDebt.amount },
    });
  }

  return NextResponse.json({ success: true, created: newDebts.length });
}
