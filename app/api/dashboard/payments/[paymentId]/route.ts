import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { requireWriteAccess } from "@/lib/access";

async function loadOwnedPayment(paymentId: string, userId: string) {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { tenant: { include: { property: true } } },
  });
  if (!payment || payment.tenant.property.ownerId !== userId) return null;
  return payment;
}

async function syncDebtStatus(debtId: string, tx: typeof prisma) {
  const debt = await tx.debt.findUnique({ where: { id: debtId }, include: { payments: true } });
  if (!debt) return;
  const totalPaid = debt.payments.reduce((sum, p) => sum + Number(p.amount), 0);
  await tx.debt.update({
    where: { id: debt.id },
    data: { status: totalPaid >= Number(debt.amount) ? "PAID" : "UNPAID" },
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ paymentId: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
  }

  const access = await requireWriteAccess(session.userId);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: 403 });
  }

  const { paymentId } = await params;
  const payment = await loadOwnedPayment(paymentId, session.userId);
  if (!payment) {
    return NextResponse.json({ error: "Tahsilat kaydı bulunamadı." }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const amount = Number(body.amount);
  if (Number.isNaN(amount) || amount <= 0) {
    return NextResponse.json({ error: "Geçerli bir tutar girin." }, { status: 400 });
  }

  const paidAt = body.paidAt ? new Date(body.paidAt) : payment.paidAt;
  const notes = typeof body.notes === "string" ? body.notes.trim() || null : payment.notes;

  try {
    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.payment.update({
        where: { id: paymentId },
        data: { amount, paidAt, notes },
      });
      if (payment.debtId) {
        await syncDebtStatus(payment.debtId, tx as unknown as typeof prisma);
      }
      return result;
    });

    return NextResponse.json({ success: true, payment: updated });
  } catch {
    return NextResponse.json({ error: "Tahsilat güncellenemedi." }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ paymentId: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
  }

  const access = await requireWriteAccess(session.userId);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: 403 });
  }

  const { paymentId } = await params;
  const payment = await loadOwnedPayment(paymentId, session.userId);
  if (!payment) {
    return NextResponse.json({ error: "Tahsilat kaydı bulunamadı." }, { status: 404 });
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.payment.delete({ where: { id: paymentId } });
      if (payment.debtId) {
        await syncDebtStatus(payment.debtId, tx as unknown as typeof prisma);
      }
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Tahsilat silinemedi." }, { status: 500 });
  }
}
