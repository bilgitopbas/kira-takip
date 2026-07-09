"use client";

import { useState } from "react";
import Image from "next/image";
import TiltCard from "@/components/motion/TiltCard";

const MENU_ITEMS = [
  { label: "Neler Yapıyoruz?", href: "/#neler-yapiyoruz" },
  { label: "Paketlerimiz", href: "/#paketler" },
  { label: "Referanslarımız", href: "/#referanslar" },
  { label: "S.S.S. & İletişim", href: "/#sss" },
  { label: "Blog", href: "/blog" },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-24 gap-6">
          <a href="/" className="relative flex items-center shrink-0">
            <span className="absolute -left-4 -top-2 w-24 h-24 bg-[#17B6AE]/20 rounded-full blur-2xl pointer-events-none" />
            <TiltCard className="relative">
              <Image
                src="/logo.png"
                alt="Mizan Mülk Yönetimi"
                width={260}
                height={78}
                className="h-16 sm:h-20 w-auto object-contain drop-shadow-[0_8px_16px_rgba(23,182,174,0.25)]"
                style={{ width: "auto" }}
                priority
              />
            </TiltCard>
          </a>

          <nav className="hidden lg:flex items-center gap-1 bg-gray-50 rounded-full px-1.5 py-1.5 border border-gray-100">
            {MENU_ITEMS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-slate-600 text-sm font-medium px-4 py-2 rounded-full hover:bg-white hover:text-[#17B6AE] hover:shadow-sm transition-all"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="hidden lg:flex items-center gap-3 shrink-0">
            <a
              href="/login"
              className="text-slate-600 text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-gray-50 transition"
            >
              Giriş Yap
            </a>
            <a
              href="/register"
              className="bg-[#17B6AE] hover:bg-[#149891] text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition shadow-md shadow-[#17B6AE]/25"
            >
              Ücretsiz Başla
            </a>
          </div>

          <button
            className="lg:hidden text-slate-700 shrink-0"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menüyü aç/kapat"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {menuOpen ? (
                <path d="M6 6l12 12M6 18L18 6" strokeLinecap="round" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
              )}
            </svg>
          </button>
        </div>

        {menuOpen && (
          <div className="lg:hidden pb-4 flex flex-col gap-1">
            {MENU_ITEMS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-slate-600 text-sm font-medium px-3 py-2.5 rounded-xl hover:bg-gray-50"
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </a>
            ))}
            <div className="flex items-center gap-3 pt-3">
              <a
                href="/login"
                className="flex-1 text-center text-slate-600 text-sm font-semibold px-4 py-2.5 rounded-xl border border-gray-200"
              >
                Giriş Yap
              </a>
              <a
                href="/register"
                className="flex-1 text-center bg-[#17B6AE] text-white text-sm font-semibold px-4 py-2.5 rounded-xl"
              >
                Ücretsiz Başla
              </a>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
