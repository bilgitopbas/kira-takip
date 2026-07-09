"use client";

import { WordsReveal, FadeInView } from "@/components/motion/Reveal";
import TiltCard from "@/components/motion/TiltCard";

const TENANTS = [
  { initials: "DA", color: "bg-blue-100 text-blue-600", name: "Deniz Aydın", property: "Ataşehir Daire", status: "Ödendi", statusStyle: "bg-emerald-100 text-emerald-600", amount: "24.000 ₺" },
  { initials: "BŞ", color: "bg-amber-100 text-amber-600", name: "Burak Şahin", property: "Maslak Ofis", status: "2 gün geç", statusStyle: "bg-red-100 text-red-600", amount: "41.500 ₺" },
  { initials: "CY", color: "bg-violet-100 text-violet-600", name: "Cemre Yıldız", property: "Nişantaşı Daire", status: "Yarın", statusStyle: "bg-amber-100 text-amber-600", amount: "29.000 ₺" },
];

const PROPERTIES = [
  { id: "101", name: "Ataşehir Daire", loc: "İstanbul · 3+1", status: "Kirada" },
  { id: "102", name: "Maslak Ofis", loc: "İstanbul · 120m²", status: "Kirada" },
  { id: "103", name: "Nişantaşı Daire", loc: "İstanbul · 2+1", status: "Kirada" },
  { id: "104", name: "Konak Daire", loc: "İzmir · 3+1", status: "Boş" },
  { id: "105", name: "Alsancak Ofis", loc: "İzmir · 90m²", status: "Kirada" },
];

export default function FeatureGrid() {
  return (
    <section id="neler-yapiyoruz" className="bg-gray-50 py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="inline-block text-xs font-bold text-[#17B6AE] bg-[#17B6AE]/10 px-4 py-1.5 rounded-full mb-4 uppercase tracking-widest">
            Neler Yapıyoruz?
          </span>
          <WordsReveal
            as="h2"
            text="Karmaşık tablolara değil, tek panele ihtiyacınız var."
            className="text-3xl sm:text-4xl font-bold text-slate-800 leading-tight block"
          />
          <p className="text-slate-500 mt-4">
            Kiracı takibinden tahsilata, mülk yönetiminden raporlamaya — Mizan Mülk Yönetimi
            tüm süreçlerinizi tek ekranda birleştirir, size sadece kontrol etmek kalır.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 lg:grid-rows-2 gap-5">
          {/* Büyük kart: Kiracı Takibi */}
          <FadeInView className="lg:col-span-2 lg:row-start-1">
            <TiltCard className="h-full rounded-3xl bg-gradient-to-br from-[#17B6AE]/10 to-[#17B6AE]/[0.03] border border-[#17B6AE]/10 p-8">
              <div className="flex items-start justify-between mb-6">
                <div className="w-11 h-11 rounded-2xl bg-white text-[#17B6AE] flex items-center justify-center shadow-sm">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
                  </svg>
                </div>
                <span className="text-[10px] font-bold text-[#17B6AE] bg-white px-2.5 py-1 rounded-full uppercase tracking-widest shadow-sm">
                  En Çok Kullanılan
                </span>
              </div>
              <h3 className="text-xl font-semibold text-slate-800 mb-2">
                Profesyonel <span className="text-[#17B6AE]">kiracı takibi</span>
              </h3>
              <p className="text-sm text-slate-500 mb-6 max-w-md">
                Tüm kiracıların — ödemeler, sözleşmeler, bakiyeler tek ekranda. Kim ödedi, kim geçti, anında gör.
              </p>
              <div className="space-y-2.5">
                {TENANTS.map((t) => (
                  <div key={t.name} className="flex items-center justify-between bg-white rounded-2xl px-4 py-3 shadow-sm">
                    <div className="flex items-center gap-3">
                      <span className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold ${t.color}`}>
                        {t.initials}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{t.name}</p>
                        <p className="text-xs text-slate-400">{t.property}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${t.statusStyle}`}>{t.status}</span>
                      <span className="text-sm font-semibold text-slate-700">{t.amount}</span>
                    </div>
                  </div>
                ))}
              </div>
            </TiltCard>
          </FadeInView>

          {/* Sağ, uzun kart: Mülk Yönetimi */}
          <FadeInView delay={0.1} className="lg:col-start-3 lg:row-span-2">
            <TiltCard className="h-full rounded-3xl bg-white border border-gray-100 p-8 shadow-sm">
              <div className="w-11 h-11 rounded-2xl bg-[#17B6AE]/10 text-[#17B6AE] flex items-center justify-center mb-6">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 21V12h6v9" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-slate-800 mb-2">Kapsamlı mülk yönetimi</h3>
              <p className="text-sm text-slate-500 mb-6">
                Her mülk için sözleşme, doluluk durumu, kiracı bilgisi — hepsi tek yerde, güvende.
              </p>
              <div className="space-y-2">
                {PROPERTIES.map((p) => (
                  <div key={p.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-3.5 py-2.5">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-bold text-slate-400">{p.id}</span>
                      <div>
                        <p className="text-xs font-semibold text-slate-700">{p.name}</p>
                        <p className="text-[10px] text-slate-400">{p.loc}</p>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        p.status === "Kirada" ? "bg-emerald-100 text-emerald-600" : "bg-slate-200 text-slate-500"
                      }`}
                    >
                      {p.status}
                    </span>
                  </div>
                ))}
              </div>
            </TiltCard>
          </FadeInView>

          {/* Küçük kart: Finansal Raporlama */}
          <FadeInView delay={0.15} className="lg:row-start-2">
            <TiltCard className="h-full rounded-3xl bg-white border border-gray-100 p-8 shadow-sm">
              <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center mb-5">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">Finansal raporlama</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Aylık ve yıllık gelir raporları, tahsilat oranı — tek tıkla Excel&apos;e aktarın.
              </p>
            </TiltCard>
          </FadeInView>

          {/* Küçük kart: Bulut Tabanlı Erişim */}
          <FadeInView delay={0.2} className="lg:col-start-2 lg:row-start-2">
            <TiltCard className="h-full rounded-3xl bg-white border border-gray-100 p-8 shadow-sm">
              <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center mb-5">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.5 19H9a5 5 0 110-10 6.5 6.5 0 0112.6 2.1A4.5 4.5 0 0117.5 19z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">Bulut tabanlı erişim</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Bilgisayar, tablet, telefon — her yerden erişin, veriniz güvende.
              </p>
            </TiltCard>
          </FadeInView>
        </div>
      </div>
    </section>
  );
}
