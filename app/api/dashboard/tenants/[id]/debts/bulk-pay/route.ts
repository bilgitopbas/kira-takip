import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { requireWriteAccess } from "@/lib/access";

// Geçmiş yılların verisini hızlı girebilmek için bir dönemin (yılın) tüm
// borçlarını tek seferde tahsil edilmiş olarak işaretler. Her borç için
// tahsilat tarihi, o borcun kendi vade tarihidir.
// Kısmi ödenmiş borçlarda yalnızca kalan bakiye kadar tahsilat eklenir;
// tamamen ödenmiş borçlar atlanır.
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
    return NextResponse.json({ error: "İşaretlenecek borç kaydı bulunamadı." }, { status: 400 });
  }

  // Yalnızca bu kiracıya ait borçlar işlenir
  const debts = await prisma.debt.findMany({
    where: { id: { in: debtIds }, tenantId: id },
    include: { payments: { select: { amount: true } } },
  });
  if (debts.length !== debtIds.length) {
    return NextResponse.json({ error: "Borç kayıtları bu kiracıya ait değil." }, { status: 400 });
  }

  const eklenecek = debts
    .map((debt) => {
      const odenen = debt.payments.reduce((sum, p) => sum + Number(p.amount), 0);
      const kalan = Number(debt.amount) - odenen;
      return { debt, kalan };
    })
    .filter(({ kalan }) => kalan > 0);

  if (eklenecek.length === 0) {
    return NextResponse.json({ error: "Bu dönemdeki borçlar zaten ödenmiş." }, { status: 400 });
  }

  try {
    await prisma.$transaction([
      prisma.payment.createMany({
        data: eklenecek.map(({ debt, kalan }) => ({
          tenantId: id,
          debtId: debt.id,
          amount: kalan,
          paidAt: debt.dueDate,
        })),
      }),
      prisma.debt.updateMany({
        where: { id: { in: eklenecek.map(({ debt }) => debt.id) } },
        data: { status: "PAID" },
      }),
    ]);

    return NextResponse.json({ success: true, marked: eklenecek.length });
  } catch {
    return NextResponse.json({ error: "Tahsilatlar kaydedilemedi." }, { status: 500 });
  }
}
