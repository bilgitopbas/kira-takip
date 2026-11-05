import { gecikme } from "./SvgTanimlari";
import { tohumluRastgele } from "@/lib/anasayfaGrafik";

const KIRACILAR = [
  { harf: "DA", renk: { background: "#DCEBFF", color: "#1F55B8" }, ad: "Deniz Aydın", mulk: "Ataşehir Daire", durum: "Ödendi", sinif: "d-odendi", tutar: "24.000 ₺" },
  { harf: "BŞ", renk: { background: "#FDF0D5", color: "#8A5A00" }, ad: "Burak Şahin", mulk: "Maslak Ofis", durum: "2 gün geç", sinif: "d-gec", tutar: "41.500 ₺", canli: true },
  { harf: "CY", renk: { background: "#F0E6FF", color: "#6A3DB8" }, ad: "Cemre Yıldız", mulk: "Nişantaşı Daire", durum: "Yarın", sinif: "d-yarin", tutar: "29.000 ₺" },
];

const MULKLER = [
  { no: "101", ad: "Ataşehir Daire", yer: "İstanbul · 3+1", durum: "Kirada" },
  { no: "102", ad: "Maslak Ofis", yer: "İstanbul · 120m²", durum: "Kirada" },
  { no: "103", ad: "Nişantaşı Daire", yer: "İstanbul · 2+1", durum: "Boş" },
];

const CUBUKLAR = [42, 55, 48, 63, 58, 72, 68, 80, 95];
const AYLAR = ["Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas"];

// Küçük izometrik Mülk Şehrim: tohumlu rastgele ile sunucuda ve istemcide aynı çizilir.
function MiniSehir() {
  const rnd = tohumluRastgele(11);
  const RENK = ["#52E0C8", "#52E0C8", "#52E0C8", "#F6C56B", "#F58FB0", "#2a3f6e"];
  const iso = (x: number, y: number, z: number) => [140 + (x - y) * 15, 60 + (x + y) * 8.5 - z];
  const p = (x: number, y: number, z: number) => iso(x, y, z).map((n) => n.toFixed(1)).join(",");
  const parcalar: React.ReactNode[] = [];
  const kutu = (x: number, y: number, w: number, d: number, h: number, ust = "#2b4a85") => {
    const k = parcalar.length;
    parcalar.push(<polygon key={`${k}a`} points={`${p(x, y, 0)} ${p(x + w, y, 0)} ${p(x + w, y, h)} ${p(x, y, h)}`} fill="#1d3567" />);
    parcalar.push(<polygon key={`${k}b`} points={`${p(x + w, y, 0)} ${p(x + w, y + d, 0)} ${p(x + w, y + d, h)} ${p(x + w, y, h)}`} fill="#14295a" />);
    parcalar.push(<polygon key={`${k}c`} points={`${p(x, y, h)} ${p(x + w, y, h)} ${p(x + w, y + d, h)} ${p(x, y + d, h)}`} fill={ust} />);
    for (let kat = 6; kat < h - 3; kat += 7)
      for (let i = 0.25; i < w; i += 0.55) {
        const [a, b] = iso(x + i, y, kat);
        parcalar.push(
          <rect
            key={`${k}-${kat}-${i}`}
            className="pencere"
            style={{ animationDelay: `${(-rnd() * 4).toFixed(2)}s` }}
            x={(a - 2.6).toFixed(1)}
            y={(b - 5).toFixed(1)}
            width="4.4"
            height="3.6"
            rx=".8"
            fill={RENK[Math.floor(rnd() * RENK.length)]}
          />,
        );
      }
  };
  kutu(3, 0, 1.4, 1.4, 30);
  kutu(0, 0, 1.6, 1.6, 62, "#3b5f9c");
  kutu(0, 3, 1.8, 1.4, 24);
  kutu(3, 3, 1.6, 1.6, 44);
  kutu(1.6, 1.7, 1, 1, 14, "#F5B8CF");
  return (
    <svg viewBox="0 0 280 150" aria-hidden="true">
      <polygon points={`${p(-1, -1, 0)} ${p(5, -1, 0)} ${p(5, 5, 0)} ${p(-1, 5, 0)}`} fill="#0f2147" stroke="#264173" strokeWidth=".6" />
      {parcalar}
    </svg>
  );
}

