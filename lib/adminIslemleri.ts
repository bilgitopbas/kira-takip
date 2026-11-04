import type { PaymentNoticeStatus } from "@/app/generated/prisma";
import { prisma } from "@/lib/prisma";
import type { Paket } from "@/lib/paketler";
import { calculatePlanPrice } from "@/lib/access";
import { hesabaPush, herkesePush, pushCihazSayisi } from "@/lib/push";

// Yönetim paneli iş mantığı: web (/admin, /api/admin/*) ve mobil (/api/mobil/admin/*)
// aynı işlevleri kullanır. Yetki denetimi çağıranındır.

const GUN_MS = 86400000;

// Kontrol paneli kartları (web /admin ile aynı sorgular)
export async function adminIstatistikleri() {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * GUN_MS);

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

// --- Müşteri ayarları (web customers/[id]/status|management|subscription) ---

export const musteriPaketiDegistir = (id: string, status: Paket) =>
  prisma.user.update({ where: { id }, data: { subscriptionStatus: status } });

export const yonetimTercihiDegistir = (id: string, wantsManagement: boolean) =>
  prisma.user.update({ where: { id }, data: { wantsManagement } });

/** count ≥ 1 olmalı; denetim çağıranda */
export function mulkLimitiBelirle(id: string, count: number) {
  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  return prisma.subscription.upsert({
    where: { userId: id },
    create: {
      userId: id,
      propertyCount: count,
      monthlyPrice: calculatePlanPrice(count),
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
    },
    update: {
      propertyCount: count,
      monthlyPrice: calculatePlanPrice(count),
    },
  });
}

// --- Ödeme bildirimleri ---

// Bekleyenler önce (enum sırası), sonra yeni → eski
export const odemeBildirimleriniGetir = (durum?: PaymentNoticeStatus) =>
  prisma.paymentNotice.findMany({
    where: durum ? { status: durum } : undefined,
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 200,
    include: {
      user: { select: { fullName: true, email: true, phone: true } },
    },
  });

export type OdemeSonucu =
  | { sonuc: "YOK" }
  | { sonuc: "SONUCLANMIS" }
  | { sonuc: "REDDEDILDI" }
  | { sonuc: "ONAYLANDI"; periodEnd: Date };

class ZatenSonuclanmis extends Error {}

/** Onay aboneliği açar ya da uzatır; red yalnız kaydı kapatır. İkisinde de müşteriye bildirim gider. */
export async function odemeBildiriminiSonuclandir(
  id: string,
  action: "confirm" | "reject",
  note: unknown
): Promise<OdemeSonucu> {
  const bildirim = await prisma.paymentNotice.findUnique({ where: { id } });
  if (!bildirim) return { sonuc: "YOK" };
  if (bildirim.status !== "PENDING") return { sonuc: "SONUCLANMIS" };

  const reviewNote = typeof note === "string" ? note.slice(0, 500) : null;

  if (action === "reject") {
    // Koşullu yazım: aynı anda iki onay/red gelirse yalnız biri geçer
    const yazilan = await prisma.paymentNotice.updateMany({
      where: { id, status: "PENDING" },
      data: { status: "REJECTED", reviewedAt: new Date(), reviewNote },
    });
    if (yazilan.count === 0) return { sonuc: "SONUCLANMIS" };
    await bildirimGonder(
      bildirim.userId,
      "Ödeme bildiriminiz onaylanmadı",
      `${bildirim.referenceCode} kodlu ödeme bildiriminiz onaylanamadı.${
        reviewNote ? ` Not: ${reviewNote}` : " Lütfen bizimle iletişime geçin."
      }`,
      `reject:${bildirim.id}`
    );
    return { sonuc: "REDDEDILDI" };
  }

  // Onay: aboneliği aç / uzat
  const simdi = new Date();
  let bitis: Date;
  try {
    bitis = await prisma.$transaction(async (tx) => {
      // Aynı müşterinin iki farklı bildirimi aynı anda onaylanırsa süreler üst üste eklensin
      await tx.$queryRaw`SELECT 1 FROM "users" WHERE "id" = ${bildirim.userId} FOR UPDATE`;
      const yazilan = await tx.paymentNotice.updateMany({
        where: { id, status: "PENDING" },
        data: { status: "CONFIRMED", reviewedAt: simdi, reviewNote },
      });
      if (yazilan.count === 0) throw new ZatenSonuclanmis();

      const mevcut = await tx.subscription.findUnique({ where: { userId: bildirim.userId } });
      // Aboneliği hâlâ sürüyorsa üzerine ekle, bitmişse bugünden başlat
      const baslangic =
        mevcut?.currentPeriodEnd && mevcut.currentPeriodEnd > simdi ? mevcut.currentPeriodEnd : simdi;
      const son = new Date(baslangic);
      son.setMonth(son.getMonth() + bildirim.months);

      await tx.subscription.upsert({
        where: { userId: bildirim.userId },
        create: {
          userId: bildirim.userId,
          propertyCount: bildirim.propertyCount,
          monthlyPrice: calculatePlanPrice(bildirim.propertyCount),
          currentPeriodStart: simdi,
          currentPeriodEnd: son,
        },
        update: {
          propertyCount: bildirim.propertyCount,
          monthlyPrice: calculatePlanPrice(bildirim.propertyCount),
          currentPeriodEnd: son,
        },
      });
      await tx.user.update({
        where: { id: bildirim.userId },
        data: { subscriptionStatus: "ACTIVE" },
      });
      return son;
    });
  } catch (err) {
    if (err instanceof ZatenSonuclanmis) return { sonuc: "SONUCLANMIS" };
    throw err;
  }

  await bildirimGonder(
    bildirim.userId,
    "Ödemeniz onaylandı",
    `Mizan Pro aboneliğiniz ${bitis.toLocaleDateString("tr-TR")} tarihine kadar aktif edildi.`,
    `confirm:${bildirim.id}`
  );

  return { sonuc: "ONAYLANDI", periodEnd: bitis };
}

