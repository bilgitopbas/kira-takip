const LOGOS = [
  { src: "/logo-ozgul.png", alt: "Özgül Trailer" },
  { src: "/logo-topbas-doktor.png", alt: "Opt. Dr. Mevlüt Topbaş" },
  { src: "/logo-bankon.png", alt: "Eğ Bankon" },
  { src: "/logo-balcilar.png", alt: "Balcılar Yem Sanayi" },
];

export default function TrustedCompanies() {
  const doubled = [...LOGOS, ...LOGOS];

  return (
    <section className="py-14 bg-white border-y border-gray-100 overflow-hidden">
      <p className="text-center text-sm text-slate-400 mb-8 font-medium tracking-wide uppercase">
        Güvenle Tercih Eden Firmalar
      </p>
      <div className="relative w-full overflow-hidden">
        <div className="flex gap-20 items-center animate-marquee w-max">
          {doubled.map((logo, i) => (
            <div
              key={`${logo.alt}-${i}`}
              className="flex items-center justify-center h-20 px-8"
            >
              <img
                src={logo.src}
                alt={logo.alt}
                className="h-16 w-auto object-contain max-w-[200px]"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
