"use client";
import { usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const ICONS = {
  home: (
    <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 21V12h6v9" />
    </svg>
  ),
  properties: (
    <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18M5 21V7l8-4v18M13 21V11l6 3v7M9 9v.01M9 12v.01M9 15v.01" />
    </svg>
  ),
  tenants: (
    <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
    </svg>
  ),
  reports: <span className="text-[18px] font-bold leading-none w-[18px] inline-flex items-center justify-center">₺</span>,
  bell: (
    <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.73 21a2 2 0 01-3.46 0" />
    </svg>
  ),
  calendar: (
    <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  ),
  calculator: (
    <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 6h8M8 11h.01M12 11h.01M16 11h.01M8 15h.01M12 15h.01M16 15h.01M8 19h.01M12 19h.01M16 19h.01" />
    </svg>
  ),
  contract: (
    <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 2v6h6M9 13h6M9 17h6" />
    </svg>
  ),
  blog: (
    <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 19.5A2.5 2.5 0 016.5 17H20M4 19.5A2.5 2.5 0 006.5 22H20V4a2 2 0 00-2-2H6.5A2.5 2.5 0 004 4.5v15z" />
    </svg>
  ),
  support: (
    <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="10" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.5 9a2.5 2.5 0 015 .5c0 1.5-2.5 2-2.5 3.5M12 17h.01" />
    </svg>
  ),
};

const NAV_ITEMS: { href: string; label: string; icon: keyof typeof ICONS; exact?: boolean }[] = [
  { href: "/dashboard", label: "Ana Sayfa", icon: "home", exact: true },
  { href: "/dashboard/mulk", label: "Mülklerim", icon: "properties", exact: true },
  { href: "/dashboard/kiraci", label: "Kiracılar", icon: "tenants", exact: true },
  { href: "/dashboard/finans-raporlari", label: "Finans Raporları", icon: "reports", exact: true },
  { href: "/dashboard/bildirimler", label: "Bildirimler", icon: "bell", exact: true },
  { href: "/dashboard/takvim", label: "Takvim", icon: "calendar", exact: true },
  { href: "/dashboard/kira-artis-hesapla", label: "Kira Artış Hesapla", icon: "calculator", exact: true },
  { href: "/dashboard/kira-sozlesmesi", label: "Kira Sözleşmesi Oluştur", icon: "contract", exact: true },
  { href: "/dashboard/blog", label: "Blog", icon: "blog" },
  { href: "/dashboard/destek", label: "Yardım & Destek", icon: "support", exact: true },
];

export default function DashboardSidebar({
  mobileOpen = false,
  onClose,
}: {
  mobileOpen?: boolean;
  onClose?: () => void;
}) {
  const p = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);
  const [profile, setProfile] = useState<{ fullName: string; email: string } | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/dashboard/notifications/unread-count")
      .then((r) => r.json())
      .then((d) => setUnreadCount(d.count || 0))
      .catch(() => {});
  }, [p]);

  useEffect(() => {
    fetch("/api/dashboard/profile")
      .then((r) => r.json())
      .then((d) => {
        if (d.user) setProfile(d.user);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem("mizan-theme");
    const initial = stored === "dark" ? "dark" : "light";
    setTheme(initial);
    document.documentElement.classList.toggle("dark", initial === "dark");
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function applyTheme(next: "light" | "dark") {
    setTheme(next);
    localStorage.setItem("mizan-theme", next);
    document.documentElement.classList.toggle("dark", next === "dark");
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  const lc = (href: string, exact = false) => {
    const a = exact ? p === href : p.startsWith(href);
    return a
      ? "flex items-center gap-3 px-4 py-2.5 rounded-xl text-[15px] font-semibold bg-[#17B6AE]/10 text-[#17B6AE] dark:bg-[#17B6AE]/15 border-l-[3px] border-[#17B6AE] mb-1"
      : "flex items-center gap-3 px-4 py-2.5 rounded-xl text-[15px] font-medium text-slate-500 dark:text-slate-400 hover:bg-[#17B6AE]/5 hover:text-[#17B6AE] border-l-[3px] border-transparent mb-1 transition-all";
  };

  const initials = profile?.fullName
    ? profile.fullName
        .split(" ")
        .map((s) => s.charAt(0))
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "?";

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <aside
        className={`no-print w-72 sm:w-64 fixed inset-y-0 left-0 lg:sticky lg:top-0 h-screen bg-white dark:bg-slate-900 border-r border-gray-100 dark:border-slate-800 flex flex-col shadow-sm transition-transform duration-200 ease-in-out z-50 lg:z-auto lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="h-20 flex items-center justify-between px-4 sm:px-6 border-b border-gray-100 dark:border-slate-800 flex-shrink-0">
          <Link href="/dashboard">
            <Image
              src="/logo-yeni-white.png"
              alt="Mizan"
              width={311}
              height={100}
              className="h-11 w-auto object-contain drop-shadow-[0_6px_14px_rgba(23,182,174,0.3)]"
              style={{ width: "auto" }}
            />
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="lg:hidden text-slate-400 hover:text-slate-600 p-1"
            aria-label="Menüyü kapat"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        {NAV_ITEMS.map((item) => (
          <a key={item.href} href={item.href} className={lc(item.href, item.exact)}>
            <span className="flex-shrink-0">{ICONS[item.icon]}</span>
            {item.label === "Bildirimler" ? (
              <span className="flex-1 flex items-center justify-between">
                <span>Bildirimler</span>
                {unreadCount > 0 && (
                  <span className="text-[10px] font-bold bg-red-500 text-white px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                    {unreadCount}
                  </span>
                )}
              </span>
            ) : (
              item.label
            )}
          </a>
        ))}

        <a
          href="/dashboard/asistan"
          className={`relative flex items-center gap-3 px-4 py-2.5 rounded-xl text-[15px] font-semibold mb-1 mt-1 overflow-hidden transition-all ${
            p === "/dashboard/asistan"
              ? "bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-md shadow-violet-500/25"
              : "bg-gradient-to-r from-violet-50 to-fuchsia-50 dark:from-violet-500/10 dark:to-fuchsia-500/10 text-violet-600 dark:text-violet-300 hover:from-violet-100 hover:to-fuchsia-100"
          }`}
        >
          <svg className="w-[18px] h-[18px] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l1.9 4.6L18.5 9l-4.6 1.9L12 15.5l-1.9-4.6L5.5 9l4.6-1.9L12 3z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 15l.8 1.9 1.9.8-1.9.8-.8 1.9-.8-1.9-1.9-.8 1.9-.8L19 15z" />
          </svg>
          <span className="flex-1">Mizan Asistan</span>
          <span
            className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-widest ${
              p === "/dashboard/asistan" ? "bg-white/20 text-white" : "bg-violet-500/10 text-violet-500"
            }`}
          >
            Beta
          </span>
        </a>
      </nav>

      <div className="relative px-3 pb-4 pt-3 border-t border-gray-100 dark:border-slate-800 flex-shrink-0" ref={menuRef}>
        {menuOpen && (
          <div className="absolute bottom-[calc(100%+8px)] left-3 right-3 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl shadow-2xl p-2 z-20">
            <Link
              href="/dashboard/mizan-pro"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-[#17B6AE]/10 to-[#17B6AE]/5 text-[#0f9089] hover:from-[#17B6AE]/20 hover:to-[#17B6AE]/10 transition mb-0.5"
            >
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Mizan Pro
            </Link>

            <Link
              href="/dashboard/ayarlar"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition mb-0.5"
            >
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <circle cx="12" cy="12" r="3" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06A1.65 1.65 0 004.6 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06A1.65 1.65 0 009 4.6a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06A1.65 1.65 0 0019.4 9c.23.5.7.83 1.25.83H21a2 2 0 010 4h-.09c-.55 0-1.02.33-1.25.83z" />
              </svg>
              Ayarlar
            </Link>

            <Link
              href="/dashboard/kullanici-ekle"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition mb-0.5"
            >
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                <circle cx="8.5" cy="7" r="4" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 8v6M23 11h-6" />
              </svg>
              Kullanıcı Ekle
            </Link>

            <div className="flex items-center justify-between px-3 py-2.5">
              <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Tema</span>
              <div className="flex items-center gap-0.5 bg-gray-100 dark:bg-slate-700 rounded-lg p-0.5">
                <button
                  type="button"
                  onClick={() => applyTheme("light")}
                  className={`w-7 h-7 rounded-md flex items-center justify-center transition ${
                    theme === "light" ? "bg-white dark:bg-slate-600 shadow-sm text-amber-500" : "text-slate-400"
                  }`}
                  aria-label="Açık tema"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <circle cx="12" cy="12" r="4" />
                    <path strokeLinecap="round" d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => applyTheme("dark")}
                  className={`w-7 h-7 rounded-md flex items-center justify-center transition ${
                    theme === "dark" ? "bg-white dark:bg-slate-600 shadow-sm text-slate-700 dark:text-slate-100" : "text-slate-400"
                  }`}
                  aria-label="Koyu tema"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="border-t border-gray-100 dark:border-slate-700 my-1" />

            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition"
            >
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
              </svg>
              Çıkış Yap
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          className="w-full flex items-center gap-3 bg-gray-50 dark:bg-slate-800 rounded-xl px-3 py-2.5 hover:bg-gray-100 dark:hover:bg-slate-700 transition"
        >
          <span className="w-9 h-9 rounded-full bg-[#17B6AE]/15 text-[#17B6AE] flex items-center justify-center text-xs font-bold flex-shrink-0">
            {initials}
          </span>
          <span className="flex-1 min-w-0 text-left">
            <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">
              {profile?.fullName || "Kullanıcı"}
            </p>
            <p className="text-xs text-slate-400 truncate">{profile?.email || ""}</p>
          </span>
          <svg
            className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform ${menuOpen ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M18 15l-6-6-6 6" />
          </svg>
        </button>
      </div>
      </aside>
    </>
  );
}
