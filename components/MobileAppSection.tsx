"use client";

import { WordsReveal, FadeInView } from "@/components/motion/Reveal";

function AppleLogo() {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
      <path d="M16.365 1.43c0 1.14-.493 2.27-1.177 3.08-.744.9-1.99 1.57-2.987 1.57-.12 0-.23-.02-.3-.03-.01-.06-.04-.22-.04-.39 0-1.15.572-2.27 1.206-2.98.804-.94 2.142-1.64 3.248-1.68.03.13.05.28.05.43zm4.565 15.71c-.03.07-.463 1.58-1.518 3.12-.94 1.36-1.94 2.71-3.43 2.71-1.517 0-1.9-.88-3.63-.88-1.698 0-2.302.91-3.67.91-1.377 0-2.35-1.26-3.428-2.8-1.287-1.87-2.312-4.78-2.312-7.55 0-4.44 2.892-6.79 5.75-6.79 1.47 0 2.688.95 3.616.95.87 0 2.213-1.01 3.858-1.01.62 0 2.86.06 4.335 2.18-.117.08-2.586 1.52-2.586 4.63 0 3.72 3.288 5.03 3.325 5.05z" />
    </svg>
  );
}

function GooglePlayLogo() {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none">
      <path
        d="M5 3.5c-.4.3-.6.8-.6 1.4v14.2c0 .6.2 1.1.6 1.4l.1.06L13.5 12l-8.4-8.56L5 3.5z"
        fill="#17B6AE"
      />
      <path
        d="M13.5 12l3.2 3.2 5.1-2.9c.7-.4.7-1.4 0-1.8l-5.1-2.9L13.5 12z"
        fill="#149891"
      />
      <path d="M5.1 20.94c.34.24.83.26 1.36-.05l10.24-5.8L13.5 12l-8.4 8.94z" fill="#0d7a74" />
      <path d="M16.7 8.9L6.46 3.1c-.53-.3-1.02-.28-1.36-.05L13.5 12l3.2-3.1z" fill="#1cc9c0" />
    </svg>
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

          <div className="flex flex-wrap gap-4">
            <a
              href="/register"
              className="flex items-center gap-3 bg-white hover:bg-gray-100 text-slate-900 px-5 py-3 rounded-2xl transition border border-transparent"
            >
              <AppleLogo />
              <span className="text-left leading-tight">
                <span className="block text-[10px] text-slate-500">Download on the</span>
                <span className="block text-base font-semibold -mt-0.5">App Store</span>
              </span>
            </a>
            <a
              href="/register"
              className="flex items-center gap-3 bg-white hover:bg-gray-100 text-slate-900 px-5 py-3 rounded-2xl transition border border-transparent"
            >
              <GooglePlayLogo />
              <span className="text-left leading-tight">
                <span className="block text-[10px] text-slate-500 tracking-wide">GET IT ON</span>
                <span className="block text-base font-semibold -mt-0.5">Google Play</span>
              </span>
            </a>
          </div>
        </div>

        <FadeInView className="flex justify-center">
          <div className="relative w-[260px] h-[540px]">
            <div className="absolute inset-0 bg-black rounded-[3rem] p-3 shadow-2xl">
              <div className="absolute top-3 left-1/2 -translate-x-1/2 w-24 h-6 bg-black rounded-full z-10" />
              <div className="relative w-full h-full bg-white rounded-[2.3rem] overflow-hidden">
                <img
                  src="/mobile-preview.png"
                  alt="Mizan Mülk Yönetimi Mobil Uygulama"
                  className="w-full h-full object-cover object-top"
                />
              </div>
            </div>
          </div>
        </FadeInView>
      </div>
    </section>
  );
}
