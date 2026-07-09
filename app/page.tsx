import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import TrustedCompanies from "@/components/TrustedCompanies";
import NotificationFlow from "@/components/NotificationFlow";
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

      {/* REFERANSLAR */}
      <TrustedCompanies />
      <Testimonials />

      {/* SSS + İLETİŞİM */}
      <FaqContact />

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <WordsReveal as="h2" text="Hemen Ücretsiz Deneyin" className="text-3xl font-semibold text-slate-800 mb-4 block" />
        <p className="text-slate-500 mb-8">45 gün boyunca hiçbir ücret ödemeden tüm özellikleri kullanın.</p>
      </section>

      <Footer />
    </div>
  );
}