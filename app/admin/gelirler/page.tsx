import { prisma } from "@/lib/prisma";

async function getData() {
  const activeUsers = await prisma.user.findMany({
    where: { role: "CUSTOMER", subscriptionStatus: "ACTIVE" },
    select: { id: true, fullName: true, email: true },
  });
  const subscriptions = await prisma.subscription.findMany({
    where: { userId: { in: activeUsers.map((u) => u.id) } },
  });
  const subByUser = new Map(subscriptions.map((s) => [s.userId, s]));

  const rows = activeUsers
    .map((u) => ({ user: u, subscription: subByUser.get(u.id) || null }))
    .filter((r) => r.subscription)
    .sort((a, b) => Number(b.subscription!.monthlyPrice) - Number(a.subscription!.monthlyPrice));

  const mrr = rows.reduce((sum, r) => sum + Number(r.subscription!.monthlyPrice), 0);

  const pendingRequests = await prisma.supportTicket.findMany({
    where: { subject: { startsWith: "Mizan Pro Talebi" } },
    include: { user: { select: { fullName: true, email: true } } },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return { rows, mrr, pendingRequests };
}

export default async function AdminGelirlerPage() {
  const { rows, mrr, pendingRequests } = await getData();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Gelirler</h1>
        <p className="text-sm text-slate-400 mt-1">Mizan Pro abonelik gelirleri ve bekleyen talepler.</p>
      </div>

      <div className="bg-amber-50 border border-amber-100 rounded-2xl px-5 py-4 mb-6 text-sm text-amber-700">
        <strong>Bilgi:</strong> iyzico ödeme entegrasyonu henüz tamamlanmadı. Aşağıdaki tutarlar admin
        tarafından manuel olarak &quot;Mizan Pro&quot; durumuna alınan ve mülk limiti atanan müşterilerin
        aylık tutarlarının toplamıdır — gerçek ödeme tahsilat kaydı değildir. Ödeme sağlayıcısı bağlandığında
        bu sayfa gerçek işlemlerle güncellenecektir.
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <p className="text-xs font-medium text-slate-400 mb-1">Aylık Yinelenen Gelir (MRR)</p>
          <p className="text-3xl font-bold text-slate-800">{mrr.toLocaleString("tr-TR")} ₺</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <p className="text-xs font-medium text-slate-400 mb-1">Aktif Mizan Pro Müşterisi</p>
          <p className="text-3xl font-bold text-slate-800">{rows.length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <p className="text-xs font-medium text-slate-400 mb-1">Bekleyen Mizan Pro Talebi</p>
          <p className="text-3xl font-bold text-slate-800">{pendingRequests.length}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-gray-50">
          <h2 className="text-sm font-semibold text-slate-700">Aktif Mizan Pro Abonelikleri</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left">
              <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Müşteri</th>
              <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Mülk Limiti</th>
              <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Aylık Tutar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {rows.length === 0 && (
              <tr>
                <td colSpan={3} className="text-center text-slate-400 py-12 text-sm">Henüz aktif Mizan Pro müşterisi yok.</td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.user.id} className="hover:bg-gray-50/60 transition-colors">
                <td className="px-5 py-4">
                  <p className="font-medium text-slate-700">{r.user.fullName}</p>
                  <p className="text-xs text-slate-400">{r.user.email}</p>
                </td>
                <td className="px-5 py-4 text-slate-500">{r.subscription!.propertyCount} mülk</td>
                <td className="px-5 py-4 font-semibold text-slate-700">{Number(r.subscription!.monthlyPrice).toLocaleString("tr-TR")} ₺</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50">
          <h2 className="text-sm font-semibold text-slate-700">Bekleyen Mizan Pro Talepleri</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {pendingRequests.length === 0 && (
            <p className="text-sm text-slate-400 text-center py-12">Bekleyen talep yok.</p>
          )}
          {pendingRequests.map((t) => (
            <div key={t.id} className="px-6 py-4">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-semibold text-slate-700">{t.subject}</p>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${t.status === "OPEN" ? "bg-blue-50 text-blue-600 border border-blue-100" : "bg-gray-50 text-slate-400 border border-gray-100"}`}>
                  {t.status === "OPEN" ? "Açık" : "Kapalı"}
                </span>
              </div>
              <p className="text-xs text-slate-400 mb-1">{t.user.fullName} — {t.user.email}</p>
              <p className="text-sm text-slate-500 whitespace-pre-line">{t.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
