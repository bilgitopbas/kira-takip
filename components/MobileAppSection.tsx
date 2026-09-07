"use client";

import { motion } from "framer-motion";
import { WordsReveal, FadeInView } from "@/components/motion/Reveal";

// Her iki magaza rozetinin ortak kabugu: siyah zemin, ince acik kenarlik.
const ROZET =
  "inline-flex items-center gap-3 bg-black hover:bg-neutral-900 text-white px-5 py-2.5 rounded-xl border border-white/35 transition min-w-[178px]";

function AppleLogo() {
  return (
    <svg viewBox="0 0 24 24" className="w-7 h-7 flex-shrink-0" fill="currentColor" aria-hidden="true">
      <path d="M16.365 1.43c0 1.14-.493 2.27-1.177 3.08-.744.9-1.99 1.57-2.987 1.57-.12 0-.23-.02-.3-.03-.01-.06-.04-.22-.04-.39 0-1.15.572-2.27 1.206-2.98.804-.94 2.142-1.64 3.248-1.68.03.13.05.28.05.43zm4.565 15.71c-.03.07-.463 1.58-1.518 3.12-.94 1.36-1.94 2.71-3.43 2.71-1.517 0-1.9-.88-3.63-.88-1.698 0-2.302.91-3.67.91-1.377 0-2.35-1.26-3.428-2.8-1.287-1.87-2.312-4.78-2.312-7.55 0-4.44 2.892-6.79 5.75-6.79 1.47 0 2.688.95 3.616.95.87 0 2.213-1.01 3.858-1.01.62 0 2.86.06 4.335 2.18-.117.08-2.586 1.52-2.586 4.63 0 3.72 3.288 5.03 3.325 5.05z" />
    </svg>
  );
}

// Google Play logosunun renkleri marka kurallari geregi degistirilemez;
// resmi dort renk kullanilir (onceden site turkuazina boyanmisti).
function GooglePlayLogo() {
  return (
    <svg viewBox="0 0 24 24" className="w-7 h-7 flex-shrink-0" fill="none" aria-hidden="true">
      <path
        d="M5 3.5c-.4.3-.6.8-.6 1.4v14.2c0 .6.2 1.1.6 1.4l.1.06L13.5 12l-8.4-8.56L5 3.5z"
        fill="#00A0FF"
      />
      <path
        d="M13.5 12l3.2 3.2 5.1-2.9c.7-.4.7-1.4 0-1.8l-5.1-2.9L13.5 12z"
        fill="#FFC900"
      />
      <path d="M5.1 20.94c.34.24.83.26 1.36-.05l10.24-5.8L13.5 12l-8.4 8.94z" fill="#FF3A44" />
      <path d="M16.7 8.9L6.46 3.1c-.53-.3-1.02-.28-1.36-.05L13.5 12l3.2-3.1z" fill="#00E676" />
    </svg>
  );
}

