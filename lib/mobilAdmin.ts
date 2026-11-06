// Mobil yönetim panelinin okuma sorguları ve yanıt biçimleri. İş mantığı ve web'le ortak
// sorgular lib/adminIslemleri.ts'te; yetki /api/mobil/admin/* uçlarında (adminKapisi).
// VERİ AZALTMA: dar `select`; para alanları sayıya çevrilir.
import type { Prisma } from "@/app/generated/prisma";
import { prisma } from "@/lib/prisma";
import { adminIstatistikleri, odemeBildirimleriniGetir, sonDuyurular } from "@/lib/adminIslemleri";
import type { OdemeDurumu } from "@/lib/mobilAdminBicim";
import { PAKETLER, type Paket } from "@/lib/paketler";
import { sayiya } from "@/lib/mobilBicim";

const GUN_MS = 86400000;

type Sayfa = { skip: number; take: number };

export async function adminOzetiGetir(adminId: string) {
  const simdi = new Date();
  const once = (gun: number) => new Date(simdi.getTime() - gun * GUN_MS);
  const [ist, yeniKayit7g, yeniKayit30g, denemesiBitecek7g, bekleyenOdemeBildirimi, acikDestek, okunmamisBildirim] =
    await Promise.all([
      adminIstatistikleri(),
      prisma.user.count({ where: { role: "CUSTOMER", createdAt: { gte: once(7) } } }),
      prisma.user.count({ where: { role: "CUSTOMER", createdAt: { gte: once(30) } } }),
      prisma.user.count({
        where: {
          role: "CUSTOMER",
          subscriptionStatus: "TRIAL",
          trialEndsAt: { gte: simdi, lte: new Date(simdi.getTime() + 7 * GUN_MS) },
        },
      }),
      prisma.paymentNotice.count({ where: { status: "PENDING" } }),
      prisma.supportTicket.count({ where: { status: "OPEN" } }),
      prisma.notification.count({ where: { userId: adminId, isRead: false } }),
    ]);

  return {
    sayilar: {
      kullanici: ist.userCount,
      mulk: ist.propertyCount,
      kiraci: ist.tenantCount,
      kaybedilenDeneme30g: ist.churnedTrialCount,
      yeniKayit7g,
      yeniKayit30g,
      denemesiBitecek7g,
    },
    paketler: ist.tierCounts,
    bekleyenOdemeBildirimi,
    acikDestek,
    okunmamisBildirim,
    sonKullanicilar: ist.recentUsers.map((u) => ({
      id: u.id,
      ad: u.fullName,
      email: u.email,
      paket: u.subscriptionStatus,
      kayitTarihi: u.createdAt,
    })),
  };
}

// --- Kullanıcılar (yalnız CUSTOMER) ---

const KULLANICI_SECIMI = {
  id: true,
  fullName: true,
  email: true,
  city: true,
  phone: true,
  wantsManagement: true,
  subscriptionStatus: true,
  trialEndsAt: true,
  createdAt: true,
  _count: { select: { properties: true } },
} as const;

type KullaniciKaydi = Prisma.UserGetPayload<{ select: typeof KULLANICI_SECIMI }>;

// mulkLimiti web /api/admin/customers ile aynı: abonelik yoksa ya da 0 ise null
function kullaniciSatiri(u: KullaniciKaydi, propertyCount: number | undefined) {
  return {
    id: u.id,
    ad: u.fullName,
    email: u.email,
    il: u.city,
    telefon: u.phone,
    paket: u.subscriptionStatus,
    yonetimIstiyor: u.wantsManagement,
    denemeBitis: u.trialEndsAt,
    kayitTarihi: u.createdAt,
    mulkLimiti: propertyCount || null,
    mulkSayisi: u._count.properties,
  };
}

async function limitler(ids: string[]) {
  const abonelikler = await prisma.subscription.findMany({
    where: { userId: { in: ids } },
    select: { userId: true, propertyCount: true },
  });
  return new Map(abonelikler.map((a) => [a.userId, a.propertyCount]));
}

