import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

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
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-64 bg-white border-r border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-8">Admin Paneli</h2>
        <nav className="space-y-1 text-sm">
          <a
            href="/admin"
            className="block px-3 py-2 rounded-lg text-slate-600 hover:bg-gray-100"
          >
            Müşteriler
          </a>
        </nav>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
