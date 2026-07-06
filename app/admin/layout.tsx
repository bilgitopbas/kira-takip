import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import AdminSidebar from "@/components/AdminSidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session || session.role !== "ADMIN") {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-[#F8F9FB] flex">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-8 flex-shrink-0">
          <div />
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#17B6AE]/10 flex items-center justify-center">
              <span className="text-[#17B6AE] text-xs font-bold">A</span>
            </div>
            <span className="text-sm font-medium text-slate-700">Admin</span>
          </div>
        </header>
        <main className="flex-1 p-8 overflow-auto">{children}</main>
      </div>
    </div>
  );
}