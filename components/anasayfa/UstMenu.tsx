"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { azHareketMi } from "./hareket";

const MENU = [
  { label: "Neler Yapıyoruz?", href: "#neler-yapiyoruz" },
  { label: "Paketlerimiz", href: "#paketler" },
  { label: "Referanslarımız", href: "#referanslar" },
  { label: "S.S.S. & İletişim", href: "#sss" },
  { label: "Blog", href: "/blog" },
];

// Girişin (koyu) üstünde saydam ve açık yazılı; açık bölümlere geçince açık cam.
export default function UstMenu() {
  const [menuAcik, setMenuAcik] = useState(false);
  const [kaydi, setKaydi] = useState(false);
  const [aydinlik, setAydinlik] = useState(false);

  useEffect(() => {
    const kahraman = document.getElementById("kahraman");
    const olc = () => {
      setKaydi(window.scrollY > 24);
      setAydinlik(!!kahraman && window.scrollY > kahraman.offsetHeight - 90);
    };
    olc();
    window.addEventListener("scroll", olc, { passive: true });
    window.addEventListener("resize", olc);
    return () => {
      window.removeEventListener("scroll", olc);
      window.removeEventListener("resize", olc);
    };
  }, []);

  // Zaten ana sayfadayız: aynı adrese gezinme görünürde hiçbir şey yapmadığı için
  // logo sayfanın en üstüne kayar ve adresteki #bölüm ekini temizler; zaten en
  // üstteyse ana sayfayı yeniden yükler.
  const basaDon = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    setMenuAcik(false);
    if (window.location.hash) history.replaceState(null, "", "/");
    if (window.scrollY < 10) window.location.reload();
    else window.scrollTo({ top: 0, behavior: azHareketMi() ? "auto" : "smooth" });
  };

  const sinif =["ust", kaydi || menuAcik ? "kaydi" : "", aydinlik ? "acik" : ""].filter(Boolean).join(" ");

  return (
    <header className={sinif}>
      <div className="kap">
        <Link href="/" className="logo" aria-label="Mizan Mülk Yönetimi ana sayfa" onClick={basaDon}>
          <Image className="la" src="/anasayfa/logo-acik.webp" alt="Mizan Mülk Yönetimi" width={168} height={46} preload />
          <Image className="lk" src="/anasayfa/logo-koyu.webp" alt="" aria-hidden="true" width={168} height={46} />
        </Link>
        <nav className="menu" aria-label="Ana menü">
          {MENU.map((m) => (
            <a key={m.href} href={m.href}>
              {m.label}
            </a>
          ))}
        </nav>
        <div className="ust-sag">
          <a href="/login" className="giris">
            Giriş Yap
          </a>
          <a href="/register" className="dugme ana">
            Ücretsiz Başla
          </a>
        </div>
        <button
          type="button"
          className="hamburger"
          aria-expanded={menuAcik}
          aria-controls="mobilMenu"
          aria-label="Menüyü aç/kapat"
          onClick={() => setMenuAcik((a) => !a)}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            {menuAcik ? <path d="M6 6l12 12M6 18L18 6" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </div>
      <div className={`mobil-menu${menuAcik ? " acik" : ""}`} id="mobilMenu">
        <nav aria-label="Mobil menü">
          {MENU.map((m) => (
            <a key={m.href} href={m.href} onClick={() => setMenuAcik(false)}>
              {m.label}
            </a>
          ))}
          <div className="ikili">
            <a href="/login" className="dugme hayalet">
              Giriş Yap
            </a>
            <a href="/register" className="dugme ana">
              Ücretsiz Başla
            </a>
          </div>
        </nav>
      </div>
    </header>
  );
}
