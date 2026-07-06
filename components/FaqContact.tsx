"use client";

import { useState } from "react";

const FAQS = [
  {
    icon: (<svg viewBox="0 0 48 48" fill="none" className="w-10 h-10"><circle cx="24" cy="24" r="24" fill="#17B6AE" fillOpacity="0.10"/><path d="M16 20h16M16 24h10" stroke="#17B6AE" strokeWidth="2.5" strokeLinecap="round"/><circle cx="34" cy="34" r="7" fill="#17B6AE"/><path d="M34 31v3.5l2 1.5" stroke="white" strokeWidth="1.8" strokeLinecap="round"/></svg>),
    q: "Kira takibi sistemi fiyatlandirmasi nasil?",
    a: "Bireysel kullanicilar icin Mizan Mulk Yonetimi 100 TL/mulk/ay'dan baslar. 1-15 mulk arasinda mulk basina 100 TL/ay, 16-30 mulk arasinda tum mulkleriniz icin 75 TL/mulk/ay olarak hesaplanir. 30'un uzerindeki portfoyler icin ozel kurumsal teklif sunulur. Tum planlar 45 gunluk ucretsiz denemeyle gelir.",
  },
  {
    icon: (<svg viewBox="0 0 48 48" fill="none" className="w-10 h-10"><circle cx="24" cy="24" r="24" fill="#17B6AE" fillOpacity="0.10"/><path d="M24 14v10l6 4" stroke="#17B6AE" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/><circle cx="24" cy="24" r="10" stroke="#17B6AE" strokeWidth="2.2"/></svg>),
    q: "Ucretsiz Deneme Suresi ne kadar?",
    a: "Kayit oldugunuz andan itibaren 45 gun boyunca hicbir ucret odemeden tum ozellikleri kullanabilirsiniz. Deneme suresi doldugununda odeme yapmazsaniz hesabiniz salt okunur moda gecer, verileriniz silinmez.",
  },
  {
    icon: (<svg viewBox="0 0 48 48" fill="none" className="w-10 h-10"><circle cx="24" cy="24" r="24" fill="#17B6AE" fillOpacity="0.10"/><rect x="15" y="13" width="18" height="22" rx="3" stroke="#17B6AE" strokeWidth="2.2"/><path d="M19 20h10M19 24h10M19 28h6" stroke="#17B6AE" strokeWidth="2" strokeLinecap="round"/></svg>),
    q: "Verilerim guvende mi?",
    a: "Tum verileriniz SSL sifreleme ile korunur ve duzenli olarak yedeklenir. Kisisel ve finansal bilgileriniz ucuncu taraflarla paylasilmaz; KVKK kapsaminda tam uyumluluk saglanmaktadir.",
  },
  {
    icon: (<svg viewBox="0 0 48 48" fill="none" className="w-10 h-10"><circle cx="24" cy="24" r="24" fill="#17B6AE" fillOpacity="0.10"/><rect x="13" y="17" width="22" height="15" rx="3" stroke="#17B6AE" strokeWidth="2.2"/><path d="M13 22h22" stroke="#17B6AE" strokeWidth="2" strokeLinecap="round"/><circle cx="18" cy="28" r="1.5" fill="#17B6AE"/><circle cx="24" cy="28" r="1.5" fill="#17B6AE"/></svg>),
    q: "Raporlama ozellikleri nelerdir?",
    a: "Mizan Mulk Yonetimi ile kiraci odeme durumu, geciken kira listesi, mulk doluluk orani, aylik/yillik gelir-gider ozeti ve tahsilat performansi gibi yonetim verilerini raporlayabilirsiniz.",
  },
  {
    icon: (<svg viewBox="0 0 48 48" fill="none" className="w-10 h-10"><circle cx="24" cy="24" r="24" fill="#17B6AE" fillOpacity="0.10"/><path d="M24 14c-4.4 0-8 3.6-8 8 0 3 1.6 5.6 4 7v3h8v-3c2.4-1.4 4-4 4-7 0-4.4-3.6-8-8-8z" stroke="#17B6AE" strokeWidth="2.2" strokeLinejoin="round"/><path d="M20 32h8" stroke="#17B6AE" strokeWidth="2" strokeLinecap="round"/></svg>),
    q: "Profesyonel Mulk Yonetimi hizmeti nedir?",
    a: "Kayit sirasinda bu hizmeti secerseniz, ekibimiz sizin adiniza mulk ve kiraci yonetiminde destek saglayabilir. Kiraci takibi, tahsilat hatirlatmalari ve sozlesme sureclerini sizin yerinize yonetebiliriz. Su an ucretsiz olarak sunulmaktadir.",
  },
  {
    icon: (<svg viewBox="0 0 48 48" fill="none" className="w-10 h-10"><circle cx="24" cy="24" r="24" fill="#17B6AE" fillOpacity="0.10"/><rect x="17" y="11" width="14" height="26" rx="4" stroke="#17B6AE" strokeWidth="2.2"/><circle cx="24" cy="33" r="1.5" fill="#17B6AE"/></svg>),
    q: "Mobil uygulama var mi?",
    a: "iOS ve Android uygulamalarimiz yakinda yayinlanacaktir. Su an icin web tarayicisi uzerinden mobil uyumlu arayuzumuzu kullanabilirsiniz.",
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
          <div>
            <span className="inline-block text-xs font-bold text-[#17B6AE] bg-[#17B6AE]/10 px-4 py-1.5 rounded-full mb-4 uppercase tracking-widest">
              Sik Sorulan Sorular
            </span>
            <h2 className="text-4xl font-bold text-slate-800 mb-3 leading-tight">
              En cok sorulan sorular
            </h2>
            <p className="text-slate-500 text-base mb-10 leading-relaxed">
              Sorularinizin yanitlarini burada bulabilirsiniz. Daha fazla yardim isterseniz, destek ekibimiz her zaman yanimizdadir.
            </p>
            <div className="space-y-3">
              {FAQS.map((faq, i) => (
                <div key={i} className={`rounded-2xl overflow-hidden border transition-all duration-200 ${openIndex === i ? "border-[#17B6AE]/40 shadow-md bg-white" : "border-gray-200 bg-white hover:border-[#17B6AE]/30 hover:shadow-sm"}`}>
                  <button className="w-full flex items-center gap-4 px-5 py-4 text-left" onClick={() => setOpenIndex(openIndex === i ? null : i)}>
                    <div className="flex-shrink-0">{faq.icon}</div>
                    <span className="font-bold text-slate-800 text-base flex-1 pr-2">{faq.q}</span>
                    <span className={`text-[#17B6AE] text-2xl font-light flex-shrink-0 transition-transform duration-200 ${openIndex === i ? "rotate-45" : ""}`}>+</span>
                  </button>
                  {openIndex === i && (
                    <div className="px-5 pb-5 text-sm text-slate-600 leading-relaxed border-t border-gray-100 pt-4 ml-14">{faq.a}</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <span className="inline-block text-xs font-bold text-[#17B6AE] bg-[#17B6AE]/10 px-4 py-1.5 rounded-full mb-4 uppercase tracking-widest">
              Bize Ulasin
            </span>
            <h2 className="text-4xl font-bold text-slate-800 mb-6 leading-tight">Sizi Arayalim</h2>
            <p className="text-slate-500 mb-8 leading-relaxed">Telefon numaranizi birakin, en kisa surede sizi arayalim.</p>
            {sent ? (
              <div className="bg-[#17B6AE]/10 border border-[#17B6AE]/20 rounded-3xl p-10 text-center">
                <div className="text-5xl mb-4">✅</div>
                <p className="font-bold text-xl text-slate-800">Talebiniz alindi!</p>
                <p className="text-sm text-slate-500 mt-2">En kisa surede sizi arayacagiz.</p>
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Adiniz Soyadiniz *</label>
                    <input type="text" required placeholder="Adiniz Soyadiniz" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#17B6AE] focus:border-transparent" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Telefon Numaraniz *</label>
                    <div className="flex gap-2">
                      <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-3 text-sm font-semibold text-slate-600 flex-shrink-0">🇹🇷 +90</div>
                      <input type="tel" required placeholder="5XX XXX XX XX" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#17B6AE] focus:border-transparent" />
                    </div>
                  </div>
                  <label className="flex items-start gap-3 text-xs text-slate-500 cursor-pointer">
                    <input type="checkbox" className="mt-0.5 flex-shrink-0 w-4 h-4 accent-[#17B6AE]" checked={form.consent} onChange={(e) => setForm({ ...form, consent: e.target.checked })} />
                    <span>Mizan Mulk Yonetimi kampanyalari hakkinda <a href="https://www.ehane.com/ticari-riza-metni/" target="_blank" rel="noopener noreferrer" className="text-[#17B6AE] underline font-semibold">elektronik ileti</a> almak istiyorum.</span>
                  </label>
                  <button type="submit" disabled={loading} className="w-full bg-[#17B6AE] hover:bg-[#149891] text-white font-bold py-3.5 rounded-xl transition disabled:opacity-60 text-sm tracking-wide shadow-lg shadow-[#17B6AE]/20">
                    {loading ? "Gonderiliyor..." : "Teklif Al"}
                  </button>
                  <p className="text-[10px] text-slate-400 text-center leading-relaxed">Kisisel verileriniz, 6698 sayili KVKK kapsaminda bilgi talebinizin degerlendirilmesi amaci ile islenmektedir.</p>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
