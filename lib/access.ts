import { prisma } from "@/lib/prisma";

const GRACE_DAYS = 7;
const PRICE_PER_PROPERTY = 75;

export type AccessState = "TRIAL" | "GRACE" | "LOCKED" | "ACTIVE";

export function computeAccessState(user: {
  subscriptionStatus: "TRIAL" | "ACTIVE" | "PASSIVE" | "DANISMAN";
  trialEndsAt: Date;
}): { state: AccessState; trialDaysLeft: number; graceDaysLeft: number; graceEndsAt: Date } {
  const trialEnd = new Date(user.trialEndsAt);
  const graceEnd = new Date(trialEnd);
  graceEnd.setDate(graceEnd.getDate() + GRACE_DAYS);

  if (user.subscriptionStatus === "PASSIVE") {
    return { state: "LOCKED", trialDaysLeft: 0, graceDaysLeft: 0, graceEndsAt: graceEnd };
  }
  if (user.subscriptionStatus === "ACTIVE" || user.subscriptionStatus === "DANISMAN") {
    return { state: "ACTIVE", trialDaysLeft: 0, graceDaysLeft: 0, graceEndsAt: graceEnd };
  }

  const now = new Date();
  if (now <= trialEnd) {
    const trialDaysLeft = Math.max(1, Math.ceil((trialEnd.getTime() - now.getTime()) / 86400000));
    return { state: "TRIAL", trialDaysLeft, graceDaysLeft: 0, graceEndsAt: graceEnd };
  }
  if (now <= graceEnd) {
    const graceDaysLeft = Math.max(1, Math.ceil((graceEnd.getTime() - now.getTime()) / 86400000));
    return { state: "GRACE", trialDaysLeft: 0, graceDaysLeft, graceEndsAt: graceEnd };
  }
  return { state: "LOCKED", trialDaysLeft: 0, graceDaysLeft: 0, graceEndsAt: graceEnd };
}

export async function getAccessStateForUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { subscriptionStatus: true, trialEndsAt: true },
  });
  if (!user) return null;
  return computeAccessState(user);
}

const LOCKED_MESSAGE =
  "Deneme ve ek süreniz sona erdi. Bu işlemi yapabilmek için Mizan Pro'ya geçmeniz gerekiyor.";
const EMAIL_NOT_VERIFIED_MESSAGE =
  "Deneme süreniz sona erdi. Devam edebilmek için önce e-posta adresinizi onaylamanız gerekiyor. Ayarlar sayfasından onay maili tekrar gönderebilirsiniz.";

export async function requireWriteAccess(userId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const access = await getAccessStateForUser(userId);
  if (!access) return { ok: false, error: "Kullanıcı bulunamadı." };
  if (access.state === "LOCKED") {
    return { ok: false, error: LOCKED_MESSAGE };
  }
  // Deneme süresi boyunca serbest; deneme bitip ek süreye/aktif plana geçilince
  // e-posta adresinin onaylanmış olması şart koşulur.
  if (access.state !== "TRIAL") {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { emailVerifiedAt: true },
    });
    if (!user?.emailVerifiedAt) {
      return { ok: false, error: EMAIL_NOT_VERIFIED_MESSAGE };
    }
  }
  return { ok: true };
}

export async function checkPropertyLimit(userId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { subscriptionStatus: true },
  });
  if (user?.subscriptionStatus !== "ACTIVE") return { ok: true };

  const sub = await prisma.subscription.findUnique({ where: { userId } });
  if (!sub || !sub.propertyCount) return { ok: true };

  const count = await prisma.property.count({ where: { ownerId: userId } });
  if (count >= sub.propertyCount) {
    return {
      ok: false,
      error: `Mizan Pro planınızda ${sub.propertyCount} mülk hakkınız bulunuyor ve bu hakkı kullandınız. Daha fazla mülk eklemek için Mizan Pro sayfasından planınızı yükseltin.`,
    };
  }
  return { ok: true };
}

export function calculatePlanPrice(propertyCount: number) {
  return propertyCount * PRICE_PER_PROPERTY;
}

export { PRICE_PER_PROPERTY };
