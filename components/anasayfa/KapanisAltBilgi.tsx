import Image from "next/image";
import Link from "next/link";
import { Ok, gecikme } from "./SvgTanimlari";

const YASAL = [
  { label: "Gizlilik Politikası", href: "/gizlilik-politikasi" },
  { label: "Aydınlatma Metni", href: "/aydinlatma-metni" },
  { label: "Açık Rıza Metni", href: "/acik-riza-metni" },
  { label: "Kullanım Koşulları", href: "/kullanim-kosullari" },
  { label: "Çerez Politikası", href: "/cerez-politikasi" },
];

export function Kapanis() {
  return (
    <section className="kapanis" aria-labelledby="kapanisBas">
      <div className="aurora" aria-hidden="true" />
      <div className="kap kapanis-ic">
        <h2 id="kapanisBas" className="belir">
          Bütün mülkleriniz, <span className="vurgu">tek bakışta.</span>
        </h2>
        <p className="belir" style={gecikme(".1s")}>
          Tüm planlar 45 gün ücretsiz deneme ile gelir — kredi kartı gerekmez.
        </p>
        <div className="cta-satir belir" style={gecikme(".2s")}>
          <a href="/register" className="dugme ana">
            45 Gün Ücretsiz Deneyin <Ok />
          </a>
          <a href="/login" className="dugme hayalet">
            Giriş Yap
          </a>
        </div>
      </div>
    </section>
  );
}

export function AltBilgi() {
  return (
    <footer>
      <div className="kap">
        <div className="alt-izgara">
          <div>
            <Image src="/anasayfa/logo-koyu.webp" alt="Mizan Mülk Yönetimi" width={161} height={44} />
            <p className="acik">Mülk, kiracı ve tahsilat takibini tek panelden yönetin.</p>
          </div>
          <div>
            <h4>Ürün</h4>
            <ul>
              <li>
                <a href="#neler-yapiyoruz">Neler Yapıyoruz?</a>
              </li>
              <li>
                <a href="#paketler">Paketlerimiz</a>
              </li>
              <li>
                <a href="#sss">S.S.S.</a>
              </li>
              <li>
                <a href="#referanslar">Referanslarımız</a>
              </li>
              <li>
                <Link href="/blog">Blog</Link>
              </li>
            </ul>
          </div>
          <div>
            <h4>Hesap</h4>
            <ul>
              <li>
                <a href="/register">Kayıt Ol</a>
              </li>
              <li>
                <a href="/login">Giriş Yap</a>
              </li>
            </ul>
          </div>
          <div>
            <h4>Yasal</h4>
            <ul>
              {YASAL.map((l) => (
                <li key={l.href}>
                  <a href={l.href}>{l.label}</a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4>İletişim</h4>
            <ul>
              <li>
                <a href="tel:+905307382996">+90 530 738 29 96</a>
              </li>
              <li>
                <a href="mailto:bilgi@mizanmulkyonetimi.com">bilgi@mizanmulkyonetimi.com</a>
              </li>
              <li>Akabe Mah. Şehit Furkan Doğan Cad. B Blok Adalet Plaza No:11/206 Karatay/KONYA</li>
            </ul>
          </div>
        </div>
        <div className="telif">
          <span>© {new Date().getFullYear()} Mizan Mülk Yönetimi. Tüm hakları saklıdır.</span>
          <span>mizanmulkyonetimi.com</span>
        </div>
      </div>
    </footer>
  );
}
