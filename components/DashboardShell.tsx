"use client";

import { useEffect, useState } from "react";
import DashboardSidebar from "@/components/DashboardSidebar";
import DashboardHeader from "@/components/DashboardHeader";
import ImpersonationBanner from "@/components/ImpersonationBanner";
import BottomTabBar from "@/components/BottomTabBar";
import OneSignalBridge from "@/components/OneSignalBridge";
import { isNativeApp } from "@/lib/native";

export default function DashboardShell({
  fullName,
  userId,
  impersonating,
  children,
}: {
  fullName: string;
  userId: string;
  impersonating: boolean;
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [nativeApp, setNativeApp] = useState(false);

  useEffect(() => {
    setNativeApp(isNativeApp());
  }, []);

  return (
    <div className="min-h-screen bg-[#F8F9FB] dark:bg-slate-950 flex transition-colors">
      <div className="fixed top-0 left-0 right-0 z-[999] bg-black text-white text-[10px] text-center py-0.5">
        TEŞHİS: native={String(nativeApp)} — build 2026-07-13-v2
      </div>
      <OneSignalBridge userId={userId} />
      <DashboardSidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        {impersonating && <ImpersonationBanner customerName={fullName} />}
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
      {nativeApp && <BottomTabBar />}
    </div>
  );
}
