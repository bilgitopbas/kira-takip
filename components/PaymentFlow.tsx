export default function PaymentFlow() {
  const nodes = [
    { label: "Kiracı", icon: "🧍", color: "bg-slate-100 text-slate-600" },
    { label: "iyzico", icon: "💳", color: "bg-blue-50 text-blue-600" },
    { label: "Mizan", icon: "M", color: "bg-[#17B6AE]/10 text-[#17B6AE]" },
    { label: "Mülk Sahibi", icon: "🏠", color: "bg-amber-50 text-amber-600" },
  ];

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <div className="grid md:grid-cols-2 gap-12 items-center">
        <div>
          <span className="inline-block text-xs font-medium text-[#17B6AE] bg-[#17B6AE]/10 px-3 py-1 rounded-full mb-3">
            KREDİ KARTI ENTEGRASYONU
          </span>
          <h2 className="text-3xl font-semibold text-slate-800 mb-2">
            iyzico ile Online Tahsilat
          </h2>
          <div className="flex items-center gap-2 mb-4">
            <span className="bg-slate-900 text-white text-xs font-bold px-2.5 py-1 rounded-md">T+1</span>
            <span className="text-sm text-slate-500">bir gün içinde hesabınızda</span>
          </div>
          <p className="text-slate-500 leading-relaxed">
            Kiracı kira ödemesini iyzico üzerinden kredi kartıyla yapar. Ödeme bir
            gün sonra hesabınıza geçer ve sisteme otomatik tahsilat olarak işlenir
            — elle kayıt girmenize gerek kalmaz.
          </p>
        </div>

        <div className="relative bg-gray-50 rounded-3xl p-8 border border-gray-100">
          <div className="relative h-2 bg-gray-200 rounded-full mb-10 mt-6">
            <div className="absolute inset-0 rounded-full overflow-hidden">
              <span className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-[#17B6AE] animate-flow shadow-md shadow-[#17B6AE]/50" style={{ animationDelay: "0s" }} />
              <span className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-[#17B6AE] animate-flow shadow-md shadow-[#17B6AE]/50" style={{ animationDelay: "1.5s" }} />
            </div>
          </div>

          <div className="flex items-start justify-between">
            {nodes.map((n) => (
              <div key={n.label} className="flex flex-col items-center gap-2 w-1/4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold shadow-sm ${n.color}`}>
                  {n.icon}
                </div>
                <span className="text-xs font-medium text-slate-600 text-center">{n.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}