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

  // Native'de dis kabuk SABIT (ekran yuksekligi kadar, kendisi kaymaz);
  // kaydirma yalnizca <main> icindedir. Ust bar ve alt sekmeler boylece oynamaz.
  // (Topbas Hukuk'ta dogrulanan duzen; html/body'ye dokunulmaz.)
  return (
    <div
      className={`${nativeApp ? "h-[100dvh] overflow-hidden" : "min-h-screen"} bg-[#F8F9FB] dark:bg-slate-950 flex transition-colors`}
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <OneSignalBridge userId={userId} />
      <AdminSidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        <DashboardHeader fullName={fullName} onMenuClick={() => setMobileOpen(true)} />
        <main
          className={`flex-1 min-h-0 py-4 sm:p-6 lg:p-8 overflow-y-auto overscroll-contain ${nativeApp ? "pb-24 overflow-x-hidden" : ""}`}
          style={{
            paddingLeft: "max(1rem, env(safe-area-inset-left))",
            paddingRight: "max(1rem, env(safe-area-inset-right))",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {children}
        </main>
      </div>
      {nativeApp && <AdminBottomTabBar />}
    </div>
  );
}
