import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AdminShell from "@/components/AdminShell";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

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
    <AdminShell fullName={admin?.fullName || "Yönetici"} userId={session.userId}>
      {children}
    </AdminShell>
  );
}
