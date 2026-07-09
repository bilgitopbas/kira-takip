export default function KiraSozlesmesiPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Kira Sözleşmesi Oluştur</h1>
        <p className="text-sm text-slate-500 mt-1">Dijital kira sözleşmesi oluşturma aracı.</p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-10 text-center">
        <div className="w-14 h-14 rounded-2xl bg-[#17B6AE]/10 text-[#17B6AE] flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M14 2v6h6M9 13h6M9 17h6" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Yakında Hazır Olacak</h2>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          Kiracı bilgilerinizden otomatik olarak hazırlanan, imzaya hazır dijital kira sözleşmesi oluşturma
          özelliğimiz üzerinde çalışıyoruz. Kısa süre içinde burada aktif olacak.
        </p>
      </div>
    </div>
  );
}
