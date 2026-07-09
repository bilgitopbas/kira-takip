"use client";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { useEffect, useState } from "react";
export default function DashboardSidebar() {
  const p = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetch("/api/dashboard/notifications/unread-count")
      .then((r) => r.json())
      .then((d) => setUnreadCount(d.count || 0))
      .catch(() => {});
  }, [p]);
  const lc = (href: string, exact = false) => {
    const a = exact ? p === href : p.startsWith(href);
    return a
      ? "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold bg-[#17B6AE]/10 text-[#17B6AE] border-l-[3px] border-[#17B6AE] mb-0.5"
      : "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-slate-500 hover:bg-[#17B6AE]/5 hover:text-[#17B6AE] border-l-[3px] border-transparent mb-0.5 transition-all";
  };
  const soon = "flex items-center justify-between gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-slate-300 border-l-[3px] border-transparent mb-0.5 cursor-not-allowed select-none";
  const SoonBadge = () => (
    <span className="text-[10px] font-bold bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded">Yakında</span>
  );
  return (
    <aside className="no-print w-64 bg-white border-r border-gray-100 flex flex-col min-h-screen shadow-sm">
      <div className="h-16 flex items-center px-6 border-b border-gray-100">
        <Image src="/logo.png" alt="Mizan" width={140} height={42} className="h-9 w-auto object-contain" style={{width:"auto"}} />
      </div>
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <a
          href="/dashboard/mizan-pro"
          className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-bold mb-2 transition-all ${
            p.startsWith("/dashboard/mizan-pro")
              ? "bg-gradient-to-r from-[#17B6AE] to-[#0f9089] text-white shadow-lg shadow-[#17B6AE]/30"
              : "bg-gradient-to-r from-[#17B6AE]/10 to-[#17B6AE]/5 text-[#0f9089] hover:from-[#17B6AE]/20 hover:to-[#17B6AE]/10 shadow-sm"
          }`}
        >
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Mizan Pro
        </a>
        <a href="/dashboard" className={lc("/dashboard",true)}>Ana Sayfa</a>
        <a href="/dashboard/takvim" className={lc("/dashboard/takvim",true)}>Takvim</a>
        <a href="/dashboard/mulk" className={lc("/dashboard/mulk",true)}>Mülklerim</a>
        <a href="/dashboard/kiraci" className={lc("/dashboard/kiraci",true)}>Kiracılar</a>
        <a href="/dashboard/finans-raporlari" className={lc("/dashboard/finans-raporlari",true)}>Finans Raporları</a>
        <a href="/dashboard/bildirimler" className={`${lc("/dashboard/bildirimler",true)} justify-between`}>
          <span>Bildirimler</span>
          {unreadCount > 0 && (
            <span className="text-[10px] font-bold bg-red-500 text-white px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
              {unreadCount}
            </span>
          )}
        </a>
        <div className={soon}><span>Kira Sözleşmesi</span><SoonBadge /></div>
        <a href="/dashboard/kira-artis-hesapla" className={lc("/dashboard/kira-artis-hesapla",true)}>Kira Artış Hesapla</a>
        <a href="/dashboard/blog" className={lc("/dashboard/blog")}>Blog</a>
        <a href="/dashboard/destek" className={lc("/dashboard/destek",true)}>Yardım &amp; Destek</a>
        <a href="/dashboard/ayarlar" className={lc("/dashboard/ayarlar",true)}>Ayarlar</a>
      </nav>
      <div className="px-3 pb-6 pt-3 border-t border-gray-100">
        <a href="/api/auth/logout" className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-50 hover:text-red-600 transition-all">
          Çıkış Yap
        </a>
      </div>
    </aside>
  );
}
