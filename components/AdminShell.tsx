"use client";

import { useLayoutEffect, useState } from "react";
import AdminSidebar from "@/components/AdminSidebar";
import DashboardHeader from "@/components/DashboardHeader";
import AdminBottomTabBar from "@/components/AdminBottomTabBar";
import OneSignalBridge from "@/components/OneSignalBridge";
import { isNativeApp } from "@/lib/native";

export default function AdminShell({
  fullName,
  userId,
  children,
}: {
  fullName: string;
  userId: string;
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [nativeApp, setNativeApp] = useState(false);

  useLayoutEffect(() => {
    setNativeApp(isNativeApp());
  }, []);

  return (
    <div className="min-h-screen bg-[#F8F9FB] dark:bg-slate-950 flex transition-colors">
      <OneSignalBridge userId={userId} />
      <AdminSidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader fullName={fullName} onMenuClick={() => setMobileOpen(true)} />
        <main
          className={`flex-1 py-4 sm:p-6 lg:p-8 overflow-auto ${nativeApp ? "pb-24" : ""}`}
          style={{
            paddingLeft: "max(1rem, env(safe-area-inset-left))",
            paddingRight: "max(1rem, env(safe-area-inset-right))",
          }}
        >
          {children}
        </main>
      </div>
      {nativeApp && <AdminBottomTabBar />}
    </div>
  );
}
