import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import FinansRaporlari from "@/components/FinansRaporlari";

async function getData(ownerId: string) {
  const [payments, debts] = await Promise.all([
    prisma.payment.findMany({
      where: { tenant: { property: { ownerId } } },
      include: {
        tenant: { select: { id: true, fullName: true, property: { select: { title: true } } } },
      },
      orderBy: { paidAt: "desc" },
    }),
    prisma.debt.findMany({
      where: { tenant: { property: { ownerId } } },
      select: { amount: true, dueDate: true },
    }),
  ]);

  return {
    payments: payments.map((p) => ({
      id: p.id,
      amount: Number(p.amount),
      paidAt: p.paidAt.toISOString(),
      method: p.method,
      notes: p.notes,
      hasReceipt: !!p.receiptFileUrl,
      tenantId: p.tenant.id,
      tenantName: p.tenant.fullName,
      propertyTitle: p.tenant.property.title,
    })),
    debts: debts.map((d) => ({ amount: Number(d.amount), dueDate: d.dueDate.toISOString() })),
  };
}

export default async function FinansRaporlariPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const { payments, debts } = await getData(session.userId);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">Finans Raporları</h1>
        <p className="text-sm text-slate-500 mt-1">Tahsilatlarınızı ve gelir dağılımınızı inceleyin.</p>
      </div>
      <FinansRaporlari payments={payments} debts={debts} />
    </div>
  );
}
