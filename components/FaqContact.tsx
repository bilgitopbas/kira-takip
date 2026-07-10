"use client";

import { useState } from "react";
import { WordsReveal, FadeInView } from "@/components/motion/Reveal";

const FAQS = [
  {
    icon: (<svg viewBox="0 0 48 48" fill="none" className="w-10 h-10"><circle cx="24" cy="24" r="24" fill="#17B6AE" fillOpacity="0.10"/><path d="M16 20h16M16 24h10" stroke="#17B6AE" strokeWidth="2.5" strokeLinecap="round"/><circle cx="34" cy="34" r="7" fill="#17B6AE"/><path d="M34 31v3.5l2 1.5" stroke="white" strokeWidth="1.8" strokeLinecap="round"/></svg>),
    q: "Fiyatlandırma nasıl çalışıyor?",
    a: "Aylık mülk başına 75 TL karşılığında tüm özelliklerden yararlanabilirsiniz. Tüm planlar 45 günlük ücretsiz denemeyle gelir.",
  },
  {
    icon: (<svg viewBox="0 0 48 48" fill="none" className="w-10 h-10"><circle cx="24" cy="24" r="24" fill="#17B6AE" fillOpacity="0.10"/><path d="M24 14v10l6 4" stroke="#17B6AE" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/><circle cx="24" cy="24" r="10" stroke="#17B6AE" strokeWidth="2.2"/></svg>),
    q: "Ücretsiz deneme süresi ne kadar?",
    a: "Kayıt olduğunuz andan itibaren 45 gün boyunca hiçbir ücret ödemeden tüm özellikleri kullanabilirsiniz. Deneme süresi dolduğunda ödeme yapmazsanız hesabınız salt okunur moda geçer, verileriniz silinmez.",
  },
  {
    icon: (<svg viewBox="0 0 48 48" fill="none" className="w-10 h-10"><circle cx="24" cy="24" r="24" fill="#17B6AE" fillOpacity="0.10"/><rect x="15" y="13" width="18" height="22" rx="3" stroke="#17B6AE" strokeWidth="2.2"/><path d="M19 20h10M19 24h10M19 28h6" stroke="#17B6AE" strokeWidth="2" strokeLinecap="round"/></svg>),
    q: "Verilerim güvende mi?",
    a: "Tüm verileriniz SSL şifreleme ile korunur ve düzenli olarak yedeklenir. Kişisel ve finansal bilgileriniz üçüncü taraflarla paylaşılmaz; KVKK kapsamında tam uyumluluk sağlanmaktadır.",
  },
  {
    icon: (<svg viewBox="0 0 48 48" fill="none" className="w-10 h-10"><circle cx="24" cy="24" r="24" fill="#17B6AE" fillOpacity="0.10"/><rect x="13" y="17" width="22" height="15" rx="3" stroke="#17B6AE" strokeWidth="2.2"/><path d="M13 22h22" stroke="#17B6AE" strokeWidth="2" strokeLinecap="round"/><circle cx="18" cy="28" r="1.5" fill="#17B6AE"/><circle cx="24" cy="28" r="1.5" fill="#17B6AE"/></svg>),
    q: "Raporlama özellikleri nelerdir?",
    a: "Mizan Mülk Yönetimi ile kiracı ödeme durumu, geciken kira listesi, mülk doluluk oranı, aylık/yıllık gelir-gider özeti ve tahsilat performansı gibi yönetim verilerini raporlayabilirsiniz.",
  },
  {
    icon: (<svg viewBox="0 0 48 48" fill="none" className="w-10 h-10"><circle cx="24" cy="24" r="24" fill="#17B6AE" fillOpacity="0.10"/><path d="M24 14c-4.4 0-8 3.6-8 8 0 3 1.6 5.6 4 7v3h8v-3c2.4-1.4 4-4 4-7 0-4.4-3.6-8-8-8z" stroke="#17B6AE" strokeWidth="2.2" strokeLinejoin="round"/><path d="M20 32h8" stroke="#17B6AE" strokeWidth="2" strokeLinecap="round"/></svg>),
    q: "Profesyonel Mülk Yönetimi hizmeti nedir?",
    a: "Kayıt sırasında bu hizmeti seçerseniz, ekibimiz sizin adınıza mülk ve kiracı yönetiminde destek sağlayabilir. Kiracı takibi, tahsilat hatırlatmaları ve sözleşme süreçlerini sizin yerinize yönetebiliriz.",
  },
  {
    icon: (<svg viewBox="0 0 48 48" fill="none" className="w-10 h-10"><circle cx="24" cy="24" r="24" fill="#17B6AE" fillOpacity="0.10"/><rect x="17" y="11" width="14" height="26" rx="4" stroke="#17B6AE" strokeWidth="2.2"/><circle cx="24" cy="33" r="1.5" fill="#17B6AE"/></svg>),
    q: "Mobil uygulama var mı?",
    a: "Evet, iOS ve Android uygulamalarımızla mülklerinizi cebinizden de yönetebilirsiniz. Ayrıca web tarayıcısı üzerinden mobil uyumlu arayüzümüzü de kullanabilirsiniz.",
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
              Sık Sorulan Sorular
            </span>
            <WordsReveal as="h2" text="En çok sorulan sorular" className="text-4xl font-bold text-slate-800 mb-3 leading-tight block" />
            <p className="text-slate-500 text-base mb-10 leading-relaxed">
              Sorularınızın yanıtlarını burada bulabilirsiniz. Daha fazla yardım isterseniz, destek ekibimiz her zaman yanınızdadır.
            </p>
            <div className="space-y-3">
              {FAQS.map((faq, i) => (
                <FadeInView key={i} delay={i * 0.05}>
                  <div className={`rounded-2xl overflow-hidden border transition-all duration-200 ${openIndex === i ? "border-[#17B6AE]/40 shadow-md bg-white" : "border-gray-200 bg-white hover:border-[#17B6AE]/30 hover:shadow-sm"}`}>
                    <button className="w-full flex items-center gap-4 px-5 py-4 text-left" onClick={() => setOpenIndex(openIndex === i ? null : i)}>
                      <div className="flex-shrink-0">{faq.icon}</div>
                      <span className="font-bold text-slate-800 text-base flex-1 pr-2">{faq.q}</span>
                      <span className={`text-[#17B6AE] text-2xl font-light flex-shrink-0 transition-transform duration-200 ${openIndex === i ? "rotate-45" : ""}`}>+</span>
                    </button>
                    {openIndex === i && (
                      <div className="px-5 pb-5 text-sm text-slate-600 leading-relaxed border-t border-gray-100 pt-4 ml-14">{faq.a}</div>
                    )}
                  </div>
                </FadeInView>
              ))}
            </div>
          </div>

          <div>
            <span className="inline-block text-xs font-bold text-[#17B6AE] bg-[#17B6AE]/10 px-4 py-1.5 rounded-full mb-4 uppercase tracking-widest">
              Bize Ulaşın
            </span>
            <WordsReveal as="h2" text="Sizi Arayalım" className="text-4xl font-bold text-slate-800 mb-6 leading-tight block" />
            <p className="text-slate-500 mb-8 leading-relaxed">Telefon numaranızı bırakın, en kısa sürede sizi arayalım.</p>
            {sent ? (
              <div className="bg-[#17B6AE]/10 border border-[#17B6AE]/20 rounded-3xl p-10 text-center">
                <div className="text-5xl mb-4">✅</div>
                <p className="font-bold text-xl text-slate-800">Talebiniz alındı!</p>
                <p className="text-sm text-slate-500 mt-2">En kısa sürede sizi arayacağız.</p>
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Adınız Soyadınız *</label>
                    <input type="text" required placeholder="Adınız Soyadınız" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#17B6AE] focus:border-transparent" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Telefon Numaranız *</label>
                    <div className="flex gap-2">
                      <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-3 text-sm font-semibold text-slate-600 flex-shrink-0">🇹🇷 +90</div>
                      <input type="tel" required placeholder="5XX XXX XX XX" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#17B6AE] focus:border-transparent" />
                    </div>
                  </div>
                  <label className="flex items-start gap-3 text-xs text-slate-500 cursor-pointer">
                    <input type="checkbox" className="mt-0.5 flex-shrink-0 w-4 h-4 accent-[#17B6AE]" checked={form.consent} onChange={(e) => setForm({ ...form, consent: e.target.checked })} />
                    <span>Mizan Mülk Yönetimi kampanyaları hakkında <a href="https://www.ehane.com/ticari-riza-metni/" target="_blank" rel="noopener noreferrer" className="text-[#17B6AE] underline font-semibold">elektronik ileti</a> almak istiyorum.</span>
                  </label>
                  <button type="submit" disabled={loading} className="w-full bg-[#17B6AE] hover:bg-[#149891] text-white font-bold py-3.5 rounded-xl transition disabled:opacity-60 text-sm tracking-wide shadow-lg shadow-[#17B6AE]/20">
                    {loading ? "Gönderiliyor..." : "Teklif Al"}
                  </button>
                  <p className="text-[10px] text-slate-400 text-center leading-relaxed">Kişisel verileriniz, 6698 sayılı KVKK kapsamında bilgi talebinizin değerlendirilmesi amacı ile işlenmektedir.</p>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
