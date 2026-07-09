"use client";

import { WordsReveal, FadeInView } from "@/components/motion/Reveal";

const PLANS = [
  {
    name: "Bireysel",
    price: "100 TL",
    unit: "/ mülk / ay",
    desc: "1-15 mülk arasındaki portföyler için.",
    features: ["1-15 mülk", "Sınırsız kiracı", "Otomatik bildirimler", "Finansal raporlar"],
    cta: "Hemen Başla",
    highlight: false,
  },
  {
    name: "Büyüyen Portföy",
    price: "75 TL",
    unit: "/ mülk / ay",
    desc: "16-30 mülk arasındaki portföyler için.",
    features: ["16-30 mülk", "Sınırsız kiracı", "Otomatik bildirimler", "Finansal raporlar", "Öncelikli destek"],
    cta: "Hemen Başla",
    highlight: true,
  },
  {
    name: "Kurumsal",
    price: "Özel Teklif",
    unit: "",
    desc: "30'un üzerindeki portföyler için.",
    features: ["30+ mülk", "Özel fiyatlandırma", "Öncelikli destek", "Profesyonel yönetim danışmanlığı"],
    cta: "Bize Ulaşın",
    highlight: false,
  },
];

export default function PricingSection() {
  return (
    <section id="paketler" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="inline-block text-xs font-bold text-[#17B6AE] bg-[#17B6AE]/10 px-4 py-1.5 rounded-full mb-4 uppercase tracking-widest">
            Fiyatlandırma
          </span>
          <WordsReveal
            as="h2"
            text="Basit, Şeffaf Fiyatlandırma"
            className="text-4xl font-bold text-slate-800 leading-tight block"
          />
          <p className="text-slate-500 mt-3 text-base">
            Tüm planlar 45 gün ücretsiz deneme ile gelir — kredi kartı gerekmez.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {PLANS.map((plan, i) => (
            <FadeInView key={plan.name} delay={i * 0.1}>
              <div
                className={`rounded-3xl p-8 h-full flex flex-col ${
                  plan.highlight
                    ? "bg-slate-900 text-white shadow-2xl shadow-slate-900/20 scale-[1.03]"
                    : "bg-white border border-gray-100 text-slate-800 shadow-sm"
                }`}
              >
                {plan.highlight && (
                  <span className="inline-block text-[10px] font-bold text-[#17B6AE] bg-[#17B6AE]/15 px-3 py-1 rounded-full mb-4 uppercase tracking-widest w-fit">
                    En Çok Tercih Edilen
                  </span>
                )}
                <h3 className={`text-lg font-semibold mb-1 ${plan.highlight ? "text-white" : "text-slate-800"}`}>
                  {plan.name}
                </h3>
                <p className={`text-sm mb-6 ${plan.highlight ? "text-slate-400" : "text-slate-500"}`}>{plan.desc}</p>
                <div className="mb-6">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  {plan.unit && (
                    <span className={`text-sm ml-1 ${plan.highlight ? "text-slate-400" : "text-slate-500"}`}>{plan.unit}</span>
                  )}
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-3 text-sm">
                      <span
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${
                          plan.highlight ? "bg-[#17B6AE] text-white" : "bg-[#17B6AE]/10 text-[#17B6AE]"
                        }`}
                      >
                        ✓
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>
                <a
                  href={plan.cta === "Bize Ulaşın" ? "#sss" : "/register"}
                  className={`text-center font-semibold px-6 py-3.5 rounded-xl transition text-sm ${
                    plan.highlight
                      ? "bg-[#17B6AE] hover:bg-[#149891] text-white"
                      : "bg-slate-900 hover:bg-slate-800 text-white"
                  }`}
                >
                  {plan.cta}
                </a>
              </div>
            </FadeInView>
          ))}
        </div>
      </div>
    </section>
  );
}
