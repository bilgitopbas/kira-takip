import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import MonthlyIncomeChart from "@/components/MonthlyIncomeChart";
import OccupancyChart from "@/components/OccupancyChart";

const MONTH_SHORT = [
  "Oca", "Sub", "Mar", "Nis", "May", "Haz",
  "Tem", "Agu", "Eyl", "Eki", "Kas", "Ara",
];

function timeAgo(date: Date) {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  const days = Math.floor(seconds / 86400);
  if (days === 0) return "Bugun";
  if (days === 1) return "Dun";
  if (days < 30) return `${days} gun once`;
  const months = Math.floor(days / 30);
  return `${months} ay once`;
}

async function getStats(ownerId: string) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const yearStart = new Date(now.getFullYear(), 0, 1);
  const sixMonthsAgoStart = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const [
    propertyCount,
    occupiedCount,
    tenantCount,
    monthCollections,
    yearCollections,
    recentPayments,
    overdueDebts,
    recentProperties,
    recentTenants,
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
      where: { tenant: { property: { ownerId } }, paidAt: { gte: sixMonthsAgoStart } },
      select: { amount: true, paidAt: true },
    }),
    prisma.debt.findMany({
      where: {
        tenant: { property: { ownerId } },
        status: { not: "PAID" },
        dueDate: { lt: now },
      },
      select: { amount: true },
    }),
    prisma.property.findMany({
      where: { ownerId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, title: true, createdAt: true },
    }),
    prisma.tenant.findMany({
      where: { property: { ownerId } },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, fullName: true, createdAt: true, property: { select: { title: true } } },
    }),
  ]);

  const monthlyTotals = new Map<string, number>();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    monthlyTotals.set(`${d.getFullYear()}-${d.getMonth()}`, 0);
  }
  for (const p of recentPayments) {
    const d = new Date(p.paidAt);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (monthlyTotals.has(key)) {
      monthlyTotals.set(key, monthlyTotals.get(key)! + Number(p.amount));
    }
  }
  const chartData = Array.from(monthlyTotals.entries()).map(([key, total]) => {
    const [, month] = key.split("-").map(Number);
    return { ay: MONTH_SHORT[month], tutar: total };
  });

  const overdueTotal = overdueDebts.reduce((sum, d) => sum + Number(d.amount), 0);

  const activity = [
    ...recentProperties.map((p) => ({
      id: p.id,
      type: "property" as const,
      label: p.title,
      sub: "Yeni mulk eklendi",
      createdAt: p.createdAt,
    })),
    ...recentTenants.map((t) => ({
      id: t.id,
      type: "tenant" as const,
      label: t.fullName,
      sub: `${t.property.title} icin kiraci eklendi`,
      createdAt: t.createdAt,
    })),
  ]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 5);

  return {
    propertyCount,
    occupiedCount,
    vacantCount: propertyCount - occupiedCount,
    tenantCount,
    collected: monthCollections._sum.amount ? Number(monthCollections._sum.amount) : 0,
    yearlyCollected: yearCollections._sum.amount ? Number(yearCollections._sum.amount) : 0,
    chartData,
    overdueTotal,
    overdueCount: overdueDebts.length,
    activity,
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
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
    </svg>
  ),
};

const ACTIVITY_ICONS = {
  property: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
    </svg>
  ),
  tenant: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <circle cx="12" cy="8" r="4" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 21v-1a8 8 0 0116 0v1" />
    </svg>
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
    overdueTotal,
    overdueCount,
    activity,
  } = await getStats(session.userId);

  const CARDS = [
    { label: "Toplam Mulk", value: `${propertyCount}`, icon: CARD_ICONS.properties, color: "text-blue-500 bg-blue-50" },
    { label: "Toplam Kiraci", value: `${tenantCount}`, icon: CARD_ICONS.tenants, color: "text-violet-500 bg-violet-50" },
    { label: "Bu Ay Tahsilat", value: `${collected.toLocaleString("tr-TR")} ₺`, icon: CARD_ICONS.month, color: "text-[#17B6AE] bg-[#17B6AE]/8" },
    { label: "Bu Yil Toplam Kira Geliri", value: `${yearlyCollected.toLocaleString("tr-TR")} ₺`, icon: CARD_ICONS.year, color: "text-amber-500 bg-amber-50" },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Kontrol Paneli</h1>
        <p className="text-sm text-slate-500 mt-1">Mulklerinizin genel durumu</p>
      </div>

      {overdueCount > 0 && (
        <div className="mb-6 bg-red-50 border border-red-100 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-red-100 text-red-500 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86l-8.18 14.18A2 2 0 004.18 21h15.64a2 2 0 001.87-2.96L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-bold text-red-700">
              {overdueCount} vadesi gecmis odeme var — toplam {overdueTotal.toLocaleString("tr-TR")} ₺
            </p>
            <p className="text-xs text-red-500 mt-0.5">
              Kiracilar sayfasindan ilgili kiraciya girip tahsilat kaydedebilirsiniz.
            </p>
          </div>
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
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
        <h2 className="text-sm font-bold text-slate-800 mb-4">Son 6 Ay Tahsilat</h2>
        <MonthlyIncomeChart data={chartData} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-sm font-bold text-slate-800 mb-4">Doluluk Orani</h2>
          {propertyCount === 0 ? (
            <p className="text-sm text-slate-500">Henuz mulk eklenmedi.</p>
          ) : (
            <OccupancyChart occupied={occupiedCount} vacant={vacantCount} />
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-sm font-bold text-slate-800 mb-4">Son Eklenenler</h2>
          {activity.length === 0 ? (
            <p className="text-sm text-slate-500">Henuz kayit yok.</p>
          ) : (
            <div className="space-y-4">
              {activity.map((item) => (
                <div key={`${item.type}-${item.id}`} className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      item.type === "property"
                        ? "bg-blue-50 text-blue-500"
                        : "bg-violet-50 text-violet-500"
                    }`}
                  >
                    {ACTIVITY_ICONS[item.type]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-800 truncate">{item.label}</p>
                    <p className="text-xs text-slate-500">{item.sub}</p>
                  </div>
                  <span className="text-xs text-slate-400 flex-shrink-0">{timeAgo(item.createdAt)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {propertyCount === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
          <h3 className="text-lg font-semibold text-slate-800 mb-2">Ilk mulkunuzu ekleyin</h3>
          <p className="text-sm text-slate-500 mb-6 max-w-sm mx-auto">
            Mulklerinizi sisteme ekleyerek kira takibine baslayin.
          </p>
          <a
            href="/dashboard/mulk/ekle"
            className="inline-flex bg-[#17B6AE] hover:bg-[#149891] text-white font-semibold px-6 py-3 rounded-xl transition text-sm"
          >
            Mulk Ekle
          </a>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
          <h3 className="text-lg font-semibold text-slate-800 mb-2">Devam edin</h3>
          <p className="text-sm text-slate-500 mb-6 max-w-sm mx-auto">
            Mulklerinizi ve kiracilarinizi yonetmeye devam edin.
          </p>
          <div className="flex items-center justify-center gap-3">
            <a
              href="/dashboard/mulk"
              className="inline-flex bg-[#17B6AE] hover:bg-[#149891] text-white font-semibold px-6 py-3 rounded-xl transition text-sm"
            >
              Mulklerimi Gor
            </a>
            <a
              href="/dashboard/kiraci/ekle"
              className="inline-flex bg-gray-50 hover:bg-gray-100 text-slate-600 font-semibold px-6 py-3 rounded-xl transition text-sm border border-gray-200"
            >
              Kiraci Ekle
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