async function bildirimGonder(userId: string, title: string, message: string, dedupeKey: string) {
  try {
    await prisma.notification.create({
      data: { userId, type: "EFT_PAYMENT_NOTICE", title, message, link: "/dashboard/mizan-pro", dedupeKey },
    });
  } catch (hata) {
    console.error("Musteri bildirimi olusturulamadi:", hata);
  }
}

// --- Duyurular ---

export const sonDuyurular = () =>
  prisma.announcement.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { sender: { select: { fullName: true } } },
  });

type DuyuruGirdisi = {
  title: string;
  subtitle: string | null;
  message: string;
  targetId: string | null;
  senderId: string;
};

/** Alanlar kırpılmış ve boş olmadığı denetlenmiş gelir. targetId yoksa HERKESE. */
export async function duyuruGonder(g: DuyuruGirdisi) {
  let target: { id: string; fullName: string } | null = null;
  if (g.targetId) {
    target = await prisma.user.findUnique({
      where: { id: g.targetId },
      select: { id: true, fullName: true },
    });
    if (!target) return { hata: "HEDEF_YOK" as const };
  }

  const announcement = await prisma.announcement.create({
    data: {
      title: g.title,
      subtitle: g.subtitle,
      message: g.message,
      targetId: target?.id ?? null,
      targetName: target?.fullName ?? null,
      senderId: g.senderId,
    },
  });

  const inAppMessage = g.subtitle ? `${g.subtitle} — ${announcement.message}` : announcement.message;

  let pushRecipients: number | null = null;

  if (target) {
    // Tek kullanıcı: uygulama içi bildirim + kişiye özel push
    await prisma.notification.create({
      data: {
        userId: target.id,
        type: "ANNOUNCEMENT",
        title: `📢 ${announcement.title}`,
        message: inAppMessage,
        dedupeKey: `announcement-${announcement.id}`,
      },
    });
    // Hesap sahibi + davetli üyelerin cihazları
    await hesabaPush(target.id, {
      baslik: announcement.title,
      altBaslik: g.subtitle,
      govde: announcement.message,
      tur: "ANNOUNCEMENT",
    });
    pushRecipients = await pushCihazSayisi(target.id);
  } else {
    // Herkese: tüm kullanıcılara uygulama içi bildirim + genel push
    const users = await prisma.user.findMany({ select: { id: true } });
    if (users.length) {
      await prisma.notification.createMany({
        data: users.map((u) => ({
          userId: u.id,
          type: "ANNOUNCEMENT" as const,
          title: `📢 ${announcement.title}`,
          message: inAppMessage,
          dedupeKey: `announcement-${announcement.id}`,
        })),
        skipDuplicates: true,
      });
    }
    // Beklenmez: on binlerce cihazda yanıt zaman aşımına düşmesin; herkesePush reddolmaz
    void herkesePush({
      baslik: announcement.title,
      altBaslik: g.subtitle,
      govde: announcement.message,
      tur: "ANNOUNCEMENT",
    });
    pushRecipients = await pushCihazSayisi();
  }

  return { announcement, pushRecipients };
}
