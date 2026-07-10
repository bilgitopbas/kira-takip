const TESTIMONIALS = [
  {
    name: "Şükrü Özgül",
    role: "Özgül Trailer",
    photo: "/photo-ozgul.jpg",
    text: "İşimiz gereği sürekli seyahat ediyorum. Eskiden kira takibi, ödemeler ve sözleşmeler ciddi zaman alıyordu. Mizan Mülk Yönetimi ile tüm mülklerimi tek bir uygulama üzerinden takip edebiliyorum.",
  },
  {
    name: "Mevlüt Topbaş",
    role: "Opt. Dr. — Genel Cerrahi Uzmanı",
    photo: "/photo-topbas.jpg",
    text: "Mizan Mülk Yönetimi benim için ciddi bir kolaylık sağladı. Gayrimenkullerle ilgili süreçleri düzenli, şeffaf ve sistemli şekilde takip edebiliyorum.",
  },
  {
    name: "Hasan Çıbık",
    role: "Mülk Sahibi",
    photo: null,
    initials: "HÇ",
    text: "Eski usul yöntemlerle sözleşme tarihi takip etmek, kim ödedi, kim gecikti diye Excel tutmak çok karışıktı. Mizan Mülk Yönetimi uygulaması ile fiziki evraklara rahatlıkla erişebiliyor finans raporları ile mülkümün değerini analiz edebiliyorum.",
  },
];

export default function Testimonials() {
  return (
    <section id="referanslar" className="bg-gray-50 py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-semibold text-slate-800 mb-2">Referanslarımız</h2>
          <p className="text-slate-500 text-sm">Müşterilerimiz Mizan Mülk Yönetimini anlatıyor</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t) => (
            <div
              key={t.name}
              className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col gap-5"
            >
              <div className="flex items-center gap-4">
                {t.photo ? (
                  <img
                    src={t.photo}
                    alt={t.name}
                    className="w-16 h-16 rounded-2xl object-cover object-top shadow-sm flex-shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#17B6AE] to-[#0d8b84] flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-sm">
                    {t.initials}
                  </div>
                )}
                <div>
                  <p className="font-semibold text-slate-800 text-sm">{t.name}</p>
                  <p className="text-xs text-[#17B6AE] font-medium">{t.role}</p>
                  <div className="flex gap-0.5 mt-1">
                    {[1,2,3,4,5].map((s) => (
                      <svg key={s} className="w-3 h-3 text-amber-400 fill-amber-400" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                </div>
              </div>

              <div className="relative">
                <svg className="absolute -top-1 -left-1 w-6 h-6 text-[#17B6AE]/20" fill="currentColor" viewBox="0 0 32 32">
                  <path d="M9.352 4C4.456 7.456 1 13.12 1 19.36c0 5.088 3.072 8.064 6.624 8.064 3.36 0 5.856-2.688 5.856-5.856 0-3.168-2.208-5.472-5.088-5.472-.576 0-1.344.096-1.536.192.48-3.264 3.552-7.104 6.624-9.024L9.352 4zm16.512 0c-4.8 3.456-8.256 9.12-8.256 15.36 0 5.088 3.072 8.064 6.624 8.064 3.264 0 5.856-2.688 5.856-5.856 0-3.168-2.304-5.472-5.184-5.472-.576 0-1.248.096-1.44.192.48-3.264 3.456-7.104 6.528-9.024L25.864 4z" />
                </svg>
                <p className="text-slate-600 text-sm leading-relaxed pl-6">{t.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
