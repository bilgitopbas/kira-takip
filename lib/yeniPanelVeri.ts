// Yeni panelin sunucu tarafı veri toplama işlevi.
//
// YETKİ: Bu dosyadaki her sorgu yalnız `ownerId` ile süzülür. `ownerId`
// çağıran tarafından oturumdan (session.userId) verilmelidir — ekip üyesi
// oturumunda da bu değer hesap sahibinin kimliğidir, yani klasik panelle
// birebir aynı veri kapsamı. Yeni panel hiçbir yerde ek erişim açmaz.
//
// Hesaplamalar klasik panelin (app/dashboard/page.tsx) yöntemiyle aynıdır;
// iki panel aynı rakamları göstermelidir.
import { prisma } from "@/lib/prisma";
import { PROPERTY_TYPE_LABELS } from "@/lib/excelImport";
import { ilCoz } from "@/lib/iller";
import { aylikToplam, birikimliSeri, yilIciBirikimli } from "@/lib/aylikSeri";
import type { PanelOzeti } from "@/lib/yeniPanelTipleri";

const BELIRTILMEMIS = "Belirtilmemiş";

export async function panelOzetiGetir(ownerId: string): Promise<PanelOzeti> {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const yearStart = new Date(now.getFullYear(), 0, 1);

  const [
    mulkSayisi,
    doluSayisi,
    tipGruplari,
    ilGruplari,
    kiraciSayisi,
    buAy,
    buYil,
    buAyBorclari,
    gecikmisBorclar,
  ] = await Promise.all([
    prisma.property.count({ where: { ownerId } }),
    prisma.property.count({ where: { ownerId, isOccupied: true } }),
    prisma.property.groupBy({
      by: ["propertyType"],
      where: { ownerId },
      _count: { _all: true },
    }),
    prisma.property.groupBy({
      by: ["city"],
      where: { ownerId },
      _count: { _all: true },
    }),
    prisma.tenant.count({ where: { property: { ownerId } } }),
    prisma.payment.aggregate({
      where: { tenant: { property: { ownerId } }, paidAt: { gte: monthStart, lt: monthEnd } },
      _sum: { amount: true },
    }),
    prisma.payment.aggregate({
      where: { tenant: { property: { ownerId } }, paidAt: { gte: yearStart, lt: monthEnd } },
      _sum: { amount: true },
    }),
    prisma.debt.findMany({
      where: { tenant: { property: { ownerId } }, dueDate: { gte: monthStart, lt: monthEnd } },
      select: { amount: true },
    }),
    prisma.debt.findMany({
      where: { tenant: { property: { ownerId } }, status: { not: "PAID" }, dueDate: { lt: now } },
      select: {
        id: true,
        year: true,
        month: true,
        amount: true,
        payments: { select: { amount: true } },
        tenant: { select: { id: true, fullName: true, property: { select: { title: true } } } },
      },
      orderBy: { dueDate: "asc" },
    }),
  ]);

  // KPI eğrileri: son 8 ay (mülk/kiracı birikimli, aylık tahsilat) ve yıl içi gelir
  const sekizAyOnce = new Date(now.getFullYear(), now.getMonth() - 7, 1);
  const [mulkTarihleri, kiraciTarihleri, sonOdemeler] = await Promise.all([
    prisma.property.findMany({ where: { ownerId }, select: { createdAt: true } }),
    prisma.tenant.findMany({ where: { property: { ownerId } }, select: { createdAt: true } }),
    prisma.payment.findMany({
      where: { tenant: { property: { ownerId } }, paidAt: { gte: sekizAyOnce < yearStart ? sekizAyOnce : yearStart, lt: monthEnd } },
      select: { amount: true, paidAt: true },
    }),
  ]);
  const odemeler = sonOdemeler.map((p) => ({ tarih: p.paidAt, tutar: Number(p.amount) }));
  const mulkBuYil = mulkTarihleri.filter((m) => m.createdAt >= yearStart).length;

  const buAyTahsilat = buAy._sum.amount ? Number(buAy._sum.amount) : 0;
  const buAyBorc = buAyBorclari.reduce((t, d) => t + Number(d.amount), 0);

  const gecikenler = gecikmisBorclar.map((d) => {
    const odenen = d.payments.reduce((t, p) => t + Number(p.amount), 0);
    return {
      id: d.id,
      tenantId: d.tenant.id,
      tenantName: d.tenant.fullName,
      propertyTitle: d.tenant.property.title,
      year: d.year,
      month: d.month,
      remaining: Math.max(0, Number(d.amount) - odenen),
    };
  });

  const mulkTipleri = tipGruplari
    .map((g) => ({
      label: g.propertyType ? PROPERTY_TYPE_LABELS[g.propertyType] ?? g.propertyType : BELIRTILMEMIS,
      value: g._count._all,
    }))
    .sort((a, b) => {
      if (a.label === BELIRTILMEMIS) return 1;
      if (b.label === BELIRTILMEMIS) return -1;
      return b.value - a.value;
    });

  // Serbest il metni 81 ile eşlenir ("Konya", "KONYA ", "konya" → Konya).
  // Kayıt değiştirilmez; boş ya da eşleşmeyen il "ilsiz" sayılır.
  const ilSayaci = new Map<string, number>();
  let ilsizMulkSayisi = 0;
  for (const g of ilGruplari) {
    const il = ilCoz(g.city);
    if (il) ilSayaci.set(il, (ilSayaci.get(il) ?? 0) + g._count._all);
    else ilsizMulkSayisi += g._count._all;
  }
  const iller = [...ilSayaci.entries()]
    .map(([il, mulkSayisi]) => ({ il, mulkSayisi }))
    .sort((a, b) => b.mulkSayisi - a.mulkSayisi || a.il.localeCompare(b.il, "tr"));

  return {
    mulkSayisi,
    doluSayisi,
    bosSayisi: mulkSayisi - doluSayisi,
    kiraciSayisi,
    buAyTahsilat,
    buYilTahsilat: buYil._sum.amount ? Number(buYil._sum.amount) : 0,
    tahsilatOrani: buAyBorc > 0 ? Math.min(100, Math.round((buAyTahsilat / buAyBorc) * 100)) : null,
    buAyBeklenen: buAyBorc,
    mulkBuYil,
    seriler: {
      mulk: birikimliSeri(mulkTarihleri.map((m) => m.createdAt), now),
      kiraci: birikimliSeri(kiraciTarihleri.map((k) => k.createdAt), now),
      tahsilat: aylikToplam(odemeler, now),
      gelir: yilIciBirikimli(odemeler, now),
    },
    gecikmisSayisi: gecikenler.length,
    gecikmisTutar: gecikenler.reduce((t, g) => t + g.remaining, 0),
    gecikenler,
    mulkTipleri,
    iller,
    ilsizMulkSayisi,
  };
}
