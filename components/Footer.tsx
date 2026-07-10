import Image from "next/image";

const SOCIALS = [
  {
    name: "LinkedIn",
    href: "#",
    icon: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.63-1.85 3.36-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.06 2.06 0 110-4.12 2.06 2.06 0 010 4.12zM7.12 20.45H3.56V9h3.56v11.45z" />
      </svg>
    ),
  },
  {
    name: "Instagram",
    href: "#",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.2" cy="6.8" r="0.6" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    name: "X",
    href: "#",
    icon: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M18.9 2H22l-7.6 8.7L23.3 22h-7l-5.5-7.2L4.5 22H1.4l8.1-9.3L1 2h7.2l5 6.6L18.9 2zm-1.2 18h1.7L7.4 3.9H5.6L17.7 20z" />
      </svg>
    ),
  },
  {
    name: "Facebook",
    href: "#",
    icon: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M13.5 21v-8h2.7l.4-3.1h-3.1V8c0-.9.25-1.5 1.55-1.5H16.7V3.7c-.28-.04-1.25-.12-2.37-.12-2.35 0-3.96 1.43-3.96 4.06V10H7.6v3.1h2.77v8h3.13z" />
      </svg>
    ),
  },
];

const LEGAL_LINKS = [
  { label: "Aydınlatma Metni", href: "/aydinlatma-metni" },
  { label: "Açık Rıza Metni", href: "/acik-riza-metni" },
  { label: "Kullanım Koşulları", href: "/kullanim-kosullari" },
  { label: "Çerez Politikası", href: "/cerez-politikasi" },
];

export default function Footer() {
  return (
    <footer id="iletisim" className="bg-slate-900 text-slate-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8">
          <div>
            <div className="bg-white inline-block rounded-xl p-3 mb-4">
              <Image
                src="/logo-yeni-white.png"
                alt="Mizan Mülk Yönetimi"
                width={311}
                height={100}
                className="h-12 w-auto object-contain"
                style={{ width: "auto" }}
              />
            </div>
            <div className="flex items-center gap-2 mt-4">
              {SOCIALS.map((s) => (
                <a
                  key={s.name}
                  href={s.href}
                  aria-label={s.name}
                  className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-[#17B6AE] text-slate-400 hover:text-white flex items-center justify-center transition"
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-white font-medium mb-3 text-sm">Ürün</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><a href="/#neler-yapiyoruz" className="hover:text-white transition">Neler Yapıyoruz?</a></li>
              <li><a href="/#paketler" className="hover:text-white transition">Paketlerimiz</a></li>
              <li><a href="/#sss" className="hover:text-white transition">S.S.S.</a></li>
              <li><a href="/#referanslar" className="hover:text-white transition">Referanslarımız</a></li>
              <li><a href="/blog" className="hover:text-white transition">Blog</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-medium mb-3 text-sm">Hesap</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><a href="/register" className="hover:text-white transition">Kayıt Ol</a></li>
              <li><a href="/login" className="hover:text-white transition">Giriş Yap</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-medium mb-3 text-sm">Yasal</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              {LEGAL_LINKS.map((l) => (
                <li key={l.href}><a href={l.href} className="hover:text-white transition">{l.label}</a></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-medium mb-3 text-sm">İletişim</h4>
            <ul className="space-y-3 text-sm text-slate-400">
              <li className="flex items-start gap-2">
                <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <a href="tel:+905307382996" className="hover:text-white transition">+90 530 738 29 96</a>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <a href="mailto:bilgi@mizanmulkyonetimi.com" className="hover:text-white transition">bilgi@mizanmulkyonetimi.com</a>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Akabe Mah. Şehit Furkan Doğan Cad. B Blok Adalet Plaza No:11/206 Karatay/KONYA</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-10 pt-6 text-sm text-slate-500 text-center">
          © {new Date().getFullYear()} Mizan Mülk Yönetimi. Tüm hakları saklıdır.
        </div>
      </div>
    </footer>
  );
}
