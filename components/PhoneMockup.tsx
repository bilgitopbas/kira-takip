export default function PhoneMockup() {
  const occupancy = 72;
  const circumference = 2 * Math.PI * 45;
  const offset = circumference * (1 - occupancy / 100);

  const tenants = [
    { name: "Ahmet Y.", status: "Ödendi", color: "bg-green-500" },
    { name: "Elif K.", status: "Bekliyor", color: "bg-amber-500" },
    { name: "Mehmet S.", status: "Ödendi", color: "bg-green-500" },
  ];

  return (
    <div className="relative w-[270px] h-[550px] mx-auto">
      <div className="absolute inset-0 bg-black rounded-[3rem] p-3 shadow-2xl">
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-24 h-6 bg-black rounded-full z-10" />
        <div className="relative w-full h-full bg-white rounded-[2.3rem] overflow-hidden pt-10 px-5 pb-6">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-7 h-7 rounded-lg bg-[#17B6AE]/10 text-[#17B6AE] flex items-center justify-center text-xs font-bold">M</div>
            <span className="text-xs font-semibold text-slate-700">Mizan Mülk Yönetimi</span>
          </div>

          <p className="text-xs text-slate-400 mb-2">Doluluk Oranı</p>
          <div className="relative w-28 h-28 mx-auto mb-6">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle cx="50" cy="50" r="45" fill="none" stroke="#F1F5F9" strokeWidth="10" />
              <circle
                cx="50" cy="50" r="45" fill="none" stroke="#17B6AE" strokeWidth="10"
                strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xl font-bold text-slate-800">%{occupancy}</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 mb-6 text-[10px] text-slate-500">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#17B6AE]" />Dolu</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-200" />Boş</span>
          </div>

          <p className="text-xs text-slate-400 mb-2">Kiracı Bilgileri</p>
          <div className="space-y-2">
            {tenants.map((t) => (
              <div key={t.name} className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2">
                <span className="text-xs font-medium text-slate-700">{t.name}</span>
                <span className={`text-[10px] text-white px-2 py-0.5 rounded-full ${t.color}`}>{t.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}