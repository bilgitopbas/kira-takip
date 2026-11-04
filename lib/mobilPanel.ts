// Mobil panelin okuma sorguları.
//
// YETKİ: Her sorgu yalnız `ownerId` ile süzülür; değer oturumdan (session.userId)
// gelir, ekip üyesinde hesap sahibinin kimliğidir. Web paneliyle aynı kapsam.
// VERİ AZALTMA: dar `select`; para alanları sayıya çevrilir.
import { Prisma } from "@/app/generated/prisma";
import { prisma } from "@/lib/prisma";
import { computeAccessState } from "@/lib/access";
import { getFiveYearDate, toDateKey } from "@/lib/calendarEvents";
import { getEffectiveDebtStatus, getTotalPaid } from "@/lib/debtStatus";
import { toplamBorclar, toplamFarkBorc } from "@/lib/kiraciBorcu";
import { abonelikBilgisi, sayiya, tarihAraligi } from "@/lib/mobilBicim";
import { besYilListesi } from "@/lib/mobilPanelModeli";
import { panelBirimleriGetir } from "@/lib/yeniPanelBirimleri";
import { panelOzetiGetir } from "@/lib/yeniPanelVeri";

const SON_MASRAF_ADEDI = 10;

type Sayfa = { skip: number; take: number };
type Aralik = { bas: Date | null; bit: Date | null };

export async function ozetGetir(ownerId: string) {
  const simdi = new Date();
  const [ozet, { bugun }, sahip, okunmamisBildirim, kiracilar] = await Promise.all([
    panelOzetiGetir(ownerId),
    panelBirimleriGetir(ownerId, simdi),
    prisma.user.findUniqueOrThrow({
      where: { id: ownerId },
      select: { subscriptionStatus: true, trialEndsAt: true, emailVerifiedAt: true },
    }),
    prisma.notification.count({ where: { userId: ownerId, isRead: false } }),
    prisma.tenant.findMany({
      where: { property: { ownerId }, occupancyStatus: "LIVING", contractStart: { not: null } },
      select: { id: true, fullName: true, contractStart: true, propertyId: true, property: { select: { title: true } } },
    }),
  ]);
  const besYil = besYilListesi(
    kiracilar.map((k) => ({ ...k, propertyTitle: k.property.title })),
    simdi
  );
  return {
    ozet,
    bugun: { ...bugun, besYil },
    abonelik: abonelikBilgisi(sahip, computeAccessState(sahip)),
    okunmamisBildirim,
  };
}

