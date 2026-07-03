"use client";

import { useState } from "react";
import Image from "next/image";

const MENU_ITEMS = [
  { label: "Neler Yapıyoruz?", href: "#neler-yapiyoruz" },
  { label: "Paketlerimiz", href: "#paketler" },
  { label: "Referanslarımız", href: "#referanslar" },
  { label: "S.S.S.", href: "#sss" },
  { label: "İletişim", href: "#iletisim" },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-28">
          <a href="/" className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="Mizan Mülk Yönetimi"
              width={220}
              height={66}
              className="h-20 w-auto object-contain animate-float drop-shadow-md"
              style={{ width: "auto" }}
              priority
            />
          </a>

          <nav className="hidden md:flex items-center gap-6">
            {MENU_ITEMS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-slate-600 text-sm font-medium hover:text-[#17B6AE] transition"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <a
              href="/register"
              className="text-[#17B6AE] text-sm font-medium hover:underline"
            >
              Kayıt Ol
            </a>
            <a
              href="/login"
              className="bg-black text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-slate-800 transition"
            >
              Giriş Yap
            </a>
          </div>

          <button
            className="md:hidden text-slate-700"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menüyø aç/kapat"
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
          <div className="md:hidden pb-4 flex flex-col gap-3">
            {MENU_ITEMS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-slate-600 text-sm font-medium"
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </a>
            ))}
            <div className="flex items-center gap-3 pt-2">
              <a href="/register" className="text-[#17B6AE] text-sm font-medium">
                Kayıt Ol
              </a>
              <a
                href="/login"
                className="bg-black text-white text-sm font-medium px-4 py-2 rounded-lg"
              >
                Giriş Yap
              </a>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
