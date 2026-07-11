import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import MonthlyIncomeChart from "@/components/MonthlyIncomeChart";
import OccupancyChart from "@/components/OccupancyChart";
import MonthlyPaymentsPie from "@/components/MonthlyPaymentsPie";
import MulkEkleButton from "@/components/MulkEkleButton";
import KiraciEkleButton from "@/components/KiraciEkleButton";
import TahsilatEkleButton from "@/components/TahsilatEkleButton";
import TrialBanner from "@/components/TrialBanner";
import { getEffectiveDebtStatus } from "@/lib/debtStatus";
import { getAccessStateForUser } from "@/lib/access";

const MONTH_SHORT = [
  "Oca", "Sub", "Mar", "Nis", "May", "Haz",
  "Tem", "Agu", "Eyl", "Eki", "Kas", "Ara",
];

async function getStats(ownerId: string) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const yearStart = new Date(now.getFullYear(), 0, 1);
  const fiveYearsAgoStart = new Date(now.getFullYear(), now.getMonth() - 59, 1);

  const [
    propertyCount,
    occupiedCount,
    tenantCount,
    monthCollections,
    yearCollections,
    longRangePayments,
    longRangeDebts,
    monthDebts,
    overdueDebts,
  ] = await Promise.all([
    prisma.property.count({ where: { ownerId } }),
    prisma.property.count({ where: { ownerId, isOccupied: true } }),
    prisma.tenant.count({ where: { property: { ownerId } } }),
    prisma.payment.aggregate({
      where: { tenant: { property: { ownerId } }, paidAt: { gte: monthStart, lt: monthEnd } },
      _sum: { amount: true },
    }),
    prisma.payment.aggregate({
      where: { tenant: { property: { ownerId } }, paidAt: { gte: yearStart, lt: monthEnd } },
      _sum: { amount: true },
    }),
    prisma.payment.findMany({
      where: { tenant: { property: { ownerId } }, paidAt: { gte: fiveYearsAgoStart } },
      select: { amount: true, paidAt: true, debt: { select: { dueDate: true } } },
    }),
    prisma.debt.findMany({
      where: { tenant: { property: { ownerId } }, dueDate: { gte: fiveYearsAgoStart } },
      select: { amount: true, dueDate: true },
    }),
    prisma.debt.findMany({
      where: { tenant: { property: { ownerId } }, dueDate: { gte: monthStart, lt: monthEnd } },
      select: {
        id: true,
        amount: true,
        status: true,
        dueDate: true,
        payments: { select: { amount: true } },
        tenant: { select: { id: true, fullName: true } },
      },
    }),
    prisma.debt.findMany({
      where: {
        tenant: { property: { ownerId } },
        status: { not: "PAID" },
        dueDate: { lt: now },
      },
      select: { amount: true, dueDate: true, payments: { select: { amount: true } } },
    }),
  ]);

  const monthlyTotals = new Map<string, number>();
  const monthlyDebtTotals = new Map<string, number>();
  for (let i = 59; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    monthlyTotals.set(key, 0);
    monthlyDebtTotals.set(key, 0);
  }
  for (const p of longRangePayments) {
    // Tahsilat grafiğinde ödeme, ait olduğu borç döneminin ayına işlenir
    // (örn. Temmuz'da tahsil edilen Mayıs kirası Mayıs'a yazılır), tahsilat tarihine değil.
    const d = new Date(p.debt?.dueDate ?? p.paidAt);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (monthlyTotals.has(key)) {
      monthlyTotals.set(key, monthlyTotals.get(key)! + Number(p.amount));
    }
  }
  for (const d of longRangeDebts) {
    const due = new Date(d.dueDate);
    const key = `${due.getFullYear()}-${due.getMonth()}`;
    if (monthlyDebtTotals.has(key)) {
      monthlyDebtTotals.set(key, monthlyDebtTotals.get(key)! + Number(d.amount));
    }
  }
  const chartData = Array.from(monthlyTotals.entries()).map(([key, total]) => {
    const [year, month] = key.split("-").map(Number);
    return {
      ay: `${MONTH_SHORT[month]} '${String(year).slice(2)}`,
      tutar: total,
      borc: monthlyDebtTotals.get(key) || 0,
    };
  });

  const monthlyPayments = monthDebts.map((d) => ({
    id: d.id,
    tenantId: d.tenant.id,
    tenantName: d.tenant.fullName,
    amount: Number(d.amount),
    status: getEffectiveDebtStatus(d),
  }));

  const monthTotalDebt = monthDebts.reduce((sum, d) => sum + Number(d.amount), 0);
  const monthCollectedAmount = monthCollections._sum.amount ? Number(monthCollections._sum.amount) : 0;
  const collectionRate = monthTotalDebt > 0 ? Math.min(100, Math.round((monthCollectedAmount / monthTotalDebt) * 100)) : null;

  const overdueRemaining = overdueDebts.reduce((sum, d) => {
    const paid = d.payments.reduce((s, p) => s + Number(p.amount), 0);
    return sum + Math.max(0, Number(d.amount) - paid);
  }, 0);

  return {
    propertyCount,
    occupiedCount,
    vacantCount: propertyCount - occupiedCount,
    tenantCount,
    collected: monthCollectedAmount,
    yearlyCollected: yearCollections._sum.amount ? Number(yearCollections._sum.amount) : 0,
    chartData,
    monthlyPayments,
    collectionRate,
    overdueCount: overdueDebts.length,
    overdueAmount: overdueRemaining,
  };
}

