
"use client";

import { useState } from "react";

const FAQS = [
  {
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="w-10 h-10">
        <circle cx="24" cy="24" r="24" fill="#17B6AE" fillOpacity="0.10"/>
        <path d="M16 20h16M16 24h10" stroke="#17B6AE" strokeWidth="2.5" strokeLinecap="round"/>
        <circle cx="34" cy="34" r="7" fill="#17B6AE"/>
        <path d="M34 31v3.5l2 1.5" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    ),
    q: "Kira takibi sistemi fiyatland\u0131rmas\u0131 nas\u0131l?",
    a: "Bireysel kullan\u0131c\u0131lar i\u00e7in Mizan M\u00fclk Y\u00f6netimi 100 \u20bfm\u00fclk/ay\u2019dan ba\u015flar. 1-15 m\u00fclk aras\u0131nda m\u00fclk ba\u015f\u0131na 100 \u20bfay, 16-30 m\u00fclk aras\u0131nda t\u00fcm m\u00fclkleriniz i\u00e7in 75 \u20bfm\u00fclk/ay olarak hesaplan\u0131r. 30\u2019un \u00fczerindeki portf\u00f6yler i\u00e7in \u00f6zel kurumsal teklif sunulur. T\u00fcm planlar 45 g\u00fcnl\u00fck \u00fccretsiz denemeyle gelir.",
  },
  {
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="w-10 h-10">
        <circle cx="24" cy="24" r="24" fill="#17B6AE" fillOpacity="0.10"/>
        <rect x="15" y="13" width="18" height="22" rx="3" stroke="#17B6AE" strokeWidth="2.2"/>
        <path d="M19 20h10M19 24h10M19 28h6" stroke="#17B6AE" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    q: "Verilerim g\u00fcvende mi?",
    a: "T\u00fcm verileriniz SSL \u015fifreleme ile korunur ve d\u00fczzenli olarak yedeklenir. Sunucular\u0131m\u0131z T\u00fcrkiye\u2019de yer almaktad\u0131r. Ki\u015fisel ve finansal bilgileriniz \u00fc\u00e7\u00fcnc\u00fc taraflarla payla\u015f\u0131lmaz; KVKK kapsam\u0131nda tam uyumluluk sa\u011flanmaktad\u0131r.",
  },
  {
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="w-10 h-10">
        <circle cx="24" cy="24" r="24" fill="#17B6AE" fillOpacity="0.10"/>
        <path d="M24 14v10l6 4" stroke="#17B6AE" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="24" cy="24" r="10" stroke="#17B6AE" strokeWidth="2.2"/>
      </svg>
    ),
    q: "Raporlama \u00f6zellikleri nelerdir?",
    a: "Mizan M\u00fclk Y\u00f6netimi ile kiraci \u00f6deme durumu, geciken kira listesi, m\u00fclk doluluk oran\u0131, ayl\u0131k/y\u0131ll\u0131k gelir-gider \u00f6zeti ve tahsilat performans\u0131 gibi y\u00f6netim verilerini raporlayabilirsiniz.",
  },
  {
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="w-10 h-10">
        <circle cx="24" cy="24" r="24" fill="#17B6AE" fillOpacity="0.10"/>
        <rect x="13" y="17" width="22" height="15" rx="3" stroke="#17B6AE" strokeWidth="2.2"/>
        <path d="M13 22h22" stroke="#17B6AE" strokeWidth="2" strokeLinecap="round"/>
        <circle cx="18" cy="28" r="1.5" fill="#17B6AE"/>
        <circle cx="24" cy="28" r="1.5" fill="#17B6AE"/>
      </svg>
    ),
    q: "Kiraci\u2019ma nas\u0131l \u00f6deme linki g\u00f6nderebilirim?",
    a: "Profesyonel M\u00fclk Y\u00f6netimi hizmetini kullanan m\u00fc\u015fterilerimiz, kiraci\u0131lar\u0131na iyzico altyap\u0131s\u0131 \u00fczerinden g\u00fcvenli \u00f6deme linki g\u00f6nderebilir. Kiraci herhangi bir uygulama indirmeye gerek kalmadan kredi kart\u0131yla \u00f6deme yapabilir.",
  },
  {
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="w-10 h-10">
        <circle cx="24" cy="24" r="24" fill="#17B6AE" fillOpacity="0.10"/>
        <rect x="17" y="11" width="14" height="26" rx="4" stroke="#17B6AE" strokeWidth="2.2"/>
        <circle cx="24" cy="33" r="1.5" fill="#17B6AE"/>
      </svg>
    ),
    q: "Mobil uygulama var m\u0131?",
    a: "iOS ve Android uygulamalar\u0131m\u0131z yak\u0131nda yay\u0131nlanacakt\u0131r. \u015eu an i\u00e7in web taray\u0131c\u0131s\u0131 \u00fczerinden mobil uyumlu aray\u00fczm\u00fcz\u00fc kullanabilirsiniz.",
  },
];

