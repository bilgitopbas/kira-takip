import { prisma } from "@/lib/prisma";
import { sonDuyurular } from "@/lib/adminIslemleri";
import AnnouncementsClient from "./AnnouncementsClient";

// Genel duyuru yönetimi (admin yetkisi üst layout'ta doğrulanır)
export default async function DuyurularPage() {
  const [announcements, users] = await Promise.all([
    sonDuyurular(),
    prisma.user.findMany({
      select: { id: true, fullName: true, email: true },
      orderBy: { fullName: "asc" },
    }),
  ]);

  return <AnnouncementsClient announcements={announcements} users={users} />;
}
