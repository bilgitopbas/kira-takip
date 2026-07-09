"use client";

import { motion } from "framer-motion";
import { WordsReveal } from "@/components/motion/Reveal";

const HERO_BENEFITS = ["Kullanıcı Dostu Arayüz", "Bulut Tabanlı Erişim", "Güvenli Altyapı"];

export default function HeroSection() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-24">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <motion.span
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-block text-xs font-bold text-[#17B6AE] bg-[#17B6AE]/10 px-4 py-1.5 rounded-full mb-6 uppercase tracking-widest"
        >
          Kira Takip Yazılımı
        </motion.span>

        <WordsReveal
          as="h1"
          text="Kira Takibinde Yeni Dönem"
          className="text-4xl sm:text-6xl font-bold text-slate-900 leading-tight mb-6 block"
          step={0.06}
          duration={0.7}
        />

        <WordsReveal
          as="p"
          text="Mülklerinizi, kiracılarınızı ve tahsilatlarınızı tek ekrandan yönetin. Gecikmeleri asla kaçırmayın."
          className="text-lg sm:text-xl text-slate-500 leading-relaxed mb-8 block"
          delay={0.5}
          step={0.03}
          duration={0.5}
        />

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.1 }}
          className="flex flex-wrap items-center justify-center gap-3 mb-8"
        >
          {HERO_BENEFITS.map((item) => (
            <span
              key={item}
              className="flex items-center gap-2 text-sm text-slate-600 bg-white border border-gray-100 rounded-full px-4 py-2 shadow-sm"
            >
              <span className="w-4 h-4 rounded-full bg-[#17B6AE]/10 text-[#17B6AE] flex items-center justify-center text-[10px]">✓</span>
              {item}
            </span>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.3 }}
          className="flex flex-wrap items-center justify-center gap-4"
        >
          <a
            href="/register"
            className="bg-[#17B6AE] hover:bg-[#149891] text-white font-semibold px-7 py-4 rounded-xl transition text-base shadow-lg shadow-[#17B6AE]/20"
          >
            45 Gün Ücretsiz Deneyin
          </a>
          <a
            href="#neler-yapiyoruz"
            className="text-[#17B6AE] font-semibold px-7 py-4 rounded-xl border border-[#17B6AE] hover:bg-[#17B6AE]/5 transition text-base"
          >
            Nasıl Çalışır?
          </a>
        </motion.div>
      </div>

      {/* macOS tarzı ürün mockup */}
      <motion.div
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, delay: 1.6, ease: "easeOut" }}
        className="max-w-5xl mx-auto"
      >
        <div className="rounded-2xl overflow-hidden shadow-2xl shadow-slate-900/10 border border-gray-100 bg-white">
          <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-100">
            <span className="w-3 h-3 rounded-full bg-red-400" />
            <span className="w-3 h-3 rounded-full bg-amber-400" />
            <span className="w-3 h-3 rounded-full bg-emerald-400" />
            <span className="ml-4 text-xs text-slate-400 bg-white border border-gray-100 rounded-md px-3 py-1">
              app.mizanmulkyonetimi.com/dashboard
            </span>
          </div>
          <img
            src="/dashboard-preview.png"
            alt="Mizan Mülk Yönetimi Kontrol Paneli"
            className="w-full h-auto block"
          />
        </div>
        <p className="text-center text-xs text-slate-400 mt-4">
          Gerçek panelden — kurulum yok, tek tıkla başlayın
        </p>
      </motion.div>
    </section>
  );
}
