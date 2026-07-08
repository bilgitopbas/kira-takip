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
    return a ? "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold bg-[#17B6AE] text-white shadow-md shadow-[#17B6AE]/30 mb-0.5" : "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-500 hover:bg-[#17B6AE]/10 hover:text-[#17B6AE] mb-0.5 transition-all";
  };
  const sec = "text-[10px] font-bold text-slate-300 uppercase tracking-widest px-4 pt-5 pb-1";
  const soon = "flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-300 mb-0.5 cursor-not-allowed select-none";
  const SoonBadge = () => (
    <span className="text-[10px] font-bold bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded">Yakında</span>
  );
  return (
    <aside className="no-print w-72 bg-white border-r border-gray-100 flex flex-col min-h-screen shadow-sm">
      <div className="h-20 flex items-center px-6 border-b border-gray-100">
        <Image src="/logo.png" alt="Mizan" width={140} height={42} className="h-11 w-auto object-contain" style={{width:"auto"}} />
      </div>
      <nav className="flex-1 px-4 py-4 overflow-y-auto">
        <a href="/dashboard" className={lc("/dashboard",true)}>Ana Sayfa</a>
        <a href="/dashboard/takvim" className={lc("/dashboard/takvim",true)}>Takvim</a>
        <p className={sec}>Mülklerim</p>
        <a href="/dashboard/mulk" className={lc("/dashboard/mulk",true)}>Mülklerim</a>
        <p className={sec}>Kiracılar</p>
        <a href="/dashboard/kiraci" className={lc("/dashboard/kiraci",true)}>Kiracılar</a>
        <p className={sec}>Finans</p>
        <a href="/dashboard/finans-raporlari" className={lc("/dashboard/finans-raporlari",true)}>Finans Raporları</a>
        <p className={sec}>Diğer</p>
        <a href="/dashboard/bildirimler" className={`${lc("/dashboard/bildirimler",true)} justify-between`}>
          <span>Bildirimler</span>
          {unreadCount > 0 && (
            <span className="text-[10px] font-bold bg-red-500 text-white px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
              {unreadCount}
            </span>
          )}
        </a>
        <div className={soon}><span>Kira Sözleşmesi</span><SoonBadge /></div>
        <div className={soon}><span>Kira Artış Hesapla</span><SoonBadge /></div>
        <a href="/dashboard/blog" className={lc("/dashboard/blog")}>Blog</a>
        <a href="/dashboard/destek" className={lc("/dashboard/destek",true)}>Yardım &amp; Destek</a>
        <a href="/dashboard/ayarlar" className={lc("/dashboard/ayarlar",true)}>Ayarlar</a>
      </nav>
      <div className="px-4 pb-6 pt-3 border-t border-gray-100">
        <div className="flex items-center gap-3 px-4 py-3 mb-1">
          <div className="w-9 h-9 rounded-full bg-[#17B6AE] flex items-center justify-center flex-shrink-0">
            <span className="text-white text-sm font-bold">M</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-700">Hesabım</p>
            <p className="text-xs text-slate-400">Mizan Mülk</p>
          </div>
        </div>
        <a href="/api/auth/logout" className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-50 hover:text-red-600 transition-all">
          Çıkış Yap
        </a>
      </div>
    </aside>
  );
}
