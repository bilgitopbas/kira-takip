import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { requireWriteAccess } from "@/lib/access";

// Yanlış girilen bir borçlandırma dönemini (yılı) tamamen siler.
// Borçlara bağlı tahsilat kayıtları da silinir - aksi halde sahipsiz
// ödeme kayıtları kalırdı.
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

  const body = await req.json().catch(() => null);
  const debtIds: string[] = Array.isArray(body?.debtIds) ? body.debtIds : [];
  if (debtIds.length === 0) {
    return NextResponse.json({ error: "Silinecek borç kaydı bulunamadı." }, { status: 400 });
  }

  const matching = await prisma.debt.count({ where: { id: { in: debtIds }, tenantId: id } });
  if (matching !== debtIds.length) {
    return NextResponse.json({ error: "Borç kayıtları bu kiracıya ait değil." }, { status: 400 });
  }

  try {
    await prisma.$transaction([
      prisma.payment.deleteMany({ where: { debtId: { in: debtIds } } }),
      prisma.debt.deleteMany({ where: { id: { in: debtIds } } }),
    ]);

    // "Aylık Kira" alanı, kalan borçların en güncelinden yeniden belirlenir.
    const latestDebt = await prisma.debt.findFirst({
      where: { tenantId: id },
      orderBy: { dueDate: "desc" },
      select: { amount: true, periodMonths: true },
    });
    if (latestDebt) {
      await prisma.tenant.update({
        where: { id },
        data: { monthlyRent: Number(latestDebt.amount) / Math.max(1, latestDebt.periodMonths) },
      });
    }

    return NextResponse.json({ success: true, deleted: debtIds.length });
  } catch {
    return NextResponse.json({ error: "Dönem silinemedi." }, { status: 500 });
  }
}
