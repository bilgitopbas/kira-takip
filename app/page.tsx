import { Plus_Jakarta_Sans } from "next/font/google";
import NativeLoginRedirect from "@/components/NativeLoginRedirect";
import SvgTanimlari from "@/components/anasayfa/SvgTanimlari";
import UstMenu from "@/components/anasayfa/UstMenu";
import Kahraman from "@/components/anasayfa/Kahraman";
import Firmalar from "@/components/anasayfa/Firmalar";
import NelerYapiyoruz from "@/components/anasayfa/NelerYapiyoruz";
import MulkSehrimVitrin from "@/components/anasayfa/MulkSehrimVitrin";
import Rakamlar from "@/components/anasayfa/Rakamlar";
import MobilUygulama from "@/components/anasayfa/MobilUygulama";
import Adimlar from "@/components/anasayfa/Adimlar";
import Paketler from "@/components/anasayfa/Paketler";
import Yorumlar from "@/components/anasayfa/Yorumlar";
import BlogOnizleme from "@/components/anasayfa/BlogOnizleme";
import SssIletisim from "@/components/anasayfa/SssIletisim";
import { AltBilgi, Kapanis } from "@/components/anasayfa/KapanisAltBilgi";
import AnasayfaHareket from "@/components/anasayfa/AnasayfaHareket";
import "./anasayfa.css";

// Türkçe harfler (ş, ğ, İ) için latin-ext de yüklenir.
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin", "latin-ext"], variable: "--font-jakarta", display: "swap" });

export default function HomePage() {
  return (
    <div className={`anasayfa ${jakarta.variable}`}>
      <NativeLoginRedirect />
      <SvgTanimlari />
      <UstMenu />
      <main>
        {/* 3D MÜLK ŞEHRİ */}
        <Kahraman />
        {/* REFERANS FİRMALAR */}
        <Firmalar />
        {/* NELER YAPIYORUZ */}
        <NelerYapiyoruz />
        {/* MÜLK ŞEHRİM: gerçek 3D ve harita, örnek portföy */}
        <MulkSehrimVitrin />
        {/* RAKAMLARLA MİZAN */}
        <Rakamlar />
        {/* MOBİL UYGULAMA */}
        <MobilUygulama />
        {/* NASIL KULLANILIR */}
        <Adimlar />
        {/* FİYATLANDIRMA (yalnız web) */}
        <Paketler />
        {/* MÜŞTERİ YORUMLARI */}
        <Yorumlar />
        {/* BLOG */}
        <BlogOnizleme />
        {/* SSS + İLETİŞİM */}
        <SssIletisim />
        <Kapanis />
      </main>
      <AltBilgi />
      <AnasayfaHareket />
    </div>
  );
}