export default function NelerYapiyoruz() {
  return (
    <section className="neler bolum" id="neler-yapiyoruz">
      <div className="kap">
        <div className="orta">
          <span className="cip belir">Neler Yapıyoruz?</span>
          <h2 className="bas belir" style={gecikme(".08s")}>
            Karmaşık tablolara değil, <span className="vurgu">tek panele</span> ihtiyacınız var.
          </h2>
          <p className="alt belir" style={gecikme(".16s")}>
            Kiracı takibinden tahsilata, mülk yönetiminden raporlamaya — Mizan Mülk Yönetimi tüm süreçlerinizi tek ekranda birleştirir, size sadece
            kontrol etmek kalır.
          </p>
        </div>

        <div className="bento">
          <article className="kart k-genis k-kiraci belir">
            <div className="kart-ust">
              <div className="ikon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
                </svg>
              </div>
              <span className="etk">En Çok Kullanılan</span>
            </div>
            <h3>
              Profesyonel <span className="vurgu">kiracı takibi</span>
            </h3>
            <p>Tüm kiracıların — ödemeler, sözleşmeler, bakiyeler tek ekranda. Kim ödedi, kim geçti, anında gör.</p>
            <div className="satirlar">
              {KIRACILAR.map((k) => (
                <div className="satir" key={k.ad}>
                  <div className="kisi">
                    <span className="bas-harf" style={k.renk}>
                      {k.harf}
                    </span>
                    <div>
                      <b>{k.ad}</b>
                      <small>{k.mulk}</small>
                    </div>
                  </div>
                  <div className="sag-grup">
                    <span className={`durum ${k.sinif}`} data-canli-durum={k.canli ? "" : undefined}>
                      {k.durum}
                    </span>
                    <span className="tutar">{k.tutar}</span>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="kart k-uzun belir" style={gecikme(".1s")}>
            <div className="ikon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
                <path d="M9 21V12h6v9" />
              </svg>
            </div>
            <h3>Kapsamlı mülk yönetimi</h3>
            <p>Her mülk için sözleşme, doluluk durumu, kiracı bilgisi — hepsi tek yerde, güvende.</p>
            <div className="mulk-liste">
              {MULKLER.map((m) => (
                <div className="mulk" key={m.no}>
                  <div>
                    <span className="no">{m.no}</span>
                    <span>
                      <b>{m.ad}</b>
                      <small>{m.yer}</small>
                    </span>
                  </div>
                  <span className={`durum ${m.durum === "Kirada" ? "d-odendi" : "d-bos"}`}>{m.durum}</span>
                </div>
              ))}
            </div>
            <div className="mini-sehir">
              <div className="bsl">
                Mülk Şehrim <span>3D</span>
              </div>
              <MiniSehir />
            </div>
          </article>

          <article className="kart belir" style={gecikme(".15s")}>
            <div className="ikon" style={{ background: "rgba(245,184,207,.22)", color: "var(--pembe-700)" }}>
              <span style={{ fontWeight: 800, fontSize: 19 }}>₺</span>
            </div>
            <h3>Finansal raporlama</h3>
            <p>Aylık ve yıllık gelir raporları, tahsilat oranı — tek tıkla Excel&apos;e aktarın.</p>
            <div className="cubuklar" aria-hidden="true">
              {CUBUKLAR.map((h, i) => (
                <span
                  key={i}
                  data-nefes={h}
                  className={i === CUBUKLAR.length - 1 ? "p" : undefined}
                  style={{ height: `${h}%`, transitionDelay: `${i * 0.05}s` }}
                />
              ))}
            </div>
            <div className="ay-sira" aria-hidden="true">
              {AYLAR.map((a) => (
                <span key={a}>{a}</span>
              ))}
            </div>
          </article>

          <article className="kart belir" style={gecikme(".2s")}>
            <div className="ikon" style={{ background: "#E3EDFF", color: "#1F55B8" }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M17.5 19H9a5 5 0 110-10 6.5 6.5 0 0112.6 2.1A4.5 4.5 0 0117.5 19z" />
              </svg>
            </div>
            <h3>Bulut tabanlı erişim</h3>
            <p>Bilgisayar, tablet, telefon — her yerden erişin, veriniz güvende.</p>
            <div className="cihazlar-ikon" aria-hidden="true">
              <div className="c" style={{ width: "46%", height: "78%" }} />
              <div className="c" style={{ width: "30%", height: "62%" }} />
              <div className="c" style={{ width: "14%", height: "48%", borderRadius: 6 }} />
              <div className="bulut-senk">
                <i />
                <i />
                <i />
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
