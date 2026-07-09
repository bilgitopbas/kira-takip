import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import TrustedCompanies from "@/components/TrustedCompanies";
import Testimonials from "@/components/Testimonials";
import FaqContact from "@/components/FaqContact";
import StatsSection from "@/components/StatsSection";
import HowItWorks from "@/components/HowItWorks";
import HeroSection from "@/components/HeroSection";
import FeatureGrid from "@/components/FeatureGrid";
import PricingSection from "@/components/PricingSection";
import MobileAppSection from "@/components/MobileAppSection";
import BlogPreviewSection from "@/components/BlogPreviewSection";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <HeroSection />

      {/* MOBİL UYGULAMA */}
      <MobileAppSection />

      {/* NELER YAPIYORUZ */}
      <FeatureGrid />

      {/* RAKAMLARLA MİZAN */}
      <StatsSection />

      {/* NASIL KULLANILIR */}
      <HowItWorks />

      {/* FİYATLANDIRMA */}
      <PricingSection />

      {/* REFERANSLAR */}
      <TrustedCompanies />
      <Testimonials />

      {/* BLOG */}
      <BlogPreviewSection />

      {/* SSS + İLETİŞİM */}
      <FaqContact />

      <Footer />
    </div>
  );
}