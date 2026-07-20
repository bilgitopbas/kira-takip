import { prisma } from "@/lib/prisma";
import AnnouncementsClient from "./AnnouncementsClient";

// Genel duyuru yönetimi (admin yetkisi üst layout'ta doğrulanır)
export default async function DuyurularPage() {
  const [announcements, users] = await Promise.all([
    prisma.announcement.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { sender: { select: { fullName: true } } },
    }),
    prisma.user.findMany({
      select: { id: true, fullName: true, email: true },
      orderBy: { fullName: "asc" },
    }),
  ]);

  return <AnnouncementsClient announcements={announcements} users={users} />;
}