/** sayac paket süzgecini değil, yalnız aramayı uygular (sekme rozetleri için) */
export async function kullanicilariGetir(s: { q: string | null; paket: Paket | null }, sayfa: Sayfa) {
  const metin = (alan: "fullName" | "email" | "city") => ({ [alan]: { contains: s.q!, mode: "insensitive" as const } });
  const taban: Prisma.UserWhereInput = {
    role: "CUSTOMER",
    ...(s.q ? { OR: [metin("fullName"), metin("email"), metin("city")] } : {}),
  };
  const where: Prisma.UserWhereInput = s.paket ? { ...taban, subscriptionStatus: s.paket } : taban;

  const [kullanicilar, toplam, gruplar] = await Promise.all([
    prisma.user.findMany({
      where,
      select: KULLANICI_SECIMI,
      orderBy: [{ createdAt: "desc" }, { id: "asc" }],
      skip: sayfa.skip,
      take: sayfa.take,
    }),
    prisma.user.count({ where }),
    prisma.user.groupBy({ by: ["subscriptionStatus"], where: taban, _count: { _all: true } }),
  ]);
  const limit = await limitler(kullanicilar.map((u) => u.id));
  const sayac = Object.fromEntries(
    PAKETLER.map((p) => [p, gruplar.find((g) => g.subscriptionStatus === p)?._count._all ?? 0])
  ) as Record<Paket, number>;

  return { kayitlar: kullanicilar.map((u) => kullaniciSatiri(u, limit.get(u.id))), toplam, sayac };
}

export async function kullaniciGetir(id: string) {
  const u = await prisma.user.findFirst({ where: { id, role: "CUSTOMER" }, select: KULLANICI_SECIMI });
  if (!u) return null;
  return kullaniciSatiri(u, (await limitler([u.id])).get(u.id));
}

export async function musteriMi(id: string) {
  return Boolean(await prisma.user.findFirst({ where: { id, role: "CUSTOMER" }, select: { id: true } }));
}

// --- Ödeme bildirimleri ---

type OdemeKaydi = Awaited<ReturnType<typeof odemeBildirimleriniGetir>>[number];

function odemeSatiri(b: OdemeKaydi) {
  return {
    id: b.id,
    referansKodu: b.referenceCode,
    mulkSayisi: b.propertyCount,
    ay: b.months,
    tutar: sayiya(b.amount),
    not: b.note,
    durum: b.status,
    incelemeNotu: b.reviewNote,
    tarih: b.createdAt,
    ad: b.user.fullName,
    email: b.user.email,
    telefon: b.user.phone,
  };
}

export async function odemeBildirimleriGetir(durum: OdemeDurumu | null) {
  return (await odemeBildirimleriniGetir(durum ?? undefined)).map(odemeSatiri);
}

export async function odemeBildirimiGetir(id: string) {
  const b = await prisma.paymentNotice.findUnique({
    where: { id },
    include: { user: { select: { fullName: true, email: true, phone: true } } },
  });
  return b ? odemeSatiri(b) : null;
}

// --- Duyurular ---

type DuyuruKaydi = {
  id: string;
  title: string;
  subtitle: string | null;
  message: string;
  targetId: string | null;
  targetName: string | null;
  createdAt: Date;
};

function duyuruSatiri(d: DuyuruKaydi, gonderen: string | null) {
  return {
    id: d.id,
    baslik: d.title,
    altBaslik: d.subtitle,
    mesaj: d.message,
    hedef: d.targetId ? { id: d.targetId, ad: d.targetName } : null,
    gonderen,
    tarih: d.createdAt,
  };
}

export async function duyurulariGetir() {
  return (await sonDuyurular()).map((d) => duyuruSatiri(d, d.sender.fullName));
}

export async function duyuruGetir(id: string) {
  const d = await prisma.announcement.findUniqueOrThrow({
    where: { id },
    include: { sender: { select: { fullName: true } } },
  });
  return duyuruSatiri(d, d.sender.fullName);
}

/** Silinecek kayıt yoksa false */
export async function duyuruSil(id: string) {
  const { count } = await prisma.announcement.deleteMany({ where: { id } });
  return count > 0;
}
