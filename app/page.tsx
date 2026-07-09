import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import TrustedCompanies from "@/components/TrustedCompanies";
import NotificationFlow from "@/components/NotificationFlow";
import PhoneMockup from "@/components/PhoneMockup";
import Testimonials from "@/components/Testimonials";
import FaqContact from "@/components/FaqContact";
import StatsSection from "@/components/StatsSection";
import HowItWorks from "@/components/HowItWorks";
import HeroSection from "@/components/HeroSection";
import FeatureGrid from "@/components/FeatureGrid";
import PricingSection from "@/components/PricingSection";
import { WordsReveal } from "@/components/motion/Reveal";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <HeroSection />

      {/* NELER YAPIYORUZ */}
      <FeatureGrid />

      {/* RAKAMLARLA MİZAN */}
      <StatsSection />

      {/* SMS & EPOSTA */}
      <NotificationFlow />

      {/* NASIL KULLANILIR */}
      <HowItWorks />

      {/* FİYATLANDIRMA */}
      <PricingSection />

      {/* MOBİL UYGULAMA */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-block text-xs font-medium text-[#17B6AE] bg-[#17B6AE]/10 px-3 py-1 rounded-full mb-3">MOBİL UYGULAMA</span>
            <h2 className="text-3xl font-semibold text-slate-800 mb-4">Her Yerden Yönetin, Hiçbir Şey Kaçmasın</h2>
            <p className="text-slate-500 mb-8">
              Ofisin dışındayken bile portföyünüz cebinizde. Anlık bildirimler,
              hızlı tahsilat, saha denetimi — iOS ve Android uygulamalarımızla elinizin altında.
            </p>
            <div className="flex gap-4">
              <a href="/register" className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-3 rounded-lg text-sm font-medium transition">App Store&apos;dan İndirin</a>
              <a href="/register" className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-3 rounded-lg text-sm font-medium transition">Google Play&apos;den İndirin</a>
            </div>
          </div>
          <PhoneMockup />
        </div>
      </section>

      {/* REFERANSLAR */}
      <TrustedCompanies />
      <Testimonials />

      {/* SSS + İLETİŞİM */}
      <FaqContact />

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <WordsReveal as="h2" text="Hemen Ücretsiz Deneyin" className="text-3xl font-semibold text-slate-800 mb-4 block" />
        <p className="text-slate-500 mb-8">45 gün boyunca hiçbir ücret ödemeden tüm özellikleri kullanın.</p>
        <a href="/register" className="bg-[#17B6AE] hover:bg-[#149891] text-white font-medium px-8 py-3 rounded-lg transition inline-block">Kayıt Ol</a>
      </section>

      <Footer />
    </div>
  );
}