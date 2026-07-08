import { prisma } from "@/lib/prisma";
import { getEffectiveDebtStatus } from "@/lib/debtStatus";
import { getFiveYearDate, getRenewalNotificationDate, toDateKey } from "@/lib/calendarEvents";

async function createIfMissing(data: {
  userId: string;
  type:
    | "PAYMENT_OVERDUE"
    | "RENEWAL_UPCOMING"
    | "FIVE_YEAR_3_MONTHS"
    | "FIVE_YEAR_1_MONTH"
    | "FIVE_YEAR_REACHED"
    | "MONTHLY_SUMMARY"
    | "ANNOUNCEMENT";
  title: string;
  message: string;
  link?: string;
  dedupeKey: string;
}) {
  try {
    await prisma.notification.create({ data });
  } catch {
    // unique constraint on [userId, dedupeKey] -> already exists, ignore
  }
}

export async function generateNotificationsForOwner(ownerId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tenants = await prisma.tenant.findMany({
    where: { property: { ownerId } },
    select: {
      id: true,
      fullName: true,
      contractStart: true,
      debts: {
        select: {
          id: true,
          amount: true,
          dueDate: true,
          payments: { select: { amount: true } },
        },
      },
    },
  });

  for (const tenant of tenants) {
    // 1. Geciken ödeme (vade + 1 gün ve sonrası)
    for (const debt of tenant.debts) {
      const due = new Date(debt.dueDate);
      due.setHours(0, 0, 0, 0);
      const oneDayAfter = new Date(due);
      oneDayAfter.setDate(oneDayAfter.getDate() + 1);

      if (today >= oneDayAfter && getEffectiveDebtStatus(debt) !== "PAID") {
        await createIfMissing({
          userId: ownerId,
          type: "PAYMENT_OVERDUE",
          title: "Gecikmiş Ödeme",
          message: `${tenant.fullName} kirasını ödemedi, ödendi ise lütfen tahsilat giriniz.`,
          link: `/dashboard/kiraci/${tenant.id}`,
          dedupeKey: `overdue:${debt.id}`,
        });
      }
    }

    // 2. Zam / borçlandırma hatırlatma (son borç vadesine 15 gün kala)
    if (tenant.debts.length > 0) {
      const dueDates = tenant.debts.map((d) => new Date(d.dueDate));
      const renewalDate = getRenewalNotificationDate(dueDates);
      if (renewalDate) {
        renewalDate.setHours(0, 0, 0, 0);
        const latest = dueDates.reduce((max, d) => (d > max ? d : max));
        if (today >= renewalDate) {
          await createIfMissing({
            userId: ownerId,
            type: "RENEWAL_UPCOMING",
            title: "Zam Dönemi Yaklaşıyor",
            message: `${tenant.fullName} için 12 aylık borçlandırma dönemi dolmak üzere. Zam dönemi yaklaşıyor.`,
            link: `/dashboard/kiraci/${tenant.id}`,
            dedupeKey: `renewal:${tenant.id}:${toDateKey(latest)}`,
          });
        }
      }
    }

    // 3. 5. yıl (3 ay önce / 1 ay önce / dolduğunda)
    if (tenant.contractStart) {
      const fiveYearDate = getFiveYearDate(new Date(tenant.contractStart));
      const threeMonthsBefore = new Date(fiveYearDate);
      threeMonthsBefore.setMonth(threeMonthsBefore.getMonth() - 3);
      const oneMonthBefore = new Date(fiveYearDate);
      oneMonthBefore.setMonth(oneMonthBefore.getMonth() - 1);

      if (today >= threeMonthsBefore) {
        await createIfMissing({
          userId: ownerId,
          type: "FIVE_YEAR_3_MONTHS",
          title: "5. Yıl Yaklaşıyor",
          message: `${tenant.fullName} için 5. yıla 3 ay kaldı. Kira tespit davası açılabilir.`,
          link: `/dashboard/kiraci/${tenant.id}`,
          dedupeKey: `five-year-3m:${tenant.id}`,
        });
      }
      if (today >= oneMonthBefore) {
        await createIfMissing({
          userId: ownerId,
          type: "FIVE_YEAR_1_MONTH",
          title: "5. Yıl Yaklaşıyor",
          message: `${tenant.fullName} için 5. yıla 1 ay kaldı. Kira tespit davası açılabilir.`,
          link: `/dashboard/kiraci/${tenant.id}`,
          dedupeKey: `five-year-1m:${tenant.id}`,
        });
      }
      if (today >= fiveYearDate) {
        await createIfMissing({
          userId: ownerId,
          type: "FIVE_YEAR_REACHED",
          title: "5. Yıl Doldu",
          message: `${tenant.fullName} için 5 yıllık süre doldu. Kira tespit davası açılabilir.`,
          link: `/dashboard/kiraci/${tenant.id}`,
          dedupeKey: `five-year-reached:${tenant.id}`,
        });
      }
    }
  }

  // 4. Aylık tahsilat özeti (bir önceki ay bittiyse)
  const prevMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
  if (today > prevMonthEnd) {
    const year = prevMonthEnd.getFullYear();
    const month = prevMonthEnd.getMonth() + 1;
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 1);

    const payments = await prisma.payment.findMany({
      where: {
        tenant: { property: { ownerId } },
        paidAt: { gte: monthStart, lt: monthEnd },
      },
      select: { amount: true },
    });

    const total = payments.reduce((sum, p) => sum + Number(p.amount), 0);

    await createIfMissing({
      userId: ownerId,
      type: "MONTHLY_SUMMARY",
      title: "Aylık Tahsilat Özeti",
      message: `${month}.${year} ayında toplam ${total.toLocaleString("tr-TR")} ₺ tahsilat yapıldı.`,
      link: "/dashboard/finans-raporlari",
      dedupeKey: `summary:${year}-${month}`,
    });
  }
}
