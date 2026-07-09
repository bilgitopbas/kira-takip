"use client";

import { WordsReveal, FadeInView } from "@/components/motion/Reveal";

const FEATURES = [
  {
    icon: "📊",
    color: "from-[#17B6AE] to-[#0d8b84]",
    title: "Excel ile Toplu İçe Aktarma",
    desc: "Mevcut mülk ve kiracı listenizi Excel dosyanızdan tek seferde sisteme aktarın. Elle tek tek girmeye gerek yok.",
  },
  {
    icon: "🔔",
    color: "from-blue-500 to-blue-700",
    title: "Otomatik Bildirim Sistemi",
    desc: "Geciken ödemeler, yaklaşan zam dönemleri ve önemli tarihler için anlık bildirim alın — hiçbir şeyi kaçırmayın.",
  },
  {
    icon: "📈",
    color: "from-amber-500 to-amber-700",
    title: "Aylık / Yıllık Finansal Raporlar",
    desc: "Tahsilat oranınızı, mülk bazlı gelir kırılımınızı ve tüm ödeme geçmişinizi tek tıkla raporlayın, Excel'e aktarın.",
  },
  {
    icon: "🗂️",
    color: "from-violet-500 to-violet-700",
    title: "Kira Sözleşmelerini Dijital Saklama",
    desc: "Tüm sözleşme ve evraklarınız güvenli bulutta saklanır, ihtiyaç duyduğunuz anda tek tıkla erişirsiniz.",
  },
  {
    icon: "🏢",
    color: "from-rose-500 to-rose-700",
    title: "Mülk & Kiracı Yönetimi",
    desc: "Tüm taşınmazlarınızı ve kiracılarınızı tek merkezden, doluluk durumuyla birlikte kolayca yönetin.",
  },
  {
    icon: "🧮",
    color: "from-slate-500 to-slate-700",
    title: "Kira Artış Hesaplama",
    desc: "TÜİK verileriyle güncel kira artış oranını otomatik hesaplayın.",
  },
];

export default function FeatureGrid() {
  return (
    <section id="neler-yapiyoruz" className="bg-gray-50 py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <WordsReveal
          as="h2"
          text="Neler Yapıyoruz?"
          className="text-3xl font-semibold text-slate-800 text-center mb-12 block"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f, i) => (
            <FadeInView key={f.title} delay={i * 0.08}>
              <div className="group bg-white rounded-3xl border border-gray-100 p-8 h-full hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${f.color} flex items-center justify-center text-2xl shadow-lg mb-5`}>
                  {f.icon}
                </div>
                <h3 className="font-semibold text-slate-800 text-lg mb-2 group-hover:text-[#17B6AE] transition">
                  {f.title}
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            </FadeInView>
          ))}
        </div>
      </div>
    </section>
  );
}
