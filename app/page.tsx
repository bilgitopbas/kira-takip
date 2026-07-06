import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import TrustedCompanies from "@/components/TrustedCompanies";
import NotificationFlow from "@/components/NotificationFlow";
import PhoneMockup from "@/components/PhoneMockup";
import Testimonials from "@/components/Testimonials";
import FaqContact from "@/components/FaqContact";
import StatsSection from "@/components/StatsSection";
import HowItWorks from "@/components/HowItWorks";

const HERO_BENEFITS = ["Kullanıcı Dostu Arayüz", "Bulut Tabanlı Erişim", "Güvenli Altyapı"];

const WHAT_WE_DO = [
  {
    icon: "🏢",
    color: "from-[#17B6AE] to-[#0d8b84]",
    title: "Mülk Yönetimi",
    desc: "Taşınmazlarınızın tüm yönetim süreci tek merkezden ve sistemli biçimde yürütülür. Her bir mülkün doluluk durumu, kullanım bilgileri ve temel verileri düzenli olarak kayıt altına alınır. Süreçlerin şeffaf olması, mülk sahiplerine güvenli bir kontrol alanı sağlar. Farklı şehirlerde bulunan taşınmazlar tek uygulama üzerinden yönetilebilir. Bu sayede mülk yönetimi karmaşık bir yük olmaktan çıkar. Kontrol her zaman sizde olur.",
  },
  {
    icon: "💰",
    color: "from-blue-500 to-blue-700",
    title: "Kira Takibi",
    desc: "Kira bedelleri ve ödeme tarihleri sistemli biçimde takip edilir. Ödenen, geciken veya bekleyen kiralar net şekilde görüntülenir. Tüm hareketler kayıt altına alınarak düzenli bir finansal tablo oluşturulur. Olası gecikmeler erkenden fark edilerek gerekli bilgilendirmeler yapılır. Bu yapı kira gelirlerinin sürdürülebilirliğini destekler. Manuel takip ihtiyacı ortadan kalkar.",
  },
  {
    icon: "📄",
    color: "from-amber-500 to-amber-700",
    title: "Sözleşme ve Evrak Yönetimi",
    desc: "Kira sözleşmeleri ve tüm mülke ilişkin belgeler dijital ortamda güvenle saklanır. Evraklar düzenli klasör yapısı sayesinde kolayca bulunur. Fiziki belge karmaşası ve kayıp riski ortadan kaldırılır. İhtiyaç duyulan belgelere her an erişim sağlanır. Yasal takvimler ve kritik tarihler gözden kaçırılmaz.",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* HERO */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-4xl sm:text-5xl font-semibold text-slate-800 leading-tight mb-6">
              Kira Takibi Yazılımı ile
              <span className="text-[#17B6AE]"> Zaman Kazanın</span>
            </h1>
            <p className="text-slate-500 text-lg mb-8">
              Gayrimenkul portföyünüzü tek bir ekrandan yönetin. Finansal raporlar,
              kiracı bildirimleri ve daha fazlası parmaklarınızın ucunda.
            </p>
            <ul className="space-y-3 mb-8">
              {HERO_BENEFITS.map((item) => (
                <li key={item} className="flex items-center gap-3 text-slate-700">
                  <span className="w-5 h-5 rounded-full bg-[#17B6AE]/10 text-[#17B6AE] flex items-center justify-center text-xs">✓</span>
                  {item}
                </li>
              ))}
            </ul>
            <div className="flex gap-4">
              <a href="/register" className="bg-[#17B6AE] hover:bg-[#149891] text-white font-medium px-6 py-3 rounded-lg transition">Ücretsiz Başla</a>
              <a href="#neler-yapiyoruz" className="text-[#17B6AE] font-medium px-6 py-3 rounded-lg border border-[#17B6AE] hover:bg-[#17B6AE]/5 transition">Daha Fazlası</a>
            </div>
          </div>

          <div className="relative h-80 flex items-center justify-center">
            <div className="absolute w-64 h-64 bg-[#17B6AE]/25 rounded-full blur-3xl" />
            <img
              src="/logo-hero.png"
              alt="Mizan Mülk Yönetimi"
              className="relative z-10 h-80 w-auto object-contain drop-shadow-2xl animate-float"
            />
          </div>
        </div>
      </section>

      {/* NELER YAPIYORUZ */}
      <section id="neler-yapiyoruz" className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-semibold text-slate-800 text-center mb-12">Neler Yapıyoruz?</h2>
          <div className="space-y-6">
            {WHAT_WE_DO.map((f) => (
              <div
                key={f.title}
                className="group bg-white rounded-3xl border border-gray-100 p-8 flex flex-col md:flex-row gap-6 items-start hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                <div className={`w-16 h-16 shrink-0 rounded-2xl bg-gradient-to-br ${f.color} flex items-center justify-center text-2xl shadow-lg`}>
                  {f.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 text-xl mb-2 group-hover:text-[#17B6AE] transition">{f.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* RAKAMLARLA MİZAN */}
      <StatsSection />

      {/* SMS & EPOSTA */}
      <NotificationFlow />

      {/* NASIL KULLANILIR */}
      <HowItWorks />

      {/* MOBİL UYGULAMA */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-block text-xs font-medium text-[#17B6AE] bg-[#17B6AE]/10 px-3 py-1 rounded-full mb-3">ÇOK YAKINDA</span>
            <h2 className="text-3xl font-semibold text-slate-800 mb-4">Her Yerden Yönetin, Hiçbir Şey Kaçmasın</h2>
            <p className="text-slate-500 mb-8">
              Ofisin dışındayken bile portföyünüz cebinizde olacak. Anlık bildirimler,
              hızlı tahsilat, saha denetimi — iOS ve Android için hazırlanıyor.
            </p>
            <div className="flex gap-4">
              <div className="flex items-center gap-2 bg-slate-100 text-slate-400 px-5 py-3 rounded-lg text-sm font-medium">App Store — Çok Yakında</div>
              <div className="flex items-center gap-2 bg-slate-100 text-slate-400 px-5 py-3 rounded-lg text-sm font-medium">Google Play — Çok Yakında</div>
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
        <h2 className="text-3xl font-semibold text-slate-800 mb-4">Hemen Ücretsiz Deneyin</h2>
        <p className="text-slate-500 mb-8">45 gün boyunca hiçbir ücret ödemeden tüm özellikleri kullanın.</p>
        <a href="/register" className="bg-[#17B6AE] hover:bg-[#149891] text-white font-medium px-8 py-3 rounded-lg transition inline-block">Kayıt Ol</a>
      </section>

      <Footer />
    </div>
  );
}