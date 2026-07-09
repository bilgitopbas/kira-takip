"use client";

import { usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const ICONS = {
  dashboard: (
    <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </svg>
  ),
  users: (
    <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
    </svg>
  ),
  consultant: (
    <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="8" r="4" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 21v-1a6 6 0 016-6h1M17 15l2 2 4-4" />
    </svg>
  ),
  revenue: <span className="text-[18px] font-bold leading-none w-[18px] inline-flex items-center justify-center">₺</span>,
  support: (
    <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="10" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.5 9a2.5 2.5 0 015 .5c0 1.5-2.5 2-2.5 3.5M12 17h.01" />
    </svg>
  ),
  bell: (
    <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.73 21a2 2 0 01-3.46 0" />
    </svg>
  ),
  blog: (
    <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 19.5A2.5 2.5 0 016.5 17H20M4 19.5A2.5 2.5 0 006.5 22H20V4a2 2 0 00-2-2H6.5A2.5 2.5 0 004 4.5v15z" />
    </svg>
  ),
  announcement: (
    <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 11l18-5v12L3 13v-2z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 16.5v3a2 2 0 01-4 0v-4" />
    </svg>
  ),
};

const soon = "flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl text-[15px] font-medium text-slate-300 dark:text-slate-600 mb-1 cursor-not-allowed select-none";
const SoonBadge = () => (
  <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">Yakında</span>
);

export default function AdminSidebar() {
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
    ? profile.fullName.split(" ").map((s) => s.charAt(0)).slice(0, 2).join("").toUpperCase()
    : "?";

  return (
    <aside className="no-print w-64 sticky top-0 h-screen bg-white dark:bg-slate-900 border-r border-gray-100 dark:border-slate-800 flex flex-col shadow-sm transition-colors">
      <Link href="/admin" className="h-20 flex items-center px-6 border-b border-gray-100 dark:border-slate-800 flex-shrink-0">
        <Image
          src="/logo-yeni-white.png"
          alt="Mizan"
          width={311}
          height={100}
          className="h-11 w-auto object-contain drop-shadow-[0_6px_14px_rgba(23,182,174,0.3)]"
          style={{ width: "auto" }}
        />
      </Link>

      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <a href="/admin" className={lc("/admin", true)}>
          <span className="flex-shrink-0">{ICONS.dashboard}</span>
          Kontrol Paneli
        </a>
        <a href="/admin/kullanicilar" className={lc("/admin/kullanicilar")}>
          <span className="flex-shrink-0">{ICONS.users}</span>
          Kullanıcılar
        </a>
        <a href="/admin/islemler" className={lc("/admin/islemler")}>
          <span className="flex-shrink-0">{ICONS.consultant}</span>
          Kullanıcı İşlemleri
        </a>
        <a href="/admin/gelirler" className={lc("/admin/gelirler")}>
          <span className="flex-shrink-0">{ICONS.revenue}</span>
          Gelirler
        </a>
        <a href="/admin/destek" className={lc("/admin/destek")}>
          <span className="flex-shrink-0">{ICONS.support}</span>
          Destek Talepleri
        </a>
        <a href="/admin/bildirimler" className={`${lc("/admin/bildirimler", true)} justify-between`}>
          <span className="flex items-center gap-3">
            <span className="flex-shrink-0">{ICONS.bell}</span>
            Bildirimler
          </span>
          {unreadCount > 0 && (
            <span className="text-[10px] font-bold bg-red-500 text-white px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
              {unreadCount}
            </span>
          )}
        </a>
        <a href="/admin/blog" className={lc("/admin/blog")}>
          <span className="flex-shrink-0">{ICONS.blog}</span>
          Blog Yönetimi
        </a>
        <div className={soon}>
          <span className="flex items-center gap-3">
            <span className="flex-shrink-0">{ICONS.announcement}</span>
            Duyurular
          </span>
          <SoonBadge />
        </div>
      </nav>

      <div className="relative px-3 pb-4 pt-3 border-t border-gray-100 dark:border-slate-800 flex-shrink-0" ref={menuRef}>
        {menuOpen && (
          <div className="absolute bottom-[calc(100%+8px)] left-3 right-3 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl shadow-2xl p-2 z-20">
            <Link
              href="/admin/ayarlar"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition mb-0.5"
            >
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <circle cx="12" cy="12" r="3" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06A1.65 1.65 0 004.6 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06A1.65 1.65 0 009 4.6a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06A1.65 1.65 0 0019.4 9c.23.5.7.83 1.25.83H21a2 2 0 010 4h-.09c-.55 0-1.02.33-1.25.83z" />
              </svg>
              Ayarlar
            </Link>

            <a
              href="/"
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition mb-0.5"
            >
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7m-9-2v9a1 1 0 001 1h2a1 1 0 001-1v-4h2v4a1 1 0 001 1h2a1 1 0 001-1v-9" />
              </svg>
              Siteye Dön
            </a>

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
            <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">{profile?.fullName || "Yönetici"}</p>
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
  );
}
