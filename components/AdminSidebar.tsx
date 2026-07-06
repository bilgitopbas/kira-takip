"use client";

import { usePathname } from "next/navigation";
import Image from "next/image";

type NavItem = {
  label: string;
  href: string;
  exact: boolean;
  badge: string;
  icon: string;
};

const NAV_ITEMS: NavItem[] = [
  { label: "Kontrol Paneli", href: "/admin", exact: true, badge: "", icon: "grid" },
  { label: "Kullanicilar", href: "/admin/kullanicilar", exact: false, badge: "", icon: "users" },
  { label: "Destek Talepleri", href: "/admin/destek", exact: false, badge: "", icon: "chat" },
  { label: "Duyurular", href: "/admin/duyurular", exact: false, badge: "Yakinda", icon: "bell" },
  { label: "Blog Yonetimi", href: "/admin/blog", exact: false, badge: "Yakinda", icon: "edit" },
  { label: "Admin Ayarlari", href: "/admin/ayarlar", exact: false, badge: "", icon: "settings" },
];

function Icon({ name, cls }: { name: string; cls: string }) {
  if (name === "grid") return (
    <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
  if (name === "users") return (
    <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
    </svg>
  );
  if (name === "chat") return (
    <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  );
  if (name === "bell") return (
    <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  );
  if (name === "edit") return (
    <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  );
  return (
    <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  const base = "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group";
  const activeCls = base + " bg-[#17B6AE]/10 text-[#17B6AE]";
  const inactiveCls = base + " text-slate-500 hover:bg-gray-50 hover:text-slate-700";
  const iconCls = "w-4 h-4 flex-shrink-0 " + (active ? "text-[#17B6AE]" : "text-slate-400 group-hover:text-slate-500");

  return (
    <a href={item.href} className={active ? activeCls : inactiveCls}>
      <Icon name={item.icon} cls={iconCls} />
      <span className="flex-1">{item.label}</span>
      {item.badge !== "" && (
        <span className="text-[10px] font-bold bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded">
          {item.badge}
        </span>
      )}
    </a>
  );
}

export default function AdminSidebar() {
  const pathname = usePathname();

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
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-2">
          Ana Menu
        </p>
        {NAV_ITEMS.map(function(item) {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return <NavLink key={item.href} item={item} active={active} />;
        })}
      </nav>

      <div className="p-4 border-t border-gray-100">
        <a href="/" className="flex items-center gap-2 text-xs text-slate-400 hover:text-slate-600 transition">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Siteye Don
        </a>
      </div>
    </aside>
  );
}
