import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import OdemeBildirimleriView from "@/components/admin/OdemeBildirimleriView";

export default async function OdemeBildirimleriPage() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    redirect("/login");
  }

  const bildirimler = await prisma.paymentNotice.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 200,
    include: {
      user: { select: { fullName: true, email: true, phone: true } },
    },
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Ödeme Bildirimleri</h1>
        <p className="text-sm text-slate-500 mt-1">
          Havale/EFT ile ödeme yaptığını bildiren müşteriler. Onaylamadan önce banka
          ekstrenizde referans kodunu doğrulayın.
        </p>
      </div>

      <OdemeBildirimleriView
        bildirimler={bildirimler.map((b) => ({
          id: b.id,
          referenceCode: b.referenceCode,
          propertyCount: b.propertyCount,
          months: b.months,
          amount: Number(b.amount),
          note: b.note,
          status: b.status,
          reviewNote: b.reviewNote,
          createdAt: b.createdAt.toISOString(),
          fullName: b.user.fullName,
          email: b.user.email,
          phone: b.user.phone,
        }))}
      />
    </div>
  );
}
