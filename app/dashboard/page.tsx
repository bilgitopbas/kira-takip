import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getStats(ownerId: string) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const [propertyCount, tenantCount, collections] = await Promise.all([
    prisma.property.count({ where: { ownerId } }),
    prisma.tenant.count({ where: { property: { ownerId } } }),
    prisma.payment.aggregate({
      where: {
        tenant: { property: { ownerId } },
        paidAt: { gte: monthStart, lt: monthEnd },
      },
      _sum: { amount: true },
    }),
  ]);

  return {
    propertyCount,
    tenantCount,
    collected: collections._sum.amount ? Number(collections._sum.amount) : 0,
  };
}

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const { propertyCount, tenantCount, collected } = await getStats(session.userId);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Kontrol Paneli</h1>
        <p className="text-sm text-slate-400 mt-1">Mulklerinizin genel durumu</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <p className="text-xs font-medium text-slate-400 mb-1">Toplam Mulk</p>
          <p className="text-3xl font-bold text-slate-800">{propertyCount}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <p className="text-xs font-medium text-slate-400 mb-1">Toplam Kiraci</p>
          <p className="text-3xl font-bold text-slate-800">{tenantCount}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <p className="text-xs font-medium text-slate-400 mb-1">Bu Ay Tahsilat</p>
          <p className="text-3xl font-bold text-slate-800">
            {collected.toLocaleString("tr-TR")} TL
          </p>
        </div>
      </div>
      {propertyCount === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
          <h3 className="text-lg font-semibold text-slate-700 mb-2">Ilk mulkunuzu ekleyin</h3>
          <p className="text-sm text-slate-400 mb-6 max-w-sm mx-auto">
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
          <h3 className="text-lg font-semibold text-slate-700 mb-2">Devam edin</h3>
          <p className="text-sm text-slate-400 mb-6 max-w-sm mx-auto">
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