const CARD_ICONS = {
  properties: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 21V12h6v9" />
    </svg>
  ),
  tenants: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
    </svg>
  ),
  month: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  ),
  year: (
    <span className="text-lg font-bold leading-none">₺</span>
  ),
};

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const {
    propertyCount,
    occupiedCount,
    vacantCount,
    tenantCount,
    collected,
    yearlyCollected,
    chartData,
    monthlyPayments,
    collectionRate,
    overdueCount,
    overdueAmount,
  } = await getStats(session.userId);

  const access = await getAccessStateForUser(session.userId);
  const profile = await prisma.user.findUnique({ where: { id: session.userId }, select: { city: true } });

  const CARDS = [
    { label: "Toplam Mülk", value: `${propertyCount}`, icon: CARD_ICONS.properties, color: "text-blue-500 bg-blue-50" },
    { label: "Toplam Kiracı", value: `${tenantCount}`, icon: CARD_ICONS.tenants, color: "text-violet-500 bg-violet-50" },
    { label: "Bu Ay Tahsilat", value: `${collected.toLocaleString("tr-TR")} ₺`, icon: CARD_ICONS.month, color: "text-[#17B6AE] bg-[#17B6AE]/8", progress: collectionRate },
    { label: "Bu Yıl Toplam Kira Geliri", value: `${yearlyCollected.toLocaleString("tr-TR")} ₺`, icon: CARD_ICONS.year, color: "text-amber-500 bg-amber-50" },
  ];

  const primaryBtn = "inline-flex bg-[#17B6AE] hover:bg-[#149891] text-white font-semibold px-4 py-2.5 rounded-xl transition text-sm";
  const secondaryBtn = "inline-flex bg-white hover:bg-gray-50 text-slate-700 font-semibold px-4 py-2.5 rounded-xl transition text-sm border border-gray-200";

  const updatedAt = new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Kontrol Paneli</h1>
          <p className="text-sm text-slate-500 mt-1">Mülklerinizin genel durumu · Son güncelleme: Bugün {updatedAt}</p>
        </div>
        <div className="flex items-center gap-2">
          <MulkEkleButton className={primaryBtn} />
          <KiraciEkleButton className={secondaryBtn} />
          <TahsilatEkleButton className={secondaryBtn} />
        </div>
      </div>

      {profile && !profile.city && (
        <div className="flex items-center justify-between gap-4 bg-amber-50 border border-amber-200 rounded-xl px-5 py-3 mb-6">
          <p className="text-sm text-slate-700">
            <span className="font-semibold text-amber-600">Kurulumunuz eksik.</span>{" "}
            Şehir bilginizi tamamlayarak hesabınızı etkinleştirin.
          </p>
          <a
            href="/dashboard/profili-tamamla"
            className="text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg transition whitespace-nowrap"
          >
            Şimdi Tamamla
          </a>
        </div>
      )}

      {access && (
        <TrialBanner state={access.state} trialDaysLeft={access.trialDaysLeft} graceDaysLeft={access.graceDaysLeft} />
      )}

      {overdueCount > 0 && (
        <div className="flex items-center gap-3 bg-white rounded-xl border-l-4 border-orange-400 border-y border-r border-gray-100 shadow-sm px-5 py-3 mb-6">
          <span className="text-orange-500 text-sm font-bold">Toplam Gecikmiş</span>
          <span className="text-sm font-bold text-slate-800">{overdueAmount.toLocaleString("tr-TR")} ₺</span>
          <span className="text-xs text-slate-400">({overdueCount} kayıt)</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        {CARDS.map((card) => (
          <div
            key={card.label}
            className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${card.color}`}>
              {card.icon}
            </div>
            <p className="text-xs font-medium text-slate-500 mb-1">{card.label}</p>
            <p className="text-2xl font-bold text-slate-900">{card.value}</p>
            {card.progress !== undefined && card.progress !== null && (
              <div className="mt-3">
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#17B6AE] rounded-full transition-all"
                    style={{ width: `${card.progress}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">%{card.progress} Tahsilat</p>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-sm font-bold text-slate-800 mb-4">Mülk Doluluk Durumu</h2>
          {propertyCount === 0 ? (
            <p className="text-sm text-slate-500">Henüz mülk eklenmedi.</p>
          ) : (
            <OccupancyChart occupied={occupiedCount} vacant={vacantCount} />
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-sm font-bold text-slate-800 mb-4">Bu Ay Kira Ödemeleri</h2>
          <MonthlyPaymentsPie items={monthlyPayments} />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
        <MonthlyIncomeChart data={chartData} />
      </div>

      {propertyCount === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
          <h3 className="text-lg font-semibold text-slate-800 mb-2">İlk mülkünüzü ekleyin</h3>
          <p className="text-sm text-slate-500 mb-6 max-w-sm mx-auto">
            Mülklerinizi sisteme ekleyerek kira takibine başlayın.
          </p>
          <MulkEkleButton className={primaryBtn} />
        </div>
      )}
    </div>
  );
}