function DeviceShowcase() {
  return (
    <div className="relative w-full max-w-[560px] h-[360px] sm:h-[440px] mx-auto flex items-center justify-center">
      {/* Arka planda yumuşak turkuaz parıltı */}
      <div className="absolute w-72 h-72 bg-[#17B6AE]/25 rounded-full blur-3xl" />

      {/* iPad — merkezde */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        whileInView={{ opacity: 1, scale: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
        className="relative z-10 w-[230px] sm:w-[340px] lg:w-[380px]"
      >
        <div className="relative bg-black rounded-[1.4rem] sm:rounded-[1.75rem] p-[7px] sm:p-[10px] shadow-2xl shadow-black/50">
          <span className="absolute top-1 sm:top-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-slate-700 z-10" />
          <div className="relative w-full aspect-[2360/1640] rounded-[0.9rem] sm:rounded-[1.15rem] overflow-hidden bg-white">
            <img
              src="/ipad-preview.png"
              alt="Mizan Mülk Yönetimi iPad görünümü"
              className="w-full h-full object-cover object-top"
            />
          </div>
        </div>
      </motion.div>

      {/* Sol iPhone */}
      <motion.div
        initial={{ opacity: 0, x: -50, rotate: 0 }}
        whileInView={{ opacity: 1, x: 0, rotate: -12 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
        className="absolute left-[-6px] sm:left-[-18px] bottom-0 z-20 w-[86px] sm:w-[128px] origin-bottom-right"
      >
        <div className="animate-float bg-black rounded-[1.3rem] sm:rounded-[1.8rem] p-[5px] sm:p-[7px] shadow-2xl shadow-black/60">
          <span className="absolute top-1.5 sm:top-2 left-1/2 -translate-x-1/2 w-6 sm:w-9 h-2.5 sm:h-3.5 bg-black rounded-full z-10" />
          <div className="relative w-full aspect-[1179/2556] rounded-[1rem] sm:rounded-[1.4rem] overflow-hidden bg-white">
            <img
              src="/iphone-preview-1.png"
              alt="Mizan Mülk Yönetimi mobil kontrol paneli"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </motion.div>

      {/* Sağ iPhone */}
      <motion.div
        initial={{ opacity: 0, x: 50, rotate: 0 }}
        whileInView={{ opacity: 1, x: 0, rotate: 12 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 0.65, ease: "easeOut" }}
        className="absolute right-[-6px] sm:right-[-18px] bottom-0 z-20 w-[86px] sm:w-[128px] origin-bottom-left"
      >
        <div
          className="animate-float bg-black rounded-[1.3rem] sm:rounded-[1.8rem] p-[5px] sm:p-[7px] shadow-2xl shadow-black/60"
          style={{ animationDelay: "-2s" }}
        >
          <span className="absolute top-1.5 sm:top-2 left-1/2 -translate-x-1/2 w-6 sm:w-9 h-2.5 sm:h-3.5 bg-black rounded-full z-10" />
          <div className="relative w-full aspect-[1179/2556] rounded-[1rem] sm:rounded-[1.4rem] overflow-hidden bg-white">
            <img
              src="/iphone-preview-2.png"
              alt="Mizan Mülk Yönetimi mobil blog görünümü"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function MobileAppSection() {
  return (
    <section className="bg-slate-900 py-24 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <span className="inline-block text-xs font-bold text-[#17B6AE] bg-[#17B6AE]/10 px-4 py-1.5 rounded-full mb-6 uppercase tracking-widest">
            Mobil Uygulama
          </span>
          <WordsReveal
            as="h2"
            text="Mülkleriniz artık cebinizde."
            className="text-3xl sm:text-4xl font-bold text-white leading-tight mb-4 block"
          />
          <p className="text-slate-400 text-lg leading-relaxed mb-8 max-w-md">
            Nerede olursanız olun, kontrol sizde. Ofisten çıkın, tahsilatı görün,
            bildirimi anında alın — Mizan Mülk Yönetimi artık cebinizde.
          </p>

          {/* Magaza rozetleri: her iki magazanin resmi Turkce rozet duzeni
              (Apple'da buyuk satir ustte, Google'da altta) ve siyah zemin. */}
          <div className="flex flex-wrap gap-4">
            <a
              href="https://apps.apple.com/tr/app/mizan-m%C3%BClk-y%C3%B6netimi/id6759964652"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Mizan Mülk Yönetimi'ni App Store'dan indirin"
              className={ROZET}
            >
              <AppleLogo />
              <span className="text-left leading-none">
                <span className="block text-[19px] font-semibold tracking-tight">
                  App Store&apos;dan
                </span>
                <span className="block text-[11px] font-normal mt-1 text-white/90">İndirin</span>
              </span>
            </a>
            <a
              href="https://play.google.com/store/apps/details?id=com.mizanmulkyonetimi.app&hl=tr"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Mizan Mülk Yönetimi'ni Google Play'den indirin"
              className={ROZET}
            >
              <GooglePlayLogo />
              <span className="text-left leading-none">
                <span className="block text-[11px] font-normal uppercase tracking-[0.12em] text-white/90">
                  İndirin
                </span>
                <span className="block text-[19px] font-semibold tracking-tight mt-1">
                  Google Play
                </span>
              </span>
            </a>
          </div>
        </div>

        <FadeInView className="flex justify-center">
          <DeviceShowcase />
        </FadeInView>
      </div>
    </section>
  );
}
