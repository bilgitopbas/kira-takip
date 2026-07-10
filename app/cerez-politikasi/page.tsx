import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LegalContent, { LegalBlock } from "@/components/legal/LegalContent";

const BLOCKS: LegalBlock[] = [
  {
    type: "p",
    text: "Mizan Mülk Yönetimi olarak, web sitemizi ziyaret ettiğinizde ve hizmetlerimizi kullandığınızda deneyiminizi iyileştirmek amacıyla çerezler (cookies) kullanıyoruz. Bu metin, hangi çerezleri hangi amaçla kullandığımızı ve tercihlerinizi nasıl yönetebileceğinizi açıklamaktadır.",
  },
  { type: "h2", text: "Çerez Nedir?" },
  {
    type: "p",
    text: "Çerezler, ziyaret ettiğiniz web siteleri tarafından tarayıcınız aracılığıyla cihazınıza kaydedilen küçük metin dosyalarıdır. Çerezler; sitenin düzgün çalışmasını sağlamak, oturumunuzu güvenli şekilde sürdürmek ve size daha iyi bir deneyim sunmak amacıyla kullanılır.",
  },
  { type: "h2", text: "Kullandığımız Çerez Türleri" },
  {
    type: "ul",
    items: [
      "Zorunlu Çerezler: Oturum açma, güvenlik ve sitenin temel işlevlerinin çalışması için gereklidir; devre dışı bırakılamaz.",
      "Performans ve Analiz Çerezleri: Sitenin nasıl kullanıldığını anlamamıza ve deneyimi iyileştirmemize yardımcı olur.",
      "İşlevsellik Çerezleri: Tercihlerinizi (örneğin dil veya tema seçimi) hatırlamamızı sağlar.",
      "Pazarlama Çerezleri: Yalnızca açık rızanız bulunması halinde, ilgi alanlarınıza uygun içerik ve kampanyaların sunulması amacıyla kullanılır.",
    ],
  },
  { type: "h2", text: "Çerez Tercihlerinizi Yönetme" },
  {
    type: "p",
    text: "Sitemizi ilk ziyaretinizde çıkan çerez bildirimi üzerinden çerez kullanımını kabul edebilir veya reddedebilirsiniz. Ayrıca tarayıcınızın ayarları üzerinden mevcut çerezleri silebilir ve yeni çerezlerin kaydedilmesini engelleyebilirsiniz. Zorunlu çerezlerin devre dışı bırakılması, sitenin bazı bölümlerinin düzgün çalışmamasına neden olabilir.",
  },
  { type: "h2", text: "Kişisel Verilerin Korunması" },
  {
    type: "p",
    text: "Çerezler aracılığıyla işlenen kişisel verileriniz, Mizan Mülk Yönetimi Aydınlatma Metni'nde belirtilen amaç ve hukuki sebeplerle sınırlı olarak işlenmektedir. Detaylı bilgi için Aydınlatma Metni'ni inceleyebilirsiniz.",
  },
  { type: "h2", text: "İletişim" },
  {
    type: "p",
    text: "Çerez politikamızla ilgili sorularınız için bilgi@mizanmulkyonetimi.com adresinden bizimle iletişime geçebilirsiniz.",
  },
];

export default function CerezPolitikasiPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h1 className="text-3xl font-bold text-slate-900 mb-8">Çerez Politikası</h1>
        <LegalContent blocks={BLOCKS} />
      </div>
      <Footer />
    </div>
  );
}
