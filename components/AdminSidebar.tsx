"use client";

import { usePathname } from "next/navigation";
import Image from "next/image";

export default function AdminSidebar() {
  const pathname = usePathname();

  const linkClass = (href: string, exact = false) => {
    const isActive = exact ? pathname === href : pathname.startsWith(href);
    return isActive
      ? "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium bg-[#17B6AE]/10 text-[#17B6AE]"
      : "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:bg-gray-50 hover:text-slate-700";
  };

  return (
    <aside className="w-64 bg-white border-r border-gray-100 flex flex-col flex-shrink-0 min-h-screen">
      <div className="h-16 flex items-center px-6 border-b border-gray-100">
        <Image
          src="/logo.png"
          alt="Mizan"
          width={120}
          height={36}
          className="h-9 w-auto object-contain"
          style={{ width: "auto" }}
        />
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-3">
          Ana Menu
        </p>

        <a href="/admin" className={linkClass("/admin", true)}>
          <span className="flex-1">Kontrol Paneli</span>
        </a>

        <a href="/admin/kullanicilar" className={linkClass("/admin/kullanicilar")}>
          <span className="flex-1">Kullanicilar</span>
        </a>

        <a href="/admin/islemler" className={linkClass("/admin/islemler")}>
  <span className="flex-1">Kullanici Islemleri</span>
</a>

        <a href="/admin/destek" className={linkClass("/admin/destek")}>
          <span className="flex-1">Destek Talepleri</span>
        </a>

        <a href="/admin/duyurular" className={linkClass("/admin/duyurular")}>
          <span className="flex-1">Duyurular</span>
          <span className="text-[10px] font-bold bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded">
            Yakinda
          </span>
        </a>

        <a href="/admin/blog" className={linkClass("/admin/blog")}>
          <span className="flex-1">Blog Yonetimi</span>
          <span className="text-[10px] font-bold bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded">
            Yakinda
          </span>
        </a>

        <a href="/admin/ayarlar" className={linkClass("/admin/ayarlar")}>
          <span className="flex-1">Admin Ayarlari</span>
        </a>
      </nav>

      <div className="p-4 border-t border-gray-100">
        <a href="/" className="flex items-center gap-2 text-xs text-slate-400 hover:text-slate-600 transition">
          Siteye Don
        </a>
      </div>
    </aside>
  );
}