export default function DashboardPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Kontrol Paneli</h1>
        <p className="text-sm text-slate-400 mt-1">Mulklerinizin genel durumu</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <p className="text-xs font-medium text-slate-400 mb-1">Toplam Mulk</p>
          <p className="text-3xl font-bold text-slate-800">0</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <p className="text-xs font-medium text-slate-400 mb-1">Toplam Kiraci</p>
          <p className="text-3xl font-bold text-slate-800">0</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <p className="text-xs font-medium text-slate-400 mb-1">Bu Ay Tahsilat</p>
          <p className="text-3xl font-bold text-slate-800">0 TL</p>
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
        <h3 className="text-lg font-semibold text-slate-700 mb-2">Ilk mulkunuzu ekleyin</h3>
        <p className="text-sm text-slate-400 mb-6 max-w-sm mx-auto">Mulklerinizi sisteme ekleyerek kira takibine baslayin.</p>
        <a href="/dashboard/mulk/ekle" className="inline-flex bg-[#17B6AE] hover:bg-[#149891] text-white font-semibold px-6 py-3 rounded-xl transition text-sm">Mulk Ekle</a>
      </div>
    </div>
  );
}
