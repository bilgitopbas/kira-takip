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
        {/* Logonun içinde marka adı zaten yazıyor, ayrıca metin olarak
            tekrarlanmıyor. */}
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-yeni.png" alt="Mizan Mülk Yönetimi" className="h-20 w-auto" />
          <p className="text-sm text-slate-500 mt-1">mizanmulkyonetimi.com</p>
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
