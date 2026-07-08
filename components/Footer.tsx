import Image from "next/image";

export default function Footer() {
  return (
    <footer id="iletisim" className="bg-slate-900 text-slate-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="bg-white inline-block rounded-xl p-3 mb-4">
              <Image
                src="/logo.png"
                alt="Mizan Mülk Yönetimi"
                width={180}
                height={54}
                className="h-14 w-auto object-contain"
                style={{ width: "auto" }}
              />
            </div>
            <p className="text-sm text-slate-400">
              Kira ve mülk yönetimini dijitalleştiren SaaS platformu.
            </p>
          </div>

          <div>
            <h4 className="text-white font-medium mb-3 text-sm">Ürün</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><a href="#neler-yapiyoruz" className="hover:text-white transition">Neler Yapıyoruz?</a></li>
              <li><a href="#paketler" className="hover:text-white transition">Paketlerimiz</a></li>
              <li><a href="#sss" className="hover:text-white transition">S.S.S.</a></li>
              <li><a href="#referanslar" className="hover:text-white transition">Referanslarımız</a></li>
              <li><a href="/blog" className="hover:text-white transition">Blog</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-medium mb-3 text-sm">Hesap</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><a href="/register" className="hover:text-white transition">Kayıt Ol</a></li>
              <li><a href="/login" className="hover:text-white transition">Giriş Yap</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-medium mb-3 text-sm">İletişim</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>info@mizanmulkyonetimi.com</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-10 pt-6 text-sm text-slate-500 text-center">
          © {new Date().getFullYear()} Mizan Mülk Yönetimi. Tüm hakları saklıdır.
        </div>
      </div>
    </footer>
  );
}