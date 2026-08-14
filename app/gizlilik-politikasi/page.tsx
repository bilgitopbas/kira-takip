import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LegalContent, { LegalBlock } from "@/components/legal/LegalContent";

export const metadata = {
  title: "Gizlilik Politikası",
  description:
    "Mizan Mülk Yönetimi web sitesi ve mobil uygulamasında hangi kişisel verilerin toplandığını, nasıl kullanıldığını ve nasıl silinebileceğini açıklayan gizlilik politikası.",
};

const BLOCKS: LegalBlock[] = [
  {
    type: "p",
    text: "Bu Gizlilik Politikası; mizanmulkyonetimi.com web sitesi ile App Store ve Google Play'de yayınlanan \"Mizan Mülk Yönetimi\" mobil uygulaması (birlikte \"Hizmet\") kapsamında hangi kişisel verilerin toplandığını, bu verilerin hangi amaçlarla işlendiğini, kimlerle paylaşıldığını, ne kadar süreyle saklandığını ve nasıl silinebileceğini açıklar. Hizmeti kullanarak bu politikada açıklanan uygulamaları kabul etmiş olursunuz.",
  },
  {
    type: "p",
    text: "Mobil uygulama, web sitesindeki panelin aynısını görüntüler; uygulama üzerinden girdiğiniz veriler de bu politika kapsamındadır.",
  },

  { type: "h2", text: "1. Veri Sorumlusu" },
  {
    type: "p",
    text: "Hesap sahiplerine ve alt kullanıcılara ait verilerde veri sorumlusu Mizan Mülk Yönetimi'dir. İletişim: bilgi@mizanmulkyonetimi.com",
  },
  {
    type: "p",
    text: "Önemli ayrım: Hizmeti kullanan müşterilerimizin panele girdiği KİRACI ve benzeri üçüncü kişi verilerinde veri sorumlusu, o verileri giren müşterinin kendisidir. Mizan Mülk Yönetimi bu veriler bakımından yalnızca veri işleyen sıfatıyla, müşterinin talimatı doğrultusunda barındırma ve işleme hizmeti sunar. Kiracılarının aydınlatılması ve gerekli hukuki dayanağın sağlanması müşterinin sorumluluğundadır.",
  },

  { type: "h2", text: "2. Toplanan Kişisel Veriler" },
  {
    type: "p",
    text: "Hizmet kapsamında yalnızca sunulan işlevler için gerekli veriler toplanır. Toplanan veri kategorileri şunlardır:",
  },
  {
    type: "ul",
    items: [
      "Hesap bilgileri: ad soyad, e-posta adresi, telefon numarası, şehir, hesap türü (mülk sahibi, emlakçı, avukat, yetkili temsilci), yaklaşık mülk sayısı aralığı, şifreniz (geri döndürülemez şekilde şifrelenmiş olarak saklanır), Google ile giriş yapıyorsanız Google hesap kimliğiniz, e-posta onay durumu.",
      "Alt kullanıcı bilgileri: Hesabınıza davet ettiğiniz kişilerin ad soyadı, e-posta adresi ve şifresi (şifrelenmiş olarak).",
      "Mülk bilgileri: mülk başlığı, açık adres, il, ilçe, yüzölçümü, mülk tipi, doluluk durumu ve notlar.",
      "Kiracı bilgileri: ad soyad, T.C. kimlik numarası, vergi numarası, telefon, e-posta, tebligat adresi, kiracı tipi, notlar ve puanlama. Bu veriler müşteri tarafından girilir.",
      "Finansal ve sözleşmesel veriler: aylık/yıllık kira bedeli, sözleşme başlangıç ve bitiş tarihleri, ödeme günü, kira artış tipi ve oranı, depozito tutarı, borç kayıtları, tahsilat kayıtları, ödeme yöntemi ve notları, mülke yapılan masraflar.",
      "Yüklenen dosyalar: kira sözleşmesi belgeleri ve tahsilat dekontları.",
      "Abonelik ve ödeme bildirimleri: seçtiğiniz plan, mülk sayısı, tutar ve havale bildiriminde oluşturulan referans kodu. Kredi kartı bilgisi hiçbir aşamada toplanmaz ve saklanmaz.",
      "Destek ve iletişim: destek talebi konusu ve açıklaması; web sitesindeki iletişim formunu kullanırsanız ad, e-posta, telefon ve mesajınız.",
      "Teknik veriler: oturumunuzu sürdürmek için kullanılan güvenlik çerezi, bildirim tercihleriniz ve mobil uygulamada bildirim gönderebilmek için cihazınıza ait bildirim kimliği.",
    ],
  },
  {
    type: "p",
    text: "Hizmet; konum bilgisi, kamera, mikrofon, kişi rehberi veya cihazınızdaki diğer dosyalara erişmez. Reklam amaçlı takip yapılmaz ve üçüncü taraf reklam ağlarına veri aktarılmaz.",
  },

  { type: "h2", text: "3. Verilerin Toplanma Yöntemi" },
  {
    type: "p",
    text: "Veriler; kayıt formu, panel içindeki formlar, dosya yüklemeleri, Excel ile toplu içe aktarma, destek talepleri ve iletişim formu aracılığıyla doğrudan sizin tarafınızdan girilir. Oturum çerezi ve bildirim kimliği ise Hizmeti kullanmanız sırasında otomatik olarak oluşturulur.",
  },

  { type: "h2", text: "4. İşleme Amaçları" },
  {
    type: "ul",
    items: [
      "Hesabınızı oluşturmak, kimliğinizi doğrulamak ve oturumunuzu güvenli şekilde sürdürmek.",
      "Mülk, kiracı, borç, tahsilat ve masraf kayıtlarınızı saklamak ve size göstermek.",
      "Gecikmiş ödeme, kira artış dönemi, beşinci yıl kira tespiti ve aylık tahsilat özeti gibi hatırlatmaları oluşturup size bildirim ve e-posta ile iletmek.",
      "Girdiğiniz bilgilerle kira sözleşmesi belgesi oluşturmak ve talebiniz üzerine size e-posta ile göndermek.",
      "Abonelik sürecini yürütmek, ödeme bildirimlerinizi doğrulamak ve deneme süresine ilişkin bilgilendirme yapmak.",
      "Destek taleplerinizi yanıtlamak ve sizinle iletişim kurmak.",
      "Hizmetin güvenliğini sağlamak, kötüye kullanımı önlemek ve yasal yükümlülüklerimizi yerine getirmek.",
    ],
  },
  {
    type: "p",
    text: "Kişisel verileriniz; açık rızanız olmadıkça pazarlama amacıyla kullanılmaz, satılmaz ve kiralanmaz.",
  },

  { type: "h2", text: "5. Hukuki Sebepler" },
  {
    type: "p",
    text: "Kişisel verileriniz 6698 sayılı Kişisel Verilerin Korunması Kanunu'nun 5. maddesi uyarınca; sözleşmenin kurulması ve ifası için gerekli olması, hukuki yükümlülüğümüzün yerine getirilmesi, bir hakkın tesisi ve korunması ile temel hak ve özgürlüklerinize zarar vermemek kaydıyla meşru menfaatimiz hukuki sebeplerine dayanılarak işlenir. Pazarlama iletişimi gibi bu kapsam dışında kalan işlemeler yalnızca açık rızanızla yapılır.",
  },

  { type: "h2", text: "6. Verilerin Paylaşılması ve Yurt Dışına Aktarım" },
  {
    type: "p",
    text: "Verileriniz aşağıdaki hizmet sağlayıcılarla, yalnızca Hizmetin çalışması için gereken ölçüde paylaşılır:",
  },
  {
    type: "ul",
    items: [
      "Barındırma sağlayıcımız: Verileriniz sunucularımızda saklanır.",
      "E-posta sunucusu: Bilgilendirme, doğrulama ve hatırlatma e-postalarının iletilmesi amacıyla e-posta adresiniz ve ilgili mesaj içeriği.",
      "OneSignal (push bildirim altyapısı): Yalnızca cihazınıza ait bildirim kimliği ile gönderilen bildirim başlığı ve metni. Merkezi yurt dışındadır.",
      "Google (Google ile Giriş ve güvenlik doğrulaması): Google ile giriş yapmayı seçerseniz kimlik doğrulama bilgileri; kayıt sırasında bot koruması için doğrulama verileri. Merkezi yurt dışındadır.",
    ],
  },
  {
    type: "p",
    text: "Hizmet içinde kullanılan güncel kur ve enflasyon verileri, kişisel veri içermeyen genel istatistiklerdir; bu kaynaklara hiçbir kişisel veriniz gönderilmez. Bunların dışında verileriniz, yasal olarak yetkili kamu kurumlarının talebi hâlinde ilgili mevzuat çerçevesinde paylaşılabilir.",
  },

  { type: "h2", text: "7. Saklama Süresi" },
  {
    type: "p",
    text: "Kişisel verileriniz, hesabınız aktif olduğu sürece saklanır. Hesabınızı sildiğinizde hesabınıza bağlı mülk, kiracı, borç, tahsilat, masraf kayıtları ve yüklediğiniz dosyalar silinir. Mevzuat gereği saklanması zorunlu olan kayıtlar (örneğin ticari ve mali kayıtlar) yalnızca ilgili yasal süre boyunca ve yalnızca bu amaçla muhafaza edilir; süre sonunda silinir veya anonim hâle getirilir.",
  },

  { type: "h2", text: "8. Hesabınızı ve Verilerinizi Silme" },
  {
    type: "p",
    text: "Hesabınızı ve tüm verilerinizi dilediğiniz zaman kendiniz silebilirsiniz: panele giriş yaptıktan sonra Ayarlar sayfasındaki \"Hesabı Sil\" bölümünü kullanmanız yeterlidir. İşlem geri alınamaz.",
  },
  {
    type: "p",
    text: "Dilerseniz bilgi@mizanmulkyonetimi.com adresine, hesabınızın kayıtlı e-posta adresinden silme talebi göndererek de aynı sonucu elde edebilirsiniz. Talepler en geç 30 gün içinde sonuçlandırılır.",
  },
  {
    type: "p",
    text: "Verilerinizi silmeden önce dışa aktarmak isterseniz, panel içindeki raporlama ekranlarından kayıtlarınızı Excel dosyası olarak indirebilir veya yazdırabilirsiniz.",
  },

  { type: "h2", text: "9. Veri Güvenliği" },
  {
    type: "p",
    text: "Verilerinizin korunması için aldığımız teknik ve idari tedbirlerden bazıları şunlardır: tüm trafiğin SSL/TLS ile şifrelenmesi, şifrelerin geri döndürülemez şekilde saklanması, oturumların imzalı ve süreli güvenlik çerezleriyle yürütülmesi, giriş ve kayıt denemelerine hız sınırı uygulanması, yüklenen dosyalarda tür ve boyut denetimi, yetkisiz erişime karşı sunucu düzeyinde güvenlik başlıkları ve düzenli otomatik yedekleme. Buna rağmen internet üzerinden yapılan hiçbir aktarımın veya saklamanın yüzde yüz güvenli olduğunun garanti edilemeyeceğini belirtmek isteriz.",
  },

  { type: "h2", text: "10. Haklarınız" },
  {
    type: "p",
    text: "KVKK'nın 11. maddesi uyarınca; kişisel verilerinizin işlenip işlenmediğini öğrenme, işlenmişse buna ilişkin bilgi talep etme, işlenme amacını ve amaca uygun kullanılıp kullanılmadığını öğrenme, yurt içinde veya yurt dışında verilerin aktarıldığı üçüncü kişileri bilme, eksik veya yanlış işlenmiş olması hâlinde düzeltilmesini isteme, silinmesini veya yok edilmesini isteme, bu işlemlerin verilerin aktarıldığı üçüncü kişilere bildirilmesini isteme, münhasıran otomatik sistemlerle analiz edilmesi suretiyle aleyhinize bir sonucun ortaya çıkmasına itiraz etme ve kanuna aykırı işleme sebebiyle zarara uğramanız hâlinde zararın giderilmesini talep etme haklarına sahipsiniz.",
  },
  {
    type: "p",
    text: "Taleplerinizi bilgi@mizanmulkyonetimi.com adresine iletebilirsiniz. Başvurularınız en geç 30 gün içinde sonuçlandırılır.",
  },

  { type: "h2", text: "11. Çocukların Gizliliği" },
  {
    type: "p",
    text: "Hizmet 18 yaşın altındaki kişilere yönelik değildir ve bilerek 18 yaş altı kullanıcılardan kişisel veri toplanmaz. Böyle bir verinin toplandığını fark etmemiz hâlinde ilgili veriler silinir.",
  },

  { type: "h2", text: "12. Politikadaki Değişiklikler" },
  {
    type: "p",
    text: "Bu politika, Hizmette yapılan geliştirmelere veya mevzuattaki değişikliklere bağlı olarak güncellenebilir. Güncel metin her zaman bu sayfada yayımlanır; önemli değişikliklerde kayıtlı e-posta adresiniz üzerinden ayrıca bilgilendirme yapılır.",
  },

  { type: "h2", text: "13. İletişim" },
  {
    type: "p",
    text: "Bu politikaya ilişkin her türlü soru, talep ve şikâyetiniz için bilgi@mizanmulkyonetimi.com adresinden bize ulaşabilirsiniz.",
  },
];

export default function GizlilikPolitikasiPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Gizlilik Politikası</h1>
        <p className="text-sm text-slate-500 mb-8">Son güncelleme: 14 Ağustos 2026</p>
        <LegalContent blocks={BLOCKS} />
      </div>
      <Footer />
    </div>
  );
}
