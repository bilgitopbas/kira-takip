// Yalnızca yazdırma çıktısında görünen marka başlığı.
// Ekranda gizli (hidden), çıktıda blok olarak açılır.
export default function YazdirmaBasligi({
  baslik,
  altBaslik,
}: {
  baslik: string;
  altBaslik?: string;
}) {
  return (
    <div className="hidden print:block mb-6">
      <div className="flex items-center justify-between gap-4 pb-4 border-b-4 border-[#17B6AE]">
        <div className="flex items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-yeni.png" alt="" className="h-16 w-auto" />
          <div>
            <p className="text-3xl font-bold text-[#17B6AE] leading-tight tracking-tight">
              MİZAN MÜLK YÖNETİMİ
            </p>
            <p className="text-sm text-slate-500">mizanmulkyonetimi.com</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-slate-800">{baslik}</p>
          {altBaslik && <p className="text-sm text-slate-600">{altBaslik}</p>}
          <p className="text-xs text-slate-400 mt-1">
            Yazdırma tarihi: {new Date().toLocaleDateString("tr-TR")}
          </p>
        </div>
      </div>
    </div>
  );
}
