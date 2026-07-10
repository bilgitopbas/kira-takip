import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LegalContent, { LegalBlock } from "@/components/legal/LegalContent";

const BLOCKS: LegalBlock[] = [
  {
    type: "p",
    text: "Mizan Mülk Yönetimi olarak kişisel verilerinizin güvenliğinin sağlanmasına önem veriyoruz. Bu amaçla, kişisel verilerin korunması için her türlü önlemi alan ve azami hassasiyet gösteren Mizan Mülk Yönetimi olarak, kişisel verilerinizin işlenmesi hususunda sizleri bilgilendirmek isteriz.",
  },
  { type: "h2", text: "1. Veri Sorumlusu" },
  {
    type: "p",
    text: "Şirketimiz HÜSEYİN SEFA TOPBAŞ, 6698 sayılı Kişisel Verilerin Korunması Kanunu'nun 3. maddesinde tanımlı \"Veri Sorumlusu\" sıfatıyla kişisel verilerinizi işlemektedir.",
  },
  {
    type: "p",
    text: "HÜSEYİN SEFA TOPBAŞ — Vergi Kimlik No: 36421868974, Adresi: Akabe Mah. Şehit Furkan Doğan Cad. Adalet Plaza No:11/206 Karatay/KONYA, Mail Adresi: bilgi@topbashukuk.com",
  },
  { type: "h2", text: "2. Kişisel Verilerin İşlenme Amaçları ve Hukuki Sebepleri" },
  {
    type: "p",
    text: "İnternet ortamında web sitemize üyelik ve sistemlerimizin kullanımı kapsamında web sitemizde, mobil uygulamaya kayıt ve mobil uygulamanın kullanımı kapsamında mobil uygulamamızda ve çağrı merkezimiz üzerinden sizlerden toplanan kimlik, iletişim, müşteri işlem, işlem güvenliği, görsel ve işitsel kayıtlar, finans ve pazarlama kategorilerindeki kişisel verileriniz aşağıda belirtilen amaç ve hukuki sebeplerle işlenmektedir.",
  },
  {
    type: "p",
    text: "Kanunlarda açıkça öngörülmesi (6698 sayılı Kanun m. 5/2-a) sebebine dayanılarak; kimlik, iletişim, işlem güvenliği ve müşteri işlem kategorilerindeki verileriniz aşağıdaki amaçlarla işlenir:",
  },
  {
    type: "ul",
    items: [
      "Faaliyetlerin Mevzuata Uygun Yürütülmesi",
      "Hukuk İşlerinin Takibi ve Yürütülmesi",
      "İş Faaliyetlerinin Yürütülmesi / Denetimi",
      "Mal / Hizmet Satış Süreçlerinin Yürütülmesi",
      "Risk Yönetimi Süreçlerinin Yürütülmesi",
      "Saklama ve Arşiv Faaliyetlerinin Yürütülmesi",
      "Yetkili Kişi, Kurum ve Kuruluşlara Bilgi Verilmesi",
      "Yönetim Faaliyetlerinin Yürütülmesi",
    ],
  },
  {
    type: "p",
    text: "Bir sözleşmenin kurulması veya ifasıyla doğrudan doğruya ilgili olması kaydıyla, sözleşmenin taraflarına ait kişisel verilerin işlenmesinin gerekli olması (6698 sayılı Kanun m. 5/2-c) sebebine dayanılarak; kimlik, iletişim, müşteri işlem, işlem güvenliği, finans, görsel ve işitsel kayıtlar kategorilerindeki verileriniz aşağıdaki amaçlarla işlenir:",
  },
  {
    type: "ul",
    items: [
      "Acil Durum Yönetimi Süreçlerinin Yürütülmesi",
      "Bilgi Güvenliği Süreçlerinin Yürütülmesi",
      "Faaliyetlerin Mevzuata Uygun Yürütülmesi",
      "Firma / Ürün / Hizmetlere Bağlılık Süreçlerinin Yürütülmesi",
      "Finans ve Muhasebe İşlerinin Yürütülmesi",
      "Hukuk İşlerinin Takibi ve Yürütülmesi",
      "İletişim Faaliyetlerinin Yürütülmesi",
      "İş Faaliyetlerinin Yürütülmesi / Denetimi",
      "Mal / Hizmet Satış Sonrası Destek Hizmetlerinin Yürütülmesi",
      "Mal / Hizmet Satış Süreçlerinin Yürütülmesi",
      "Mal / Hizmet Üretim ve Operasyon Süreçlerinin Yürütülmesi",
      "Müşteri İlişkileri Yönetimi Süreçlerinin Yürütülmesi",
      "Müşteri Memnuniyetine Yönelik Aktivitelerin Yürütülmesi",
      "Saklama ve Arşiv Faaliyetlerinin Yürütülmesi",
      "Sözleşme Süreçlerinin Yürütülmesi",
      "Talep / Şikayetlerin Takibi",
      "Ücret Politikasının Yürütülmesi",
      "Veri Sorumlusu Operasyonlarının Güvenliğinin Temini",
      "Yetkili Kişi, Kurum ve Kuruluşlara Bilgi Verilmesi",
      "Yönetim Faaliyetlerinin Yürütülmesi",
    ],
  },
  {
    type: "p",
    text: "Veri sorumlusunun hukuki yükümlülüğünü yerine getirebilmesi için zorunlu olması (6698 sayılı Kanun m. 5/2-ç) sebebine dayanılarak; kimlik, iletişim, müşteri işlem, finans kategorilerindeki verileriniz aşağıdaki amaçlarla işlenir:",
  },
  {
    type: "ul",
    items: [
      "Acil Durum Yönetimi Süreçlerinin Yürütülmesi",
      "Bilgi Güvenliği Süreçlerinin Yürütülmesi",
      "Faaliyetlerin Mevzuata Uygun Yürütülmesi",
      "Finans ve Muhasebe İşlerinin Yürütülmesi",
      "Hukuk İşlerinin Takibi ve Yürütülmesi",
      "Mal / Hizmet Satış Süreçlerinin Yürütülmesi",
      "Risk Yönetimi Süreçlerinin Yürütülmesi",
      "Saklama ve Arşiv Faaliyetlerinin Yürütülmesi",
      "Sözleşme Süreçlerinin Yürütülmesi",
      "Ücret Politikasının Yürütülmesi",
      "Veri Sorumlusu Operasyonlarının Güvenliğinin Temini",
      "Yetkili Kişi, Kurum ve Kuruluşlara Bilgi Verilmesi",
      "Yönetim Faaliyetlerinin Yürütülmesi",
    ],
  },
  {
    type: "p",
    text: "İlgili kişinin temel hak ve özgürlüklerine zarar vermemek kaydıyla, veri sorumlusunun meşru menfaatleri için veri işlenmesinin zorunlu olması (6698 sayılı Kanun m. 5/2-f) sebebine dayanılarak; kimlik, iletişim, müşteri işlem, işlem güvenliği, görsel ve işitsel kayıtlar kategorilerindeki verileriniz aşağıdaki amaçlarla işlenir:",
  },
  {
    type: "ul",
    items: [
      "Faaliyetlerin Mevzuata Uygun Yürütülmesi",
      "Firma / Ürün / Hizmetlere Bağlılık Süreçlerinin Yürütülmesi",
      "İletişim Faaliyetlerinin Yürütülmesi",
      "İç Denetim / Soruşturma / İstihbarat Faaliyetlerinin Yürütülmesi",
      "İş Faaliyetlerinin Yürütülmesi / Denetimi",
      "İş Süreçlerinin İyileştirilmesine Yönelik Önerilerin Alınması ve Değerlendirilmesi",
      "İş Sürekliliğinin Sağlanması Faaliyetlerinin Yürütülmesi",
      "Mal / Hizmet Satış Sonrası Destek Hizmetlerinin Yürütülmesi",
      "Mal / Hizmet Satış Süreçlerinin Yürütülmesi",
      "Mal / Hizmet Üretim ve Operasyon Süreçlerinin Yürütülmesi",
      "Müşteri İlişkileri Yönetimi Süreçlerinin Yürütülmesi",
      "Müşteri Memnuniyetine Yönelik Aktivitelerin Yürütülmesi",
      "Risk Yönetimi Süreçlerinin Yürütülmesi",
      "Saklama ve Arşiv Faaliyetlerinin Yürütülmesi",
      "Stratejik Planlama Faaliyetlerinin Yürütülmesi",
      "Talep / Şikayetlerin Takibi",
      "Veri Sorumlusu Operasyonlarının Güvenliğinin Temini",
      "Yetkili Kişi, Kurum ve Kuruluşlara Bilgi Verilmesi",
      "Yönetim Faaliyetlerinin Yürütülmesi",
    ],
  },
  {
    type: "p",
    text: "Reklam ve pazarlama faaliyetleri için onay verilmiş olması halinde açık rıza (6698 sayılı Kanun m. 5) sebebine dayanılarak; kimlik, iletişim, müşteri işlem, işlem güvenliği ve pazarlama kategorilerindeki verileriniz aşağıdaki amaçlarla tarafımızdan işlenir:",
  },
  {
    type: "ul",
    items: [
      "Firma / Ürün / Hizmetlere Bağlılık Süreçlerinin Yürütülmesi",
      "İletişim Faaliyetlerinin Yürütülmesi",
      "İş Sürekliliğinin Sağlanması Faaliyetlerinin Yürütülmesi",
      "Müşteri İlişkileri Yönetimi Süreçlerinin Yürütülmesi",
      "Müşteri Memnuniyetine Yönelik Aktivitelerin Yürütülmesi",
      "Pazarlama Analiz Çalışmalarının Yürütülmesi",
      "Reklam / Kampanya / Promosyon Süreçlerinin Yürütülmesi",
      "Stratejik Planlama Faaliyetlerinin Yürütülmesi",
      "Talep / Şikayetlerin Takibi",
      "Ürün / Hizmetlerin Pazarlama Süreçlerinin Yürütülmesi",
    ],
  },
  { type: "h2", text: "3. İşlenen Kişisel Verilerin Kimlere ve Hangi Amaçla Aktarılabileceği" },
  { type: "p", text: "İşlediğimiz kişisel verilerinizi aşağıdaki taraflara aktarabilmekteyiz:" },
  {
    type: "p",
    text: "Gerçek Kişilere, Özel Hukuk Tüzel Kişilerine, İş Ortaklarımıza, İştirakler ve Bağlı Ortaklıklarımıza; kimlik, iletişim, müşteri işlem, işlem güvenliği, finans, görsel ve işitsel kayıtlar kategorilerindeki kişisel verileriniz aşağıdaki amaçlarla aktarılır:",
  },
  {
    type: "ul",
    items: [
      "Bilgi Güvenliği Süreçlerinin Yürütülmesi",
      "Faaliyetlerin Mevzuata Uygun Yürütülmesi",
      "Finans ve Muhasebe İşlerinin Yürütülmesi",
      "Hukuk İşlerinin Takibi ve Yürütülmesi",
      "İletişim Faaliyetlerinin Yürütülmesi",
      "İş Faaliyetlerinin Yürütülmesi / Denetimi",
      "Lojistik Faaliyetlerinin Yürütülmesi",
      "Mal / Hizmet Satın Alım Süreçlerinin Yürütülmesi",
      "Mal / Hizmet Satış Sonrası Destek Hizmetlerinin Yürütülmesi",
      "Mal / Hizmet Satış Süreçlerinin Yürütülmesi",
      "Mal / Hizmet Üretim ve Operasyon Süreçlerinin Yürütülmesi",
      "Müşteri İlişkileri Yönetimi Süreçlerinin Yürütülmesi",
      "Müşteri Memnuniyetine Yönelik Aktivitelerin Yürütülmesi",
      "Saklama ve Arşiv Faaliyetlerinin Yürütülmesi",
      "Sözleşme Süreçlerinin Yürütülmesi",
      "Talep / Şikayetlerin Takibi",
      "Tedarik Zinciri Yönetimi Süreçlerinin Yürütülmesi",
      "Ücret Politikasının Yürütülmesi",
      "Veri Sorumlusu Operasyonlarının Güvenliğinin Temini",
      "Yetkili Kişi, Kurum ve Kuruluşlara Bilgi Verilmesi",
    ],
  },
  {
    type: "p",
    text: "Yetkili Kamu Kurum ve Kuruluşlarına; kimlik, iletişim, müşteri işlem, işlem güvenliği ve finans kategorilerindeki verileriniz aşağıdaki amaçlarla aktarılır:",
  },
  {
    type: "ul",
    items: [
      "Faaliyetlerin Mevzuata Uygun Yürütülmesi",
      "Finans ve Muhasebe İşlerinin Yürütülmesi",
      "Hukuk İşlerinin Takibi ve Yürütülmesi",
      "İletişim Faaliyetlerinin Yürütülmesi",
      "İş Faaliyetlerinin Yürütülmesi / Denetimi",
      "Saklama ve Arşiv Faaliyetlerinin Yürütülmesi",
      "Sözleşme Süreçlerinin Yürütülmesi",
      "Yetkili Kişi, Kurum ve Kuruluşlara Bilgi Verilmesi",
    ],
  },
  {
    type: "p",
    text: "Yukarıda sayılan aktarımlar, 6698 sayılı Kanun'da belirtilen kişisel veri işleme şartları çerçevesinde gerçekleştirilmektedir.",
  },
  { type: "h2", text: "4. Kişisel Verileri Toplama Yöntemlerimiz" },
  { type: "p", text: "Otomatik, kısmen otomatik ya da herhangi bir veri kayıt sisteminin parçası olmak kaydıyla otomatik olmayan yöntemlerle:" },
  {
    type: "ul",
    items: [
      "Kimlik, iletişim, müşteri işlem, işlem güvenliği, finans, görsel ve işitsel kayıtlar, pazarlama kategorilerindeki kişisel verileriniz website üyelik formunda, mobil uygulamanın kullanımı ve sistemlerimiz kullanılırken, yazılı ve fiziki olarak verdiğiniz bilgi ve belgelerden, tarafımızla imzaladığınız sözleşmelerden, çağrı merkezi görüşmeleriyle sözlü olarak verdiğiniz bilgilerden sizlerden toplanmaktadır.",
      "Kimlik, iletişim, finans ve müşteri işlem kategorilerindeki kişisel verileriniz üçüncü kişi statüsündeki ilgili gayrimenkul alım-satım-kiralama ve emlakçılık alanında faaliyet gösteren şahıs ve şirketler, gayrimenkul yönetim şirketlerinden, kiracıların ev sahiplerinden veya taşınır veya taşınmaz hükmündeki mal varlıklarını kiraya veren konumundaki gerçek kişi veya tüzel kişilerden toplanmaktadır.",
      "Kimlik, iletişim, müşteri işlem ve işlem güvenliği kategorilerindeki kişisel verileriniz WhatsApp ve canlı destek uygulaması ile telefon görüşmesi vasıtasıyla sizlerden toplanmaktadır.",
    ],
  },
  { type: "p", text: "Topladığımız kişisel verileriniz yasal yollardan elde edilmektedir." },
  { type: "h2", text: "5. İlgili Kişi Olarak Haklarınız" },
  {
    type: "p",
    text: "6698 sayılı Kanun'un \"ilgili kişinin hakları\"nı düzenleyen 11. maddesi kapsamındaki haklarınıza ve kanunun uygulamasına ilişkin taleplerinizi yazılı olarak veya kayıtlı elektronik posta (KEP) adresi ya da sistemimizde kayıtlı bulunan e-posta adresini kullanmak suretiyle ya da Veri Sorumlusuna Başvuru Usul ve Esasları Hakkında Tebliğ'de öngörülen diğer başvuru usullerine uygun olarak bilgi@mizanmulkyonetimi.com adresine iletebilirsiniz. Talebinizi niteliğine göre en kısa sürede ve en geç 30 (otuz) gün içinde ücretsiz olarak sonuçlandıracağız.",
  },
];

export default function AydinlatmaMetniPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h1 className="text-3xl font-bold text-slate-900 mb-8">Mizan Mülk Yönetimi Aydınlatma Metni</h1>
        <LegalContent blocks={BLOCKS} />
      </div>
      <Footer />
    </div>
  );
}
