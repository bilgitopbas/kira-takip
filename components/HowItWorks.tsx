"use client";

import { useState, useEffect, useRef } from "react";

const STEPS = [
  {
    num: "01",
    title: "Mülkünü Ekle",
    body: "Daire, dükkan ya da taşınmazınızı sisteme kaydedin. Adres, kat, metrekare ve kullanım türünü tek seferinde tanımlayın. Farklı şehirlerdeki portföyünüzü tek panelden görün.",
    tags: ["Adres bilgisi", "Mülk türü", "Portföy görünümü"],
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="#17B6AE" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
        <rect x="3" y="3" width="18" height="18" rx="3"/><path d="M3 9h18M9 21V9"/>
      </svg>
    ),
  },
  {
    num: "02",
    title: "Kiracını Gir",
    body: "Kiracı bilgilerini ve iletişim detaylarını ekleyin. Hangi mülkte oturduğunu belirleyin. Birden fazla kiracıyı aynı anda takip edin.",
    tags: ["İletişim bilgileri", "Mülk ataması", "Çoklu kiracı"],
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="#17B6AE" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
        <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
      </svg>
    ),
  },
  {
    num: "03",
    title: "Sözleşmeni Hazırla",
    body: "Kira sözleşmenizi dijital ortamda saklayın. Başlangıç ve bitiş tarihlerini girin; sistem yenileme tarihini önceden hatırlatır.",
    tags: ["Sözleşme tarihleri", "Dijital arşiv", "Otomatik hatırlatma"],
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="#17B6AE" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="13" y2="17"/>
      </svg>
    ),
  },
  {
    num: "04",
    title: "Ödeme Planını Ayarla",
    body: "Aylık kira bedelini ve ödeme gününü tanımlayın. 12 aylık plan otomatik oluşur. Kiracınıza online ödeme linki gönderin; tahsilat anında sisteme işlenir.",
    tags: ["Aylık plan", "Online tahsilat", "iyzico entegrasyonu"],
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="#17B6AE" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
        <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
      </svg>
    ),
  },
  {
    num: "05",
    title: "Gelirleri Kontrol Et",
    body: "Ödendi, gecikti, bekleniyor — tek bakışta görün. Aylık ve yıllık gelir raporlarına anında ulaşın. Gecikmelerde otomatik SMS ve e-posta gönderilir.",
    tags: ["Gelir raporu", "Gecikme takibi", "SMS hatırlatma"],
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="#17B6AE" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    ),
  },
];

const AUTO_DELAY = 3500;

export default function HowItWorks() {
  const [active, setActive] = useState(0);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function startAuto(from: number) {
    if (timerRef.current) clearInterval(timerRef.current);
    if (progressRef.current) clearInterval(progressRef.current);

    setProgress(0);
    let p = 0;
    progressRef.current = setInterval(() => {
      p += 100 / (AUTO_DELAY / 50);
      setProgress(Math.min(p, 100));
    }, 50);

    timerRef.current = setTimeout(() => {
      const next = (from + 1) % STEPS.length;
      setActive(next);
      startAuto(next);
    }, AUTO_DELAY);
  }

  function goTo(i: number) {
    setActive(i);
    startAuto(i);
  }

  useEffect(() => {
    startAuto(0);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (progressRef.current) clearInterval(progressRef.current);
    };
  }, []);

  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Başlık */}
        <div className="mb-16">
          <span className="inline-block text-xs font-bold text-[#17B6AE] bg-[#17B6AE]/10 px-4 py-1.5 rounded-full mb-4 uppercase tracking-widest">
            Nasıl Kullanılır?
          </span>
          <h2 className="text-4xl sm:text-5xl font-bold text-slate-800 leading-tight max-w-xl">
            Beş adımda<br />
            <span className="text-[#17B6AE]">tam kontrol.</span>
          </h2>
          <p className="text-slate-500 mt-4 text-base max-w-md leading-relaxed">
            Dakikalar içinde başlayın. Manuel takibe son verin.
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-0 mb-12">
          {STEPS.map((s, i) => {
            const isActive = active === i;
            return (
              <div
                key={i}
                className="relative"
                onMouseEnter={() => goTo(i)}
              >
                {/* Bağlayıcı çizgi */}
                {i < STEPS.length - 1 && (
                  <div className="hidden lg:block absolute top-7 left-1/2 w-full h-px bg-gray-100 z-0" />
                )}

                <div
                  className={`relative z-10 flex flex-col items-center text-center px-2 pb-4 pt-2 rounded-2xl transition-all duration-300 cursor-pointer
                    ${isActive ? "bg-[#17B6AE]/5" : "hover:bg-gray-50"}`}
                >
                  {/* Numara çemberi */}
                  <div
                    className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 border-2 transition-all duration-300 font-bold text-sm
                      ${isActive
                        ? "bg-[#17B6AE] border-[#17B6AE] text-white scale-110 shadow-lg shadow-[#17B6AE]/25"
                        : "bg-white border-gray-200 text-slate-400"
                      }`}
                  >
                    {s.num}
                  </div>

                  {/* İlerleme çubuğu (sadece aktif) */}
                  {isActive && (
                    <div className="w-8 h-0.5 bg-gray-100 rounded-full mb-3 overflow-hidden">
                      <div
                        className="h-full bg-[#17B6AE] transition-none"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  )}

                  <span
                    className={`text-xs font-bold uppercase tracking-wide leading-tight transition-colors duration-300
                      ${isActive ? "text-[#17B6AE]" : "text-slate-400"}`}
                  >
                    {s.title}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Detay kartı */}
        <div className="relative overflow-hidden">
          {STEPS.map((s, i) => (
            <div
              key={i}
              className={`transition-all duration-500 ${
                active === i
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-4 absolute inset-0 pointer-events-none"
              }`}
            >
              <div className="bg-white border border-gray-100 rounded-3xl p-8 sm:p-10 shadow-sm flex flex-col sm:flex-row gap-8 items-start">
                <div className="w-16 h-16 rounded-2xl bg-[#17B6AE]/8 flex items-center justify-center flex-shrink-0">
                  {s.icon}
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-[#17B6AE] uppercase tracking-widest mb-2">
                    Adım {s.num}
                  </p>
                  <h3 className="text-2xl font-bold text-slate-800 mb-3">{s.title}</h3>
                  <p className="text-slate-500 leading-relaxed mb-6 max-w-xl">{s.body}</p>
                  <div className="flex gap-2 flex-wrap">
                    {s.tags.map((t) => (
                      <span
                        key={t}
                        className="text-xs font-medium bg-gray-50 border border-gray-100 text-slate-500 px-3 py-1.5 rounded-lg"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Adım göstergesi */}
                <div className="hidden sm:flex flex-col gap-1.5 flex-shrink-0 pt-1">
                  {STEPS.map((_, j) => (
                    <button
                      key={j}
                      onClick={() => goTo(j)}
                      className={`w-1.5 rounded-full transition-all duration-300 ${
                        j === active
                          ? "h-8 bg-[#17B6AE]"
                          : "h-1.5 bg-gray-200 hover:bg-gray-300"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}