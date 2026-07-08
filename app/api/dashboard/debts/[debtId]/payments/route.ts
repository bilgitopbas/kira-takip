import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { saveUploadedFile } from "@/lib/uploads";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ debtId: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
  }

  const { debtId } = await params;

  const debt = await prisma.debt.findUnique({
    where: { id: debtId },
    include: { tenant: { include: { property: true } }, payments: true },
  });
  if (!debt || debt.tenant.property.ownerId !== session.userId) {
    return NextResponse.json({ error: "Borç kaydı bulunamadı." }, { status: 404 });
  }

  const formData = await req.formData();
  const amountRaw = (formData.get("amount") as string | null)?.trim() || "";
  const paidAtRaw = (formData.get("paidAt") as string | null)?.trim() || "";
  const notes = (formData.get("notes") as string | null)?.trim() || null;

  const amount = Number(amountRaw);
  if (Number.isNaN(amount) || amount <= 0) {
    return NextResponse.json({ error: "Geçerli bir tahsilat miktarı girin." }, { status: 400 });
  }

  let receiptFileUrl: string | null = null;
  const receiptFile = formData.get("receiptFile");
  if (receiptFile instanceof File && receiptFile.size > 0) {
    receiptFileUrl = await saveUploadedFile(receiptFile, "receipts");
  }

  try {
    const payment = await prisma.$transaction(async (tx) => {
      const created = await tx.payment.create({
        data: {
          tenantId: debt.tenantId,
          debtId: debt.id,
          amount,
          paidAt: paidAtRaw ? new Date(paidAtRaw) : new Date(),
          notes,
          receiptFileUrl,
        },
      });
      const totalPaid =
        debt.payments.reduce((sum, p) => sum + Number(p.amount), 0) + amount;
      if (totalPaid >= Number(debt.amount)) {
        await tx.debt.update({ where: { id: debt.id }, data: { status: "PAID" } });
      }
      return created;
    });

    return NextResponse.json({ success: true, payment });
  } catch {
    return NextResponse.json({ error: "Tahsilat kaydedilemedi." }, { status: 500 });
  }
}