export default function FaqContact() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", consent: false });
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setSent(true);
    } catch {
      setSent(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section id="sss" className="py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-20">

          {/* SOL */}
          <div>
            <span className="inline-block text-xs font-bold text-[#17B6AE] bg-[#17B6AE]/10 px-4 py-1.5 rounded-full mb-4 uppercase tracking-widest">S\u0131k Sorulan Sorular
            </span>
            <h2 className="text-4xl font-bold text-slate-800 mb-3 leading-tight">
              Mizan M\u00fclk ile ilgili en \u00e7ok sorulan sorular
            </h2>
            <p className="text-slate-500 text-base mb-10 leading-relaxed">
              Sorular\u0131n\u0131z\u0131n yan\u0131tlar\u0131n\u0131 burada bulabilirsiniz. Daha fazla yard\u0131m isterseniz, destek ekibimiz her zaman yan\u0131n\u0131zda.
            </p>
            <div className="space-y-3">
              {FAQS.map((faq, i) => (
                <div
                  key={i}
                  className={`rounded-2xl overflow-hidden border transition-all duration-200 ${openIndex === i ? "border-[#17B6AE]/40 shadow-md bg-white" : "border-gray-200 bg-white hover:border-[#17B6AE]/30 hover:shadow-sm"}`}
                >
                  <button
                    className="w-full flex items-center gap-4 px-5 py-4 text-left"
                    onClick={() => setOpenIndex(openIndex === i ? null : i)}
                  >
                    <div className="flex-shrink-0">{faq.icon}</div>
                    <span className="font-bold text-slate-800 text-base flex-1 pr-2">{faq.q}</span>
                    <span className={`text-[#17B6AE] text-2xl font-light flex-shrink-0 transition-transform duration-200 ${openIndex === i ? "rotate-45" : ""}`}>
                      +
                    </span>
                  </button>
                  {openIndex === i && (
                    <div className="px-5 pb-5 text-sm text-slate-600 leading-relaxed border-t border-gray-100 pt-4 ml-14">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          {/* SAG */}
          <div>
            <span className="inline-block text-xs font-bold text-[#17B6AE] bg-[#17B6AE]/10 px-4 py-1.5 rounded-full mb-4 uppercase tracking-widest">
              Bize Ula\u015f\u0131n
            </span>
            <h2 className="text-4xl font-bold text-slate-800 mb-6 leading-tight">
              \u0130leti\u015fim Bilgileri
            </h2>
            <div className="space-y-4 mb-8">
              <div className="flex items-start gap-4 bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-[#17B6AE]/10 flex items-center justify-center flex-shrink-0 text-[#17B6AE] text-lg">📍 </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Adres</p>
                  <p className="text-sm text-slate-700 font-medium leading-relaxed">Akabe Mah. \u015eehit Furkan Do\u011fan Cad. Adalet Plaza B Blok No:11/206 Karatay / KONYA</p>
                </div>
              </div>
              <div className="flex items-center gap-4 bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-[#17B6AE]/10 flex items-center justify-center flex-shrink-0 text-[#17B6AE] text-lg">✉㸏</div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">E-posta</p>
                  <a href="mailto:bilgi@mizanmulkyonetimi.com" className="text-sm font-semibold text-[#17B6AE] hover:underline">bilgi@mizanmulkyonetimi.com</a>
                </div>
              </div>
            </div>
            {sent ? (
              <div className="bg-[#17B6AE]/10 border border-[#17B6AE]/20 rounded-3xl p-8 text-center">
                <div className="text-4xl mb-3">✅</div>
                <p className="font-bold text-lg text-slate-800">Talebiniz al\u0131nd\u0131!</p>
                <p className="text-sm text-slate-500 mt-1">En k\u0131sa s\u00fcrede sizi arayaca\u011f\u0131z.</p>
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
                <p className="text-base font-bold text-slate-800 mb-5">Telefon numaran\u0131z\u0131 b\u0131rak\u0131n, en k\u0131sa s\u00fcrede sizi arayal\u0131m.</p>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Ad\u0131n\u0131z Soyad\u0131n\u0131z *</label>
                    <input type="text" required placeholder="Ad\u0131n\u0131z Soyad\u0131n\u0131z" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#17B6AE]" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Telefon Numaran\u0131z *</label>
                    <div className="flex gap-2">
                      <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-3 text-sm font-semibold text-slate-600 flex-shrink-0">🇷🇹 +90</div>
                      <input type="tel" required placeholder="5XX XXX XX XX" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#17B6AE]" />
                    </div>
                  </div>
                  <label className="flex items-start gap-3 text-xs text-slate-500 cursor-pointer">
                    <input type="checkbox" className="mt-0.5 flex-shrink-0 w-4 h-4 accent-[#17B6AE]" checked={form.consent} onChange={(e) => setForm({ ...form, consent: e.target.checked })} />
                    <span>Mizan M\u00fclk Y\u00f6netimi kampanyalar\u0131 hakk\u0131nda anlk/k\u0131sa mesaj, e-posta ve telefon arac\u0131l\u0131\u011f\u0131yla{" "}<a href="https://www.ehane.com/ticari-riza-metni/" target="_blank" rel="noopener noreferrer" className="text-[#17B6AE] underline font-semibold">elektronik ileti</a>{" "}almak istiyorum.</span>
                  </label>
                  <button type="submit" disabled={loading} className="w-full bg-[#17B6AE] hover:bg-[#149891] text-white font-bold py-3.5 rounded-xl transition disabled:opacity-60 text-sm tracking-wide shadow-lg shadow-[#17B6AE]/20">{loading ? "G\u00f6nderiliyor..." : "Teklif Al \u2192"}</button>
                  <p className="text-[10px] text-slate-400 text-center leading-relaxed">Ki\u015fisel verileriniz, 6698 say\u0131l\u0131 KVKK kapsam\u0131nda bilgi talebinizin de\u011ferlendirilmesi amac\u0131yla i\u015flenmektedir.</p>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
