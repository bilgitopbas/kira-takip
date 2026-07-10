"use client";

import { useState } from "react";
import DashboardSidebar from "@/components/DashboardSidebar";
import DashboardHeader from "@/components/DashboardHeader";
import ImpersonationBanner from "@/components/ImpersonationBanner";

export default function DashboardShell({
  fullName,
  impersonating,
  children,
}: {
  fullName: string;
  impersonating: boolean;
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F8F9FB] dark:bg-slate-950 flex transition-colors">
      <DashboardSidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        {impersonating && <ImpersonationBanner customerName={fullName} />}
        <DashboardHeader fullName={fullName} onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
