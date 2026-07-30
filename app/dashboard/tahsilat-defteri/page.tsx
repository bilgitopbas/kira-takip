import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import TahsilatDefteri from "@/components/TahsilatDefteri";

async function getPayments(ownerId: string) {
  const payments = await prisma.payment.findMany({
    where: { tenant: { property: { ownerId } } },
    include: {
      tenant: { select: { id: true, fullName: true, property: { select: { title: true } } } },
    },
    orderBy: { paidAt: "desc" },
  });

  return payments.map((p) => ({
    id: p.id,
    amount: Number(p.amount),
    paidAt: p.paidAt.toISOString(),
    method: p.method,
    notes: p.notes,
    hasReceipt: !!p.receiptFileUrl,
    tenantId: p.tenant.id,
    tenantName: p.tenant.fullName,
    propertyTitle: p.tenant.property.title,
  }));
}

export default async function TahsilatDefteriPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const payments = await getPayments(session.userId);

  return (
    <div>
      <div className="no-print mb-6">
        <h1 className="text-3xl font-bold text-slate-900">Tahsilat Defteri</h1>
        <p className="text-sm text-slate-500 mt-1">
          Tahsil edilen kiraların tarih sırasına göre dökümü.
        </p>
      </div>
      <TahsilatDefteri payments={payments} />
    </div>
  );
}
