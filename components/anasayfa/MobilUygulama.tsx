import Image from "next/image";
import { gecikme } from "./SvgTanimlari";

function DurumCubugu() {
  return (
    <div className="durum-cubugu">
      <span>9:41</span>
      <svg viewBox="0 0 64 14" fill="#fff" aria-hidden="true">
        <rect x="0" y="9" width="3" height="5" rx="1" />
        <rect x="5" y="6" width="3" height="8" rx="1" />
        <rect x="10" y="3" width="3" height="11" rx="1" />
        <rect x="15" y="0" width="3" height="14" rx="1" />
        <path d="M30 4.5a9 9 0 0112 0l-1.6 1.7a6.6 6.6 0 00-8.8 0zm2.7 2.9a5 5 0 016.6 0L36 11z" />
        <rect x="46" y="1.5" width="15" height="11" rx="3" fill="none" stroke="#fff" strokeOpacity=".5" />
        <rect x="47.8" y="3.3" width="10" height="7.4" rx="1.6" />
        <rect x="62" y="5" width="1.6" height="4" rx=".8" fillOpacity=".5" />
      </svg>
    </div>
  );
}

// iPhone 16 çerçevesi: Dynamic Island, durum çubuğu, ana ekran çizgisi.
function Iphone({ sinif, src, alt }: { sinif: string; src: string; alt: string }) {
  return (
    <div className={`iphone ${sinif}`}>
      <div className="yuz">
        <div className="ekran">
          <div className="ada" />
          <DurumCubugu />
          <Image src={src} alt={alt} width={200} height={433} sizes="200px" />
          <div className="ev-cizgisi" />
        </div>
      </div>
    </div>
  );
}

export default function MobilUygulama() {
  return (
    <section className="mobil bolum" aria-labelledby="mobilBas">
      <div className="kap mobil-ic">
        <div>
          <span className="cip belir">Mobil Uygulama</span>
          <h2 className="bas belir" id="mobilBas" style={gecikme(".08s")}>
            Mülkleriniz artık <span className="vurgu">cebinizde.</span>
          </h2>
          <p className="alt belir" style={gecikme(".16s")}>
            Nerede olursanız olun, kontrol sizde. Ofisten çıkın, tahsilatı görün, bildirimi anında alın — Mizan Mülk Yönetimi artık cebinizde.
          </p>
          {/* Mağaza rozetleri: her iki mağazanın resmi Türkçe rozet düzeni ve siyah zemin */}
          <div className="magaza belir" style={gecikme(".24s")}>
            <a
              href="https://apps.apple.com/tr/app/mizan-m%C3%BClk-y%C3%B6netimi/id6759964652"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Mizan Mülk Yönetimi'ni App Store'dan indirin"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M16.365 1.43c0 1.14-.493 2.27-1.177 3.08-.744.9-1.99 1.57-2.987 1.57-.12 0-.23-.02-.3-.03-.01-.06-.04-.22-.04-.39 0-1.15.572-2.27 1.206-2.98.804-.94 2.142-1.64 3.248-1.68.03.13.05.28.05.43zm4.565 15.71c-.03.07-.463 1.58-1.518 3.12-.94 1.36-1.94 2.71-3.43 2.71-1.517 0-1.9-.88-3.63-.88-1.698 0-2.302.91-3.67.91-1.377 0-2.35-1.26-3.428-2.8-1.287-1.87-2.312-4.78-2.312-7.55 0-4.44 2.892-6.79 5.75-6.79 1.47 0 2.688.95 3.616.95.87 0 2.213-1.01 3.858-1.01.62 0 2.86.06 4.335 2.18-.117.08-2.586 1.52-2.586 4.63 0 3.72 3.288 5.03 3.325 5.05z" />
              </svg>
              <span>
                <span className="s2" style={{ margin: 0 }}>
                  App Store&apos;dan
                </span>
                <span className="s1" style={{ marginTop: 3 }}>
                  İndirin
                </span>
              </span>
            </a>
            {/* Google Play logosunun renkleri marka kuralları gereği değiştirilemez */}
            <a
              href="https://play.google.com/store/apps/details?id=com.mizanmulkyonetimi.app&hl=tr"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Mizan Mülk Yönetimi'ni Google Play'den indirin"
            >
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M5 3.5c-.4.3-.6.8-.6 1.4v14.2c0 .6.2 1.1.6 1.4l.1.06L13.5 12l-8.4-8.56L5 3.5z" fill="#00A0FF" />
                <path d="M13.5 12l3.2 3.2 5.1-2.9c.7-.4.7-1.4 0-1.8l-5.1-2.9L13.5 12z" fill="#FFC900" />
                <path d="M5.1 20.94c.34.24.83.26 1.36-.05l10.24-5.8L13.5 12l-8.4 8.94z" fill="#FF3A44" />
                <path d="M16.7 8.9L6.46 3.1c-.53-.3-1.02-.28-1.36-.05L13.5 12l3.2-3.1z" fill="#00E676" />
              </svg>
              <span>
                <span className="s1" style={{ textTransform: "uppercase", letterSpacing: ".12em" }}>
                  İndirin
                </span>
                <span className="s2">Google Play</span>
              </span>
            </a>
          </div>
          <ul className="ozellik-satir belir" style={gecikme(".32s")}>
            <li>
              <span className="ikon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 01-3.4 0" />
                </svg>
              </span>
              <span>
                <b>Anlık bildirim</b> — gecikme, vade ve sözleşme yenilemeleri.
              </span>
            </li>
            <li>
              <span className="ikon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M3 21h18M5 21V8l7-5 7 5v13M9 21v-6h6v6" />
                </svg>
              </span>
              <span>
                <b>Mülk Şehrim</b> — binalarınız telefonda da 3D.
              </span>
            </li>
          </ul>
        </div>

        <div className="sahne-cihaz belir" style={gecikme(".15s")} data-egim aria-label="iPad Pro ve iPhone 16 üzerinde Mizan uygulaması">
          <div className="yuzen y1" aria-hidden="true">
            <small>Bu ay tahsilat</small>
            <b>1,4 Mn ₺</b>
            <svg viewBox="0 0 120 30">
              <path
                className="cizim"
                pathLength={1}
                d="M2 26 C14 24 20 18 32 19 S52 12 64 13 84 6 96 8 112 3 118 2"
                fill="none"
                stroke="#1FC2B0"
                strokeWidth="2.4"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div className="yuzen y2" aria-hidden="true">
            <span className="rozet-p">
              <i />3 yeni bildirim
            </span>
            <small style={{ display: "block" }}>Sözleşme yenileme · 14 gün</small>
          </div>
          <div className="cihaz-grup">
            {/* iPad Pro 13″: ince eşit çerçeve, yatay, ön kamera uzun kenarda */}
            <div className="ipad">
              <div className="ekran">
                <Image src="/anasayfa/ipad.webp" alt="Mizan Mülk Yönetimi iPad görünümü" width={600} height={450} sizes="(max-width: 640px) 88vw, 600px" />
              </div>
            </div>
            <Iphone sinif="tel-1" src="/anasayfa/tel-ozet.webp" alt="Mizan uygulaması Özet ekranı" />
            <Iphone sinif="tel-2" src="/anasayfa/tel-mulkler.webp" alt="Mizan uygulaması Mülkler ekranı" />
          </div>
          <div className="cihaz-not">iPad Pro 13″ · iPhone 16 — örnek verilerle</div>
        </div>
      </div>
    </section>
  );
}
