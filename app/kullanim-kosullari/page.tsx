import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LegalContent, { LegalBlock } from "@/components/legal/LegalContent";

const BLOCKS: LegalBlock[] = [
  { type: "h2", text: "Madde 1 — Taraflar" },
  {
    type: "p",
    text: "Bu Kullanıcı Sözleşmesi (\"Sözleşme\"), Akabe Mah. Şehit Furkan Doğan Cad. No:11/206 Karatay/KONYA adresinde mukim Hüseyin Sefa Topbaş ile Hüseyin Sefa Topbaş'a ait www.mizanmulkyonetimi.com internet sitesi ve mobil uygulama üzerindeki Mizan Mülk Yönetimi Platformu (her ikisi birlikte \"Mizan Mülk Yönetimi\") aracılığıyla tahsilat takibi ile yönetim işlemlerini gerçekleştirecek kullanıcı (\"Kullanıcı\") arasında Mizan Mülk Yönetimi'nin kullanımının tabi olduğu şartları ve hükümleri belirlemek amacıyla düzenlenmiştir. Hüseyin Sefa Topbaş ve Kullanıcı münferit olarak \"Taraf\" ve bir arada \"Taraflar\" olarak anılacaktır.",
  },
  { type: "h2", text: "Madde 2 — Kullanım Kapsamı" },
  {
    type: "p",
    text: "2.1. Kullanıcı işbu Sözleşme ile Mizan Mülk Yönetimi kullanımı kapsamında üçüncü taraf ile herhangi bir sözleşme ilişkisinden doğan ve kendisine üçüncü tarafça düzenli olarak ödenecek bedellerin Mizan Mülk Yönetimi üzerinden takibi ve üçüncü taraf ödeme yükümlüsüne bu kapsamdaki ödeme hatırlatmalarını yönetebilecektir.",
  },
  {
    type: "p",
    text: "2.2. İşbu Sözleşme'ye konu olan hizmet (\"Hizmet / Hizmetler\"); Kullanıcı'nın tahsilat yönetim ve takip işlemlerini Mizan Mülk Yönetimi üzerinden web tabanlı yürütüldüğü düzenli tahsilat yönetim ve takip programının Kullanıcı tarafından kullanılmasını ifade etmektedir. Mizan Mülk Yönetimi üyeliği ile Kullanıcı, tahsilat yönetimi ve takibinden doğan iş ve işlemler için tasarlanmış ve kullanıma sunulan web tabanlı programı işbu Sözleşme ve ilgili mevzuata uygun olarak kullanma hakkına sahiptir.",
  },
  {
    type: "p",
    text: "2.3. Kullanıcı, Mizan Mülk Yönetimi aracılığıyla kendi tahsilatlarına ilişkin banka hesap bilgilerinin ve hesap hareketlerinin, kendi bankasına/bankalarına verdiği muvafakate istinaden Mizan Mülk Yönetimi aracılığı ile Hüseyin Sefa Topbaş'ın Mizan Mülk Yönetimi'nin yönetilmesi hususunda işbirliği yaptığı ilgili üçüncü taraf şirket/şirketler tarafından görüntülenebileceğini bilmekte olup, işbu hususu Hizmetler'in alınması kapsamında peşinen beyan ve kabul etmektedir.",
  },
  {
    type: "p",
    text: "2.4. İşbu Sözleşme'de düzenlenmeyen hususlarda Kullanıcı ile Hüseyin Sefa Topbaş arasında imzalanan ve işbu Sözleşme'ye esas teşkil eden dayanak sözleşme hükümleri geçerli olacaktır.",
  },
  { type: "h2", text: "Madde 3 — Kullanım Koşulları" },
  {
    type: "p",
    text: "3.1. Kullanıcı Mizan Mülk Yönetimi'ni işbu Sözleşme ile belirlenmiş kullanım kurallarına uygun olarak kullanacağını ve Mizan Mülk Yönetimi'ndeki her türlü faaliyetinin ve bulundurduğu veya oluşturduğu tüm içeriklerin, kullanım kurallarına ve yürürlükteki ilgili mevzuata uygun olacağını ve Hüseyin Sefa Topbaş'ı her türlü zarardan ari tutacağını peşinen kabul ve taahhüt eder. Hüseyin Sefa Topbaş'ın bu içeriklerin doğruluğunu denetleme sorumluluğu bulunmamaktadır. Kullanıcı, işbu maddedeki yükümlülüğünü ihlal etmesi sebebiyle resmi mercilerce, Mizan Mülk Yönetimi kullanan kişilerin şikâyetleri üzerine ve/veya resen alınan kararlar gereği Hüseyin Sefa Topbaş'a herhangi bir idari para cezası ve/veya müeyyide uygulanması halinde, ilgili tutarı ve Hüseyin Sefa Topbaş'ın buna bağlı olarak doğan her türlü zararını nakden, defaten ve peşin olarak tazmin etmekle yükümlü olduğunu kabul etmektedir.",
  },
  { type: "p", text: "3.2. Kullanıcı, Mizan Mülk Yönetimi'ni Hüseyin Sefa Topbaş'ın izni olmaksızın satamaz, kiralayamaz ve üçüncü kişilere bedelli veya bedelsiz olarak kullandıramaz." },
  {
    type: "p",
    text: "3.3. Kullanıcı, Mizan Mülk Yönetimi'nin sağlamış olduğu herhangi bir iletişim kanalı üzerinden üçüncü kişilerin mahremiyetine giren, uygunsuz, cinsel içerikli, hakaret ve nefret söylemi içeren, iftira niteliğinde veya tehdit, korkutmak ve/veya taciz amaçlı içerik paylaşımlarında bulunmayacağını; belirtilen şekilde bir içeriği tespit etmesi halinde Hüseyin Sefa Topbaş'ı derhal bilgilendirmekle yükümlü olduğunu, sistem içerisinde yapılan her türlü kayıt ve ödeme işlemlerinden bizzat sorumlu olduğunu kabul ve taahhüt eder. Kullanıcı, işbu maddedeki yükümlülüğünü ihlal etmesi sebebiyle resmi mercilerce, Mizan Mülk Yönetimi kullanan kişilerin şikâyetleri üzerine ve/veya resen alınan kararlar gereği Hüseyin Sefa Topbaş'a herhangi bir idari para cezası ve/veya müeyyide uygulanması halinde, ilgili tutarı ve Hüseyin Sefa Topbaş'ın buna bağlı olarak doğan her türlü zararını nakden, defaten ve peşin olarak tazmin etmekle yükümlü olduğunu kabul etmektedir.",
  },
  {
    type: "p",
    text: "3.4. Kullanıcı Mizan Mülk Yönetimi'ni, Mizan Mülk Yönetimi'nin altyapısını, bağlı donanımlarını veya yazılımlarını zarara uğratacak veya sağlıklı çalışmasını engelleyecek şekilde kullanmayacağını taahhüt eder. Bu kapsamda Kullanıcı; Mizan Mülk Yönetimi'ni kullanarak üçüncü kişilere ait sistem, bilgisayar ya da ağlara karşı siber saldırı düzenleyemez, bu şekilde üçüncü kişilerin kişisel bilgilerini toplayamaz ve kullanamaz; Mizan Mülk Yönetimi'nin çalışmasına müdahale etmek amacıyla herhangi bir araç, yazılım veya yöntem kullanamaz veya Mizan Mülk Yönetimi'ne makul olmayan büyüklükte yük getirebilecek herhangi bir işlem yapamaz; Mizan Mülk Yönetimi'ni her neviden zarara sokacak herhangi bir işlem yapamaz; yetkisiz bağlantı, kopyalama veya görüntüleme için robot, örümcek veya başka araçların yetkisiz kullanımı da dâhil olmak üzere herhangi bir şekilde yasadışı ve/veya yetkisiz olarak kullanamaz; Mizan Mülk Yönetimi'ne virüs ya da kirletici veya bozucu özellikler bulunduran dosyalar yükleyemez. Bu maddede sayılan hususlara aykırı davranışlar sebebiyle Kullanıcı ve/veya üçüncü kişiler nezdinde doğacak her neviden doğrudan veya dolaylı, maddi veya manevi zararlardan Hüseyin Sefa Topbaş sorumlu tutulamaz. Kullanıcı, Mizan Mülk Yönetimi'nin çalışmasını önleyici yazılımların kullanılması vb. işbu maddede sayılan hususlardan imtina edeceğini ve Mizan Mülk Yönetimi'ne gelecek saldırıların önlenmesi için kendi tarafında her türlü teknik önlemi aldığını kabul ve taahhüt eder.",
  },
  { type: "h2", text: "Madde 4 — Hüseyin Sefa Topbaş'ın Yükümlülükleri" },
  { type: "p", text: "4.1. Hüseyin Sefa Topbaş'ın işbu Sözleşme kapsamındaki başlıca yükümlülüğü, Hizmetler'in usulüne uygun, tam ve eksiksiz şekilde sunulması ve Mizan Mülk Yönetimi'nin kullanıma hazır bulundurulmasıdır." },
  {
    type: "p",
    text: "4.2. Hüseyin Sefa Topbaş, Mizan Mülk Yönetimi'nin kesintisiz ve sürekli olarak sunulması için gerekli önlemleri alacağını ve Mizan Mülk Yönetimi'nin herhangi bir nedenle kesintiye uğraması durumunda, mümkün olan en kısa süre içerisinde duruma müdahale edeceğini taahhüt eder. Ancak mücbir sebepler nedeniyle Mizan Mülk Yönetimi'nin ve Hizmetler'in aksaması veya kesintiye uğramasından ve Hüseyin Sefa Topbaş'ın kastı ile oluşmayan diğer her türlü neden dolayısıyla uğranılacak, Mizan Mülk Yönetimi'nin kullanılması veya kullanılamamasından kaynaklanan veri kaybı veya bozulması, Kullanıcı'nın cihazında meydana gelebilecek zarardan veya diğer özel, doğrudan veya dolaylı zarar ve ziyan da dahil her türlü kayıplardan ve zararlardan sorumlu tutulamaz. Hüseyin Sefa Topbaş, yasaların açıkça belirlediği hususlarda yalnızca kusuru oranında sorumlu olacaktır.",
  },
  {
    type: "p",
    text: "4.3. Hüseyin Sefa Topbaş, sağladığı Hizmetler'in hatalı kullanımlarından, hatalı veya mevzuata aykırı içerik girişinden, üçüncü kişilere e-posta ve/veya kısa mesaj (SMS) ile yapılan bildirimlerden, Kullanıcı'nın kullanımına ve idaresine sunulan Mizan Mülk Yönetimi sisteminden doğabilecek hiçbir maddi ve/veya manevi zararlardan ve idari ve/veya cezai yükümlülüklerden sorumlu tutulamaz. Kullanıcı, üçüncü kişilere göndereceği her türlü ticari elektronik iletinin içeriğinin 6563 sayılı Elektronik Ticaretin Düzenlenmesi Hakkında Kanun, Ticari İletişim ve Ticari Elektronik İletiler Hakkında Yönetmelik ve sair ilgili mevzuat hükümlerine uygun olacağını ve burada düzenlenen asgari unsurları içereceğini kabul, beyan ve taahhüt eder.",
  },
  { type: "h2", text: "Madde 5 — Kullanıcının Yükümlülükleri" },
  { type: "p", text: "5.1. Kullanıcı, Mizan Mülk Yönetimi'ne kayıt esnasında verdiği bilgilerin doğruluğunu onaylar ve bilgilerin yanlış ya da eksik olmasından kaynaklanacak her türlü hukuki ve cezai sonucu peşinen kabul eder. Kullanıcı Mizan Mülk Yönetimi'ni işbu Sözleşme'de ve ilgili mevzuatta belirlenen şekilde ve doğruluk dürüstlük ilkesi çerçevesinde kullanacaktır." },
  {
    type: "p",
    text: "5.2. Kullanıcı, Mizan Mülk Yönetimi'ne kayıt olmadan önce belirleyeceği kullanıcı adı ve şifrenin kullanım ve güvenliği kapsamında doğacak her türlü sorumluluğun kendisine ait olduğunu kabul eder. Kullanıcı, Mizan Mülk Yönetimi kullanımı kapsamında belirlediği kullanıcı adı ve şifresini başkalarına kullandıramaz ve devredemez. Hüseyin Sefa Topbaş, Kullanıcı'nın kullanıcı adı ve şifresinin çalınmasından, kaybolmasından, yetkisi olmayan kişilerce gerçekleştirilen işlemlerden sorumlu değildir. Kullanıcı, bu kapsamda gerçekleştirilen işlemlerin yetkisiz işlem olarak geçersizliğini ileri süremeyeceğini, yetkisi olmayan kişiler tarafından gerçekleştirilen işlemlerden doğacak idari, hukuki ve cezai sorumluluğu üstleneceğini kabul, beyan ve taahhüt eder.",
  },
  { type: "p", text: "5.3. Kullanıcı, Mizan Mülk Yönetimi'ndeki hesabı üzerinden yapacağı her türlü işlemden bizzat kendisinin sorumlu olduğunu kabul eder." },
  { type: "p", text: "5.4. Kullanıcı, Mizan Mülk Yönetimi'ne üyeliğini tek taraflı olarak iptal etse bile, bu iptal işleminden önce üyeliği sırasında Mizan Mülk Yönetimi'nde kullanıcı hesabı üzerinde gerçekleştirmiş olduğu tüm işlemlerden sorumlu olduğunu kabul eder." },
  { type: "p", text: "5.5. Hizmetler'in kullanımına ilişkin tüm sorumluluk yalnızca Kullanıcı'ya aittir." },
  { type: "p", text: "5.6. Kullanıcı bu Sözleşme'yi onaylamaya ve hükümleri kabul etmeye yetkili olduğunu kabul, beyan ve taahhüt eder." },
  {
    type: "p",
    text: "5.7. Kullanıcı, Mizan Mülk Yönetimi'ni Sözleşme yaptığı mevcut haliyle kabul etmiş sayılmaktadır. Mizan Mülk Yönetimi ile ilgili olarak, bu Sözleşme'de belirlenenler dışında ve yasaların izin verdiği durumlar haricinde Hüseyin Sefa Topbaş zımni veya açıkça veya kanuni olarak, ticari elverişlilik veya belli bir amaca uygunluk da dahil olmak üzere hiçbir garanti taahhüdünde bulunmamaktadır.",
  },
  { type: "p", text: "5.8. Kullanıcı, Hizmetler'in ifasına ilişkin olarak taraflarca belirlenecek kullanım ücretlerini Hüseyin Sefa Topbaş tarafından bildirilen banka hesabına ödeyecektir." },
  { type: "h2", text: "Madde 6 — Fikri Mülkiyet" },
  {
    type: "p",
    text: "6.1. Kullanıcı, Mizan Mülk Yönetimi üzerinde Fikir ve Sanat Eserleri Kanunu (\"FSEK\") uyarınca fikri mülkiyet konusu olabilecek her türlü eser ve bu eserlere ilişkin görsel, içerik, kaynak kodu, tasarım, know-how (\"Materyal\") üzerindeki FSEK'in 21. maddesindeki işleme, 22. maddesindeki çoğaltma, 23. maddesindeki yayma, 24. maddesindeki temsil, 25. maddesindeki işaret, ses ve/veya görüntü nakline yarayan araçlarla umuma iletim şeklindeki mali haklar ile aynı maddelerdeki manevi hakların münhasıran Hüseyin Sefa Topbaş'a ait olduğunu kabul, beyan ve taahhüt eder.",
  },
  { type: "p", text: "6.2. Kullanıcı, Hüseyin Sefa Topbaş'ın FSEK kapsamında Mizan Mülk Yönetimi üzerindeki fikri mülkiyet haklarını ve eserlerini kullanamaz, paylaşamaz, dağıtamaz, sergileyemez, çoğaltamaz, bunlardan türetebileceği çalışmalar yapamaz ve her ne sebeple olursa olsun bunlar üzerinde hak iddia edemez." },
  {
    type: "p",
    text: "6.3. Kullanıcı, danışmanları, iştirakleri, ajansları, yüklenicileri, halefleri veya vekilleri, Mizan Mülk Yönetimi üzerindeki işlemleri kapsamında Hüseyin Sefa Topbaş'ın veya herhangi bir üçüncü kişinin marka, patent, telif hakkı, ticari sır gibi haklarına halel getirmemeyi; aksi halde, üçüncü kişilerin Hüseyin Sefa Topbaş'tan her ne nam adı altında olursa olsun herhangi alacak talebinde bulunması halinde, Hüseyin Sefa Topbaş'ın uğradığı ve/veya uğraması muhtemel ispatlanabilir zararların tamamını herhangi mahkeme hükmüne gerek olmaksızın, ilk talep anında, nakden ve defaten derhal tazmin etmeyi kabul, beyan ve taahhüt eder.",
  },
  { type: "p", text: "6.4. Kullanıcı, Mizan Mülk Yönetimi'ni, Hüseyin Sefa Topbaş'ın ticari markalarını herhangi bir şekilde küçük düşürecek ve ticari markaları dolayısıyla sahip olduğu itibarını zedeleyecek ve/veya itibarına zarar verecek şekilde kullanmayacaktır." },
  { type: "h2", text: "Madde 7 — Sözleşmenin Süresi ve Feshi" },
  { type: "p", text: "7.1. Hüseyin Sefa Topbaş, Kullanıcı'nın Mizan Mülk Yönetimi'ni işbu Sözleşme'ye, yürürlükteki mevzuata veya kullanım koşullarına aykırı kullanımı hallerinde, bildirimde bulunmaksızın tek taraflı olarak sözleşmeyi feshetme ve Kullanıcı'nın üyeliğini iptal etme hakkına sahiptir." },
  { type: "p", text: "7.2. Kullanıcı dilediği zaman, Hüseyin Sefa Topbaş'ın Madde 1'de belirtilen adresine yazılı bildirimde bulunarak Mizan Mülk Yönetimi üyeliğini sonlandırma hakkına sahiptir. İşbu durumda Kullanıcı ile Hüseyin Sefa Topbaş arasında akdedilen dayanak sözleşme hükümlerine göre hizmet bedellerinin ödenmesi gerçekleşecektir." },
  { type: "h2", text: "Madde 8 — Son Hükümler" },
  {
    type: "p",
    text: "8.1. İşbu Sözleşme kapsamında Taraflar'ın Sözleşme'den kaynaklanan yükümlülüklerinin ifasını kısmen veya tamamen engelleyen, Taraflar'ın iradeleri dışında oluşan, kaçınılması ve/veya önceden kestirilmesi mümkün olmayan genel grev, lokavt, savaş, terörist hareketler, deprem, sel gibi doğal afetler \"Mücbir Sebep\" sayılacaktır. Mücbir Sebep halleri derhal diğer Taraf'a bildirilir. Mücbir Sebep süresince Taraflar'ın edimleri askıya alınacaktır. Mücbir Sebep halinin 2 (iki) aydan fazla sürmesi halinde, Taraflar, işbu Sözleşme'yi Mücbir Sebep hali ortadan kalkana kadar askıya alabilecekler ya da karşılıklı olarak mutabık kalmak suretiyle Sözleşme'yi feshedebilecektir. Taraflar, Mücbir Sebep'in doğduğu ana kadar birbirlerine karşı olan yükümlülüklerini yerine getirmekle yükümlüdür.",
  },
  {
    type: "p",
    text: "8.2. Bu Sözleşme'nin herhangi bir hükmünün, bir bölümünün ya da hükümlerinin, herhangi bir mahkeme ya da yetkili bir diğer makam tarafından geçersiz, uygulanamaz ve hükümsüz olarak kabul edilmesi durumunda, söz konusu hüküm, bu Sözleşme'den ayrılmış ya da çıkarılmış olarak kabul edilecektir. Bu halde Sözleşme'nin geri kalan tüm hükümleri geçerliliğini korur. Taraflar, diğer hükümlerin arasına bu hükmün yerine yasaların izin verdiği ölçüde ve çıkarılan kelimelerin anlamına ve amacına mümkün olduğunca en yakın şekilde yeni bir hüküm koymayı kabul etmektedir.",
  },
  {
    type: "p",
    text: "8.3. Taraflar, bu Sözleşme'den doğabilecek ihtilaflarda Hüseyin Sefa Topbaş'ın veri tabanlarında tutulan elektronik ve sistem kayıtlarının, ticari kayıtlarının, defter kayıtlarının, mikrofilm, mikrofiş ve bilgisayar kayıtlarının bağlayıcı, kesin ve münhasır delil teşkil edeceğini ve bu maddenin HMK 193. madde anlamında delil sözleşmesi niteliğinde olduğunu kabul, beyan ve taahhüt ederler.",
  },
  {
    type: "p",
    text: "8.4. Bu Sözleşme'nin imzalanması tarihinde Taraflar'ca belirtilen adresler Taraflar'ın geçerli tebligat adresleri olup adres değişikliği karşı Taraf'a yazılı olarak bildirilmediği sürece bu adreslere gönderilen tebligat ve bildirimler, geçerli kabul edilerek tüm sonuçlarını doğuracaktır. Bununla birlikte Türk Ticaret Kanunu'nun 18/III maddesinde diğer Taraf'ı temerrüde düşürme, Sözleşme'nin feshi veya Sözleşme'den dönme maksadıyla yapılacak bildirimler ancak bir noter kanalıyla, iadeli taahhütlü posta ile teslim edildiğinde veya güvenli elektronik imza kullanılarak kayıtlı elektronik posta sistemi ile gönderildiğinde, usulüne uygun olarak ve Türk Kanunları uyarınca tebliğ edilmiş kabul edilecektir.",
  },
  { type: "p", text: "8.5. Bu Sözleşme'den kaynaklanan veya bu Sözleşme ile ilişkili olan tüm uyuşmazlıklarda KONYA mahkemeleri yetkilidir." },
  { type: "p", text: "8.6. Kullanıcı, bu Sözleşme'nin imzası ile tahakkuk edecek olan damga vergisi, harç, fon vs. kalemlerini zamanında ve usulüne uygun olarak ödeyecektir." },
  {
    type: "p",
    text: "8.7. Hüseyin Sefa Topbaş, herhangi bir zamanda, herhangi bir gerekçe göstermeksizin ve istediği şekilde tek taraflı olarak işbu Sözleşme ve eklerinde değişiklik yapabilme ve bunları güncelleyebilme hakkına sahip olmakla birlikte, Kullanıcı tarafından işbu Sözleşme'de tek taraflı değişiklik yapılamayacaktır. Hüseyin Sefa Topbaş tarafından yapılan bu değişiklik veya güncellemeler Mizan Mülk Yönetimi'nde yayınlandığı tarihte yürürlüğe girecek olup ayrıca Kullanıcı'ya herhangi bir bildirimde bulunulması veya duyuru yapılması şart değildir. Yapılan tadiller veya güncellenen hükümler geçmişe yönelik etki doğurmayacak olup yalnızca yürürlüğe girdiği tarihten sonraki hususlar için geçerli olacaktır.",
  },
  { type: "p", text: "8.8. Mizan Mülk Yönetimi'nin kullanım koşullarındaki güncellemeler, Kullanıcı tarafından takip edilmeli ve uygulanmalıdır. Kullanıcı, bu değişiklikleri bilmediğini iddia edemeyeceğini kabul eder." },
  { type: "h2", text: "Madde 9 — Yürürlük" },
  { type: "p", text: "İşbu Sözleşme, dijital ortamda onaylanmak suretiyle, onaylandığı an itibariyle yürürlüğe girmiştir." },
];

export default function KullanimKosullariPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h1 className="text-3xl font-bold text-slate-900 mb-8">Mizan Mülk Yönetimi Kullanıcı Sözleşmesi</h1>
        <LegalContent blocks={BLOCKS} />
      </div>
      <Footer />
    </div>
  );
}
