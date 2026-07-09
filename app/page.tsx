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
import MobileAppSection from "@/components/MobileAppSection";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <HeroSection />

      {/* NELER YAPIYORUZ */}
      <FeatureGrid />

      {/* RAKAMLARLA MİZAN */}
      <StatsSection />

      {/* MOBİL UYGULAMA */}
      <MobileAppSection />

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

      <Footer />
    </div>
  );
}