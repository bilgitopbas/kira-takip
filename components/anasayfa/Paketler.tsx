import { Ok, Tik, gecikme } from "./SvgTanimlari";

// Fiyat yalnız web sitesinde; mobil uygulamada fiyat ya da ödeme bağlantısı gösterilmez
// (Capacitor kabuğu "/" adresini girişe yönlendirir, bkz. NativeLoginRedirect).
const BIREYSEL = ["Gelişmiş Finansal Raporlama", "Mobil Uygulama ile Kolay Yönetim", "Anlık Bildirimler (E-posta & Uygulama)", "Kıymetli Evrak Depolama"];
const KURUMSAL = [
  "Gelişmiş Finansal Raporlama",
  "Kira Takibi",
  "Kıymetli Evrak Depolama",
  "Mobil Uygulama ile Kolay Yönetim",
  "E-posta ve Mesajlaşma Desteği",
  "Anlık Bildirimler (E-posta & Uygulama)",
  "Kiracı ile İletişim Hattı",
  "Bakım-Onarım Süreci Desteği",
  "Profesyonel Mülk Kiralama Hizmeti",
  "Hukuki Destek",
  "Rutin Mülk Kontrolü",
  "7/24 Acil Durum Çağrı Merkezi",
  "Mülk Sigortası İşlemleri Takibi",
  "Vekaleten Kira Tahsilatı",
  "Vergi Kontrolü",
];

function Liste({ maddeler }: { maddeler: string[] }) {
  return (
    <ul>
      {maddeler.map((m) => (
        <li key={m}>
          <span>
            <Tik />
          </span>
          {m}
        </li>
      ))}
    </ul>
  );
}

export default function Paketler() {
  return (
    <section className="fiyat bolum" id="paketler" aria-labelledby="fiyatBas">
      <div className="kap">
        <div className="orta">
          <span className="cip belir">Fiyatlandırma</span>
          <h2 className="bas belir" id="fiyatBas" style={gecikme(".08s")}>
            Basit, <span className="vurgu">Şeffaf</span> Fiyatlandırma
          </h2>
          <p className="alt belir" style={gecikme(".16s")}>
            Tüm planlar 45 gün ücretsiz deneme ile gelir — kredi kartı gerekmez.
          </p>
        </div>
        <div className="paketler">
          <div className="paket acik belir">
            <span className="tag">Bireysel</span>
            <h3>Kontrol Sizde</h3>
            <p className="acik-metin">
              Kendi mülklerinizin profesyonel yöneticisi olun; dijital altyapımızla tüm süreci tek başınıza, kolayca ve hatasız yönetin.
            </p>
            <div className="ucret">
              75 TL<small>/ mülk / ay</small>
            </div>
            <Liste maddeler={BIREYSEL} />
            <a href="/register" className="dugme derin">
              Hemen Başla <Ok />
            </a>
          </div>
          <div className="paket koyu belir" style={gecikme(".1s")}>
            <span className="tag">Kurumsal</span>
            <h3>Anahtar Teslim</h3>
            <p className="acik-metin">Hiçbir detayla uğraşmadan, tüm mülkünüzü biz yönetelim. Siz sadece gelirinizin keyfini çıkarın.</p>
            <div className="ucret">Özel Teklif</div>
            <Liste maddeler={KURUMSAL} />
            <a href="#sss" className="dugme pembe">
              Bize Ulaşın <Ok />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
