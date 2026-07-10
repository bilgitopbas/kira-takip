import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LegalContent, { LegalBlock } from "@/components/legal/LegalContent";

const BLOCKS: LegalBlock[] = [
  {
    type: "p",
    text: "6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında, Mizan Mülk Yönetimi olarak; pazarlama ve reklam/kampanya süreçlerinin yürütülmesi maksadıyla kişisel verilerinizi işleyebilmek için bu konuda açık rızanıza ihtiyaç duyuyoruz.",
  },
  { type: "h2", text: "Hangi Kişisel Verileriniz İçin Açık Rıza Talep Ediyoruz?" },
  {
    type: "p",
    text: "Web sitesi, mobil uygulama, iletişim ve canlı destek uygulamaları vasıtasıyla sizlerden topladığımız kimlik, iletişim, müşteri işlem, işlem güvenliği ve pazarlama kategorilerindeki kişisel verileriniz için açık rıza talep ediyoruz.",
  },
  { type: "h2", text: "Beyan ve Onay" },
  {
    type: "p",
    text: "Kişisel verilerimin Mizan Mülk Yönetimi Aydınlatma Metni'nde belirtilen yöntem, amaç ve hukuki sebeplerle sınırlı kalmak kaydıyla; 6698 sayılı Kanun ve diğer ilgili mevzuata uygun olarak veri sorumlusu tarafından reklam, kampanya, promosyon ve pazarlama faaliyetleri kapsamında kullanılmasına ve aktarılmasına açık bir şekilde rıza verdiğimi, kabul, beyan ve taahhüt ediyorum.",
  },
  { type: "h2", text: "Bilgilendirme" },
  {
    type: "p",
    text: "Açık rızamı dilediğim zaman Mizan Mülk Yönetimi Aydınlatma Metni'nde belirtilen e-posta adresi üzerinden şirketinize ulaşarak geri alabileceğim konusunda bilgilendirildim.",
  },
];

export default function AcikRizaMetniPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h1 className="text-3xl font-bold text-slate-900 mb-8">Mizan Mülk Yönetimi Açık Rıza Beyanı</h1>
        <LegalContent blocks={BLOCKS} />
      </div>
      <Footer />
    </div>
  );
}
