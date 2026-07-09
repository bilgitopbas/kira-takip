export default function AsistanPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          Mizan Asistan
          <span className="text-xs font-bold bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white px-2.5 py-1 rounded-full uppercase tracking-widest">
            Beta
          </span>
        </h1>
        <p className="text-sm text-slate-500 mt-1">Yapay zeka destekli mülk yönetimi asistanınız.</p>
      </div>

      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-10 text-center">
        <div className="absolute w-72 h-72 bg-violet-500/20 rounded-full blur-3xl -top-20 -right-10" />
        <div className="absolute w-72 h-72 bg-[#17B6AE]/20 rounded-full blur-3xl -bottom-20 -left-10" />
        <div className="relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-white/10 text-white flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l1.9 4.6L18.5 9l-4.6 1.9L12 15.5l-1.9-4.6L5.5 9l4.6-1.9L12 3z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 15l.8 1.9 1.9.8-1.9.8-.8 1.9-.8-1.9-1.9-.8 1.9-.8L19 15z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-white mb-2">Yapay Zeka Asistanınız Yakında Burada</h2>
          <p className="text-sm text-slate-300 max-w-md mx-auto">
            Mizan Asistan; kiracı sorularını yanıtlayacak, gecikmiş ödemeleri özetleyecek ve mülk portföyünüzle
            ilgili sorularınızı doğal dille cevaplayacak. Şu an geliştirme aşamasında — beta sürümü kısa süre
            içinde burada aktif olacak.
          </p>
        </div>
      </div>
    </div>
  );
}
