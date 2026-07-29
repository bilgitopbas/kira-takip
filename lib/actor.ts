import { prisma } from "@/lib/prisma";

type SessionLike = {
  userId: string;
  memberEmail?: string;
  memberName?: string;
};

// Aynı hesabı hesap sahibi ve davet edilen ekip üyeleri birlikte kullanıyor.
// Oturum her zaman hesap sahibinin userId'siyle açıldığı için, işlemi fiilen
// yapan kişiyi belirlemek üzere önce oturumdaki üye bilgisine bakılır.
export async function getActor(session: SessionLike) {
  if (session.memberEmail) {
    return { email: session.memberEmail, name: session.memberName ?? null };
  }
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { email: true, fullName: true },
  });
  return { email: user?.email ?? "bilinmiyor", name: user?.fullName ?? null };
}
