import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import DashboardShell from "@/components/DashboardShell";
import { uyePushKimligi } from "@/lib/pushHedef";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  // Bildirim üretimi artık burada DEĞİL, günlük zamanlanmış görevde
  // (/api/cron/bildirimler). Eskiden her panel isteğinde çalışıyordu; bu hem
  // her sayfa açılışını yavaşlatıyordu hem de panele girmeyen kullanıcıya
  // bildirim hiç ulaşmıyordu.
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { fullName: true },
  });

  return (
    <DashboardShell
      fullName={user?.fullName || ""}
      // Davetli üye kendi kimliğiyle kaydolur; hesap sahibiyle aynı kimliği
      // paylaşan iki cihazda push güvenilir dağıtılmıyordu.
      pushId={session.memberId ? uyePushKimligi(session.memberId) : session.userId}
      impersonating={!!session.impersonatedBy}
    >
      {children}
    </DashboardShell>
  );
}
