"use client";

import { useEffect, useLayoutEffect, useState } from "react";
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

  useLayoutEffect(() => {
    setNativeApp(isNativeApp());
  }, []);

  // iOS'ta sayfa sinira gelince "lastik gibi" esneyip geri donuyor (rubber-band
  // overscroll) ve bu esnada sabit (fixed) ust bar/alt sekme cubugu da sayfayla
  // birlikte 2-3 cm kayiyordu. Dis govdeyi (html/body) ekran yuksekligine
  // kilitleyip tasmayi kaynagindan engelliyoruz; artik kayan tek yer <main>
  // icerik alani. Sadece native uygulamada acik, web davranisina dokunmuyor.
  useEffect(() => {
    if (!nativeApp) return;
    const html = document.documentElement;
    const body = document.body;
    const prev = {
      htmlOverflow: html.style.overflow,
      bodyOverflow: body.style.overflow,
      htmlHeight: html.style.height,
      bodyHeight: body.style.height,
    };
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    html.style.height = "100%";
    body.style.height = "100%";
    return () => {
      html.style.overflow = prev.htmlOverflow;
      body.style.overflow = prev.bodyOverflow;
      html.style.height = prev.htmlHeight;
      body.style.height = prev.bodyHeight;
    };
  }, [nativeApp]);

  return (
    <div
      className={`${nativeApp ? "h-[100dvh] overflow-hidden" : "min-h-screen"} bg-[#F8F9FB] dark:bg-slate-950 flex transition-colors`}
    >
      <OneSignalBridge userId={userId} />
      <DashboardSidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        {impersonating && <ImpersonationBanner customerName={fullName} />}
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
      {nativeApp && <BottomTabBar />}
    </div>
  );
}
