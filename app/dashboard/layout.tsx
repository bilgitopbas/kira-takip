import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import DashboardShell from "@/components/DashboardShell";
import { generateNotificationsForOwner } from "@/lib/notifications";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  try {
    await generateNotificationsForOwner(session.userId);
  } catch {
    // bildirim üretimi sayfayı bloklamamalı
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { fullName: true },
  });

  return (
    <DashboardShell fullName={user?.fullName || ""} impersonating={!!session.impersonatedBy}>
      {children}
    </DashboardShell>
  );
}