export async function mulkDetayiGetir(ownerId: string, id: string) {
  const mulk = await prisma.property.findFirst({
    where: { id, ownerId },
    select: {
      id: true,
      title: true,
      address: true,
      city: true,
      district: true,
      squareMeters: true,
      propertyType: true,
      notes: true,
      isOccupied: true,
      buildingId: true,
      block: true,
      unitNo: true,
      createdAt: true,
    },
  });
  if (!mulk) return null;

  const [{ birimler }, kiracilar, masrafToplami, sonMasraflar] = await Promise.all([
    panelBirimleriGetir(ownerId),
    prisma.tenant.findMany({
      // Bağlı mülkten gelen kiracının birincil mülkü de aynı sahibin olmalı
      where: { property: { ownerId }, OR: [{ propertyId: id }, { otherProperties: { some: { propertyId: id } } }] },
      select: {
        id: true,
        fullName: true,
        occupancyStatus: true,
        propertyId: true,
        monthlyRent: true,
        contractStart: true,
        contractEnd: true,
        rating: true,
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.expense.aggregate({ where: { propertyId: id }, _sum: { amount: true } }),
    prisma.expense.findMany({
      where: { propertyId: id },
      select: {
        id: true,
        description: true,
        amount: true,
        date: true,
        notes: true,
        tenantId: true,
        tenant: { select: { fullName: true } },
      },
      orderBy: { date: "desc" },
      take: SON_MASRAF_ADEDI,
    }),
  ]);
  const borclar = await toplamBorclar(prisma, kiracilar.map((k) => k.id));

  return {
    ...mulk,
    birim: birimler.find((b) => b.id === id) ?? null,
    kiracilar: kiracilar.map(({ propertyId, monthlyRent, ...k }) => ({
      ...k,
      birincil: propertyId === id,
      monthlyRent: sayiya(monthlyRent),
      toplamBorc: borclar.get(k.id) ?? 0,
    })),
    masraflar: {
      toplam: sayiya(masrafToplami._sum.amount) ?? 0,
      son: sonMasraflar.map(({ tenant, amount, ...m }) => ({
        ...m,
        amount: Number(amount),
        tenantName: tenant?.fullName ?? null,
      })),
    },
  };
}

const KIRACI_SIRALAMA = new Map<string, Prisma.TenantOrderByWithRelationInput>([
  ["newest", { createdAt: "desc" }],
  ["rent_asc", { monthlyRent: "asc" }],
  ["rent_desc", { monthlyRent: "desc" }],
  ["contract_asc", { contractStart: "asc" }],
  ["contract_desc", { contractStart: "desc" }],
]);

export async function kiracilariGetir(
  ownerId: string,
  s: { q: string | null; propertyId: string | null; il: string | null; oturma: string | null; siralama: string | null },
  sayfa: Sayfa
) {
  // il, diğer panel uçlarıyla aynı çözümden: kayıtlı binanın ili, 81 ile eşlenmiş mülk metni
  const ildekiMulkler = s.il
    ? (await panelBirimleriGetir(ownerId)).birimler.filter((b) => b.il === s.il).map((b) => b.id)
    : null;
  const where: Prisma.TenantWhereInput = {
    property: { ownerId, ...(ildekiMulkler ? { id: { in: ildekiMulkler } } : {}) },
    ...(s.q ? { fullName: { contains: s.q, mode: "insensitive" as const } } : {}),
    ...(s.oturma === "LIVING" || s.oturma === "VACATED" ? { occupancyStatus: s.oturma } : {}),
    ...(s.propertyId
      ? { OR: [{ propertyId: s.propertyId }, { otherProperties: { some: { propertyId: s.propertyId } } }] }
      : {}),
  };
  const [kiracilar, toplam] = await Promise.all([
    prisma.tenant.findMany({
      where,
      select: {
        id: true,
        fullName: true,
        monthlyRent: true,
        contractStart: true,
        contractEnd: true,
        rating: true,
        rentPaymentDate: true,
        occupancyStatus: true,
        property: { select: { id: true, title: true } },
        otherProperties: { select: { property: { select: { id: true, title: true } } } },
      },
      orderBy: [KIRACI_SIRALAMA.get(s.siralama ?? "") ?? { createdAt: "desc" }, { id: "asc" }],
      skip: sayfa.skip,
      take: sayfa.take,
    }),
    prisma.tenant.count({ where }),
  ]);
  const borclar = await toplamBorclar(prisma, kiracilar.map((k) => k.id));
  return {
    kayitlar: kiracilar.map(({ property, otherProperties, monthlyRent, ...k }) => ({
      ...k,
      monthlyRent: sayiya(monthlyRent),
      toplamBorc: borclar.get(k.id) ?? 0,
      mulk: property,
      digerMulkler: otherProperties.map((o) => o.property),
    })),
    toplam,
  };
}

export async function kiraciDetayiGetir(ownerId: string, id: string) {
  const t = await prisma.tenant.findFirst({
    where: { id, property: { ownerId } },
    select: {
      id: true,
      fullName: true,
      phone: true,
      email: true,
      tenantType: true,
      nationalId: true,
      taxNumber: true,
      notificationAddress: true,
      notes: true,
      rating: true,
      occupancyStatus: true,
      createdAt: true,
      monthlyRent: true,
      contractStart: true,
      contractEnd: true,
      contractDurationMonths: true,
      rentRevisionDate: true,
      rentPaymentDate: true,
      paymentFrequency: true,
      increaseType: true,
      increaseRate: true,
      depositAmount: true,
      depositCurrency: true,
      contractNotes: true,
      contractFileUrl: true,
      contractFileName: true,
      property: { select: { id: true, title: true, address: true, city: true } },
      otherProperties: { select: { property: { select: { id: true, title: true } } } },
      debts: {
        select: {
          id: true,
          year: true,
          month: true,
          amount: true,
          dueDate: true,
          periodMonths: true,
          billingGroupId: true,
          payments: {
            select: { id: true, amount: true, paidAt: true, method: true, notes: true, receiptFileUrl: true },
            orderBy: { paidAt: "asc" },
          },
        },
        orderBy: { dueDate: "asc" },
      },
      expenses: {
        select: { id: true, description: true, amount: true, date: true, notes: true },
        orderBy: { date: "desc" },
      },
      tenantNotes: {
        select: { id: true, content: true, authorEmail: true, authorName: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!t) return null;

  return {
    id: t.id,
    fullName: t.fullName,
    phone: t.phone,
    email: t.email,
    tenantType: t.tenantType,
    nationalId: t.nationalId,
    taxNumber: t.taxNumber,
    notificationAddress: t.notificationAddress,
    notes: t.notes,
    rating: t.rating,
    occupancyStatus: t.occupancyStatus,
    createdAt: t.createdAt,
    mulk: t.property,
    digerMulkler: t.otherProperties.map((o) => o.property),
    sozlesme: {
      monthlyRent: sayiya(t.monthlyRent),
      contractStart: t.contractStart,
      contractEnd: t.contractEnd,
      contractDurationMonths: t.contractDurationMonths,
      rentRevisionDate: t.rentRevisionDate,
      rentPaymentDate: t.rentPaymentDate,
      paymentFrequency: t.paymentFrequency,
      increaseType: t.increaseType,
      increaseRate: sayiya(t.increaseRate),
      depositAmount: sayiya(t.depositAmount),
      depositCurrency: t.depositCurrency,
      contractNotes: t.contractNotes,
      besYilTarihi: t.contractStart ? toDateKey(getFiveYearDate(new Date(t.contractStart))) : null,
      // Diskteki dosya adı açığa çıkmaz; indirme yetkili uçtan
      dosya: t.contractFileUrl
        ? { ad: t.contractFileName ?? "Sözleşme", yol: `/api/dashboard/tenants/${t.id}/contract` }
        : null,
    },
    toplamBorc: toplamFarkBorc(t.debts),
    borclar: t.debts.map(({ payments, amount, ...d }) => {
      const odenen = getTotalPaid(payments);
      return {
        ...d,
        amount: Number(amount),
        durum: getEffectiveDebtStatus({ amount, dueDate: d.dueDate, payments }),
        odenen,
        kalan: Math.max(0, Number(amount) - odenen),
        tahsilatlar: payments.map(({ receiptFileUrl, amount: tutar, ...p }) => ({
          ...p,
          amount: Number(tutar),
          hasReceipt: !!receiptFileUrl,
        })),
      };
    }),
    masraflar: t.expenses.map(({ amount, ...m }) => ({ ...m, amount: Number(amount) })),
    notlar: t.tenantNotes,
  };
}

export async function tahsilatlariGetir(
  ownerId: string,
  s: Aralik & { tenantId: string | null; q: string | null },
  sayfa: Sayfa
) {
  const where: Prisma.PaymentWhereInput = {
    tenant: { property: { ownerId }, ...(s.q ? { fullName: { contains: s.q, mode: "insensitive" as const } } : {}) },
    ...(s.tenantId ? { tenantId: s.tenantId } : {}),
    ...(tarihAraligi(s.bas, s.bit) ? { paidAt: tarihAraligi(s.bas, s.bit) } : {}),
  };
  const [odemeler, toplam, topla] = await Promise.all([
    prisma.payment.findMany({
      where,
      select: {
        id: true,
        amount: true,
        paidAt: true,
        method: true,
        notes: true,
        receiptFileUrl: true,
        debtId: true,
        tenantId: true,
        tenant: { select: { fullName: true, property: { select: { title: true } } } },
        debt: { select: { year: true, month: true } },
      },
      orderBy: [{ paidAt: "desc" }, { id: "asc" }],
      skip: sayfa.skip,
      take: sayfa.take,
    }),
    prisma.payment.count({ where }),
    prisma.payment.aggregate({ where, _sum: { amount: true } }),
  ]);
  return {
    kayitlar: odemeler.map(({ receiptFileUrl, tenant, debt, amount, ...p }) => ({
      ...p,
      amount: Number(amount),
      hasReceipt: !!receiptFileUrl,
      tenantName: tenant.fullName,
      propertyTitle: tenant.property.title,
      donem: debt,
    })),
    toplam,
    toplamTutar: sayiya(topla._sum.amount) ?? 0,
  };
}

export async function masraflariGetir(
  ownerId: string,
  s: Aralik & { propertyId: string | null; tenantId: string | null },
  sayfa: Sayfa
) {
  const where: Prisma.ExpenseWhereInput = {
    property: { ownerId },
    ...(s.propertyId ? { propertyId: s.propertyId } : {}),
    ...(s.tenantId ? { tenantId: s.tenantId } : {}),
    ...(tarihAraligi(s.bas, s.bit) ? { date: tarihAraligi(s.bas, s.bit) } : {}),
  };
  const [masraflar, toplam, topla] = await Promise.all([
    prisma.expense.findMany({
      where,
      select: {
        id: true,
        description: true,
        amount: true,
        date: true,
        notes: true,
        propertyId: true,
        tenantId: true,
        property: { select: { title: true } },
        tenant: { select: { fullName: true } },
      },
      orderBy: [{ date: "desc" }, { id: "asc" }],
      skip: sayfa.skip,
      take: sayfa.take,
    }),
    prisma.expense.count({ where }),
    prisma.expense.aggregate({ where, _sum: { amount: true } }),
  ]);
  return {
    kayitlar: masraflar.map(({ property, tenant, amount, ...m }) => ({
      ...m,
      amount: Number(amount),
      propertyTitle: property.title,
      tenantName: tenant?.fullName ?? null,
    })),
    toplam,
    toplamTutar: sayiya(topla._sum.amount) ?? 0,
  };
}

export async function bildirimleriGetir(ownerId: string, yalnizOkunmamis: boolean, sayfa: Sayfa) {
  const where = { userId: ownerId, ...(yalnizOkunmamis ? { isRead: false } : {}) };
  const [kayitlar, toplam, okunmamis] = await Promise.all([
    prisma.notification.findMany({
      where,
      select: { id: true, type: true, title: true, message: true, link: true, isRead: true, createdAt: true },
      orderBy: [{ createdAt: "desc" }, { id: "asc" }],
      skip: sayfa.skip,
      take: sayfa.take,
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { userId: ownerId, isRead: false } }),
  ]);
  return { kayitlar, toplam, okunmamis };
}

/** il yoksa "*" (tüm iller); tablo kurulmadıysa düzen yok sayılır */
export async function sehirDuzeniGetir(ownerId: string, il: string) {
  try {
    const satir = await prisma.cityLayout.findUnique({
      where: { ownerId_il: { ownerId, il } },
      select: { cells: true },
    });
    return satir?.cells ?? null;
  } catch (err) {
    if ((err as { code?: string })?.code === "P2021") return null;
    throw err;
  }
}
