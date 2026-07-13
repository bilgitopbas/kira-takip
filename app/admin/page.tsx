import Link from "next/link";
import { prisma } from "@/lib/prisma";

async function getStats() {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);

  const [
    userCount,
    propertyCount,
    tenantCount,
    recentUsers,
    trialCount,
    activeCount,
    danismanCount,
    passiveCount,
    churnedTrialCount,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.property.count(),
    prisma.tenant.count(),
    prisma.user.findMany({
      where: { role: "CUSTOMER" },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, fullName: true, email: true, subscriptionStatus: true, createdAt: true },
    }),
    prisma.user.count({ where: { role: "CUSTOMER", subscriptionStatus: "TRIAL" } }),
    prisma.user.count({ where: { role: "CUSTOMER", subscriptionStatus: "ACTIVE" } }),
    prisma.user.count({ where: { role: "CUSTOMER", subscriptionStatus: "DANISMAN" } }),
    prisma.user.count({ where: { role: "CUSTOMER", subscriptionStatus: "PASSIVE" } }),
    prisma.user.count({
      where: {
        role: "CUSTOMER",
        subscriptionStatus: { in: ["TRIAL", "PASSIVE"] },
        trialEndsAt: { gte: thirtyDaysAgo, lte: now },
      },
    }),
  ]);

  return {
    userCount,
    propertyCount,
    tenantCount,
    recentUsers,
    tierCounts: { TRIAL: trialCount, ACTIVE: activeCount, DANISMAN: danismanCount, PASSIVE: passiveCount },
    churnedTrialCount,
  };
}

const STATUS_STYLES = {
  TRIAL: "bg-amber-50 text-amber-600 border border-amber-100",
  ACTIVE: "bg-emerald-50 text-emerald-600 border border-emerald-100",
  PASSIVE: "bg-red-50 text-red-500 border border-red-100",
  DANISMAN: "bg-violet-50 text-violet-600 border border-violet-100",
};

const STATUS_LABELS = {
  TRIAL: "Mizan Ücretsiz",
  ACTIVE: "Mizan Pro",
  PASSIVE: "Pasif",
  DANISMAN: "Mizan Danışman",
};

const TIER_BAR_STYLES: Record<string, string> = {
  TRIAL: "bg-amber-400",
  ACTIVE: "bg-emerald-500",
  DANISMAN: "bg-violet-500",
  PASSIVE: "bg-red-400",
};

export default async function AdminDashboard() {
  const { userCount, propertyCount, tenantCount, recentUsers, tierCounts, churnedTrialCount } = await getStats();
  const tierTotal = Math.max(1, tierCounts.TRIAL + tierCounts.ACTIVE + tierCounts.DANISMAN + tierCounts.PASSIVE);

  const CARDS = [
    {
      label: "Toplam Kullanıcı",
      value: userCount,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
        </svg>
      ),
      color: "text-[#17B6AE] bg-[#17B6AE]/8",
    },
    {
      label: "Toplam Mülk",
      value: propertyCount,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 21V12h6v9" />
        </svg>
      ),
      color: "text-blue-500 bg-blue-50",
    },
    {
      label: "Toplam Kiracı",
      value: tenantCount,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      color: "text-violet-500 bg-violet-50",
    },
    {
      label: "Son 30 Günde Kaybedilen Deneme",
      value: churnedTrialCount,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 17h8m0 0l-3-3m3 3l-3 3M3 7h8m0 0L8 4m3 3L8 10" />
        </svg>
      ),
      color: "text-orange-500 bg-orange-50",
    },
  ];

  return (
    <div>
      {/* Başlık */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Kontrol Paneli</h1>
        <p className="text-sm text-slate-400 mt-1">Sistemin genel durumuna buradan bakabilirsiniz.</p>
      </div>

      {/* Hızlı erişim */}
      <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 mb-8">
        <Link
          href="/admin"
          className="inline-flex justify-center items-center bg-[#17B6AE] text-white font-semibold px-3 sm:px-4 py-2.5 rounded-xl transition text-sm"
        >
          Kontrol Paneli
        </Link>
        <Link
          href="/admin/gelirler"
          className="inline-flex justify-center items-center bg-white hover:bg-gray-50 text-slate-700 font-semibold px-3 sm:px-4 py-2.5 rounded-xl transition text-sm border border-gray-200"
        >
          Gelirler
        </Link>
        <Link
          href="/admin/bildirimler"
          className="inline-flex justify-center items-center bg-white hover:bg-gray-50 text-slate-700 font-semibold px-3 sm:px-4 py-2.5 rounded-xl transition text-sm border border-gray-200"
        >
          Bildirimler
        </Link>
        <Link
          href="/admin/kullanicilar"
          className="inline-flex justify-center items-center bg-white hover:bg-gray-50 text-slate-700 font-semibold px-3 sm:px-4 py-2.5 rounded-xl transition text-sm border border-gray-200"
        >
          Kullanıcılar
        </Link>
        <Link
          href="/admin/ayarlar"
          className="inline-flex justify-center items-center bg-white hover:bg-gray-50 text-slate-700 font-semibold px-3 sm:px-4 py-2.5 rounded-xl transition text-sm border border-gray-200"
        >
          Ayarlar
        </Link>
      </div>

      {/* Stat kartları */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {CARDS.map((card) => (
          <div
            key={card.label}
            className="bg-white rounded-2xl border border-gray-100 p-6 flex items-center gap-4 shadow-sm"
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${card.color}`}>
              {card.icon}
            </div>
            <div>
              <p className="text-xs font-medium text-slate-400 mb-0.5">{card.label}</p>
              <p className="text-3xl font-bold text-slate-800">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Müşteri Tipi Dağılımı */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-8">
        <h2 className="text-sm font-semibold text-slate-700 mb-4">Müşteri Tipi Dağılımı</h2>
        <div className="w-full h-3 rounded-full overflow-hidden flex mb-4 bg-gray-100">
          {(Object.keys(tierCounts) as (keyof typeof tierCounts)[]).map((key) => (
            <div
              key={key}
              className={TIER_BAR_STYLES[key]}
              style={{ width: `${(tierCounts[key] / tierTotal) * 100}%` }}
            />
          ))}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {(Object.keys(tierCounts) as (keyof typeof tierCounts)[]).map((key) => (
            <div key={key} className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${TIER_BAR_STYLES[key]}`} />
              <div>
                <p className="text-xs text-slate-400">{STATUS_LABELS[key]}</p>
                <p className="text-sm font-bold text-slate-700">{tierCounts[key]}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Son kayıtlar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700">Son Kayıt Olan Kullanıcılar</h2>
          <a href="/admin/kullanicilar" className="text-xs text-[#17B6AE] font-medium hover:underline">
            Tümünü Gör
          </a>
        </div>
        <div className="divide-y divide-gray-50">
          {recentUsers.length === 0 && (
            <p className="text-sm text-slate-400 text-center py-8">Henüz kullanıcı yok.</p>
          )}
          {recentUsers.map((u) => (
            <div key={u.id} className="px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#17B6AE]/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-[#17B6AE] text-xs font-bold">
                    {u.fullName?.charAt(0)?.toUpperCase() ?? "?"}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700">{u.fullName}</p>
                  <p className="text-xs text-slate-400">{u.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_STYLES[u.subscriptionStatus]}`}>
                  {STATUS_LABELS[u.subscriptionStatus]}
                </span>
                <span className="text-xs text-slate-300">
                  {new Date(u.createdAt).toLocaleDateString("tr-TR")}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}