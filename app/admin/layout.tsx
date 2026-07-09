import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AdminSidebar from "@/components/AdminSidebar";
import DashboardHeader from "@/components/DashboardHeader";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session || session.role !== "ADMIN") {
    redirect("/login");
  }

  const admin = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { fullName: true },
  });

  return (
    <div className="min-h-screen bg-[#F8F9FB] dark:bg-slate-950 flex transition-colors">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader fullName={admin?.fullName || "Yönetici"} />
        <main className="flex-1 p-8 overflow-auto">{children}</main>
      </div>
    </div>
  );
}