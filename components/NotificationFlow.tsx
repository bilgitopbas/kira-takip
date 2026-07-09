export default function NotificationFlow() {
  return (
    <section className="bg-slate-900 py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 gap-12 items-center">
        <div className="order-2 md:order-1 relative bg-slate-800 rounded-3xl p-10 border border-slate-700 flex items-center justify-center gap-10">
          <div className="w-16 h-16 rounded-2xl bg-[#17B6AE]/15 text-[#17B6AE] flex items-center justify-center text-xl font-bold">
            M
          </div>

          <div className="relative flex items-center justify-center">
            <span className="absolute w-16 h-16 rounded-full bg-[#17B6AE]/20 animate-ping" />
            <span className="absolute w-10 h-10 rounded-full bg-[#17B6AE]/30 animate-ping" style={{ animationDelay: "0.4s" }} />
            <div className="relative w-14 h-14 rounded-2xl bg-[#17B6AE] text-white flex items-center justify-center text-xl shadow-lg shadow-[#17B6AE]/40">
              🔔
            </div>
          </div>

          <div className="w-16 h-16 rounded-2xl bg-amber-500/15 text-amber-400 flex items-center justify-center text-xl">
            🏠
          </div>
        </div>

        <div className="order-1 md:order-2">
          <span className="inline-block text-xs font-medium text-[#17B6AE] bg-[#17B6AE]/10 px-3 py-1 rounded-full mb-3">
            SMS &amp; E-POSTA ENTEGRASYONU
          </span>
          <h2 className="text-3xl font-semibold text-white mb-4">
            Bildirim &amp; Hatırlatma
          </h2>
          <p className="text-slate-400 leading-relaxed">
            Kira hatırlatması, ödeme onayı, sözleşme bilgilendirmesi — Mizan Mülk
            Yönetimi tüm bu bildirimleri otomatik olarak SMS ve e-posta ile
            gönderir, siz elle takip etmezsiniz.
          </p>
        </div>
      </div>
    </section>
  );
}