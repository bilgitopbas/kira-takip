import { gecikme } from "./SvgTanimlari";
import { trSayi } from "@/lib/anasayfaGrafik";
import CanliGrafik from "./CanliGrafik";

const SAYILAR = [
  {
    deger: 95,
    on: "%",
    son: "",
    baslik: "Kira Geliri Artışı",
    metin: "Mevcut sözleşmeler ve piyasa koşulları dikkate alınarak kira gelirlerinin etkin ve sürdürülebilir şekilde artırılması hedeflenir.",
    yol: "M2 40 C30 38 40 30 60 30 S90 22 110 20 140 12 160 10 190 4 198 3",
    sure: "5s",
  },
  {
    deger: 5000,
    on: "",
    son: "+",
    baslik: "Taşınmaz",
    metin: "Farklı nitelik ve ölçekteki taşınmazlar, tek bir sistem üzerinden düzenli ve kontrollü biçimde yönetilmektedir.",
    yol: "M2 42 L30 38 L50 39 L75 30 L100 31 L120 22 L145 20 L170 10 L198 4",
    sure: "5.6s",
  },
  {
    deger: 99,
    on: "%",
    son: "",
    baslik: "Memnuniyet",
    metin: "Şeffaf süreç yönetimi, düzenli takip ve güvene dayalı hizmet anlayışıyla yüksek memnuniyet sağlanmaktadır.",
    yol: "M2 30 C40 30 50 14 80 12 S130 8 160 6 190 4 198 4",
    sure: "6s",
  },
  {
    deger: 96,
    on: "%",
    son: "",
    baslik: "Düzenli Ödeme Takibi",
    metin: "Kira ödemeleri anlık bildirimlerle kontrol altında tutulur.",
    yol: "M2 36 L25 28 L45 32 L70 20 L95 24 L120 14 L150 16 L175 8 L198 6",
    sure: "5.2s",
  },
];

// Sayılar sunucuda son değerleriyle yazılır; ekrana girince sıfırdan yükselerek sayar.
export default function Rakamlar() {
  return (
    <section className="rakamlar bolum" aria-labelledby="rakamBas">
      <div className="aurora" aria-hidden="true" />
      <div className="izgara-desen" aria-hidden="true" />
      <div className="kap" style={{ position: "relative" }}>
        <div className="orta">
          <span className="cip belir">Rakamlarla Mizan</span>
          <h2 className="bas belir" id="rakamBas" style={gecikme(".08s")}>
            Dijital mülk yönetiminde <span className="vurgu">ölçülebilir sonuçlar</span>
          </h2>
          <p className="alt belir" style={gecikme(".16s")}>
            Dijital mülk yönetiminde ölçülebilir sonuçlar ve net veriler.
          </p>
        </div>
        <div className="sayaclar">
          {SAYILAR.map((s, i) => (
            <div className="sayac belir" key={s.baslik} style={gecikme(`${i / 10}s`)}>
              <div className="deger">
                {s.on}
                <span data-say={s.deger} data-son={s.son}>
                  {trSayi(s.deger)}
                  {s.son}
                </span>
              </div>
              <h3>{s.baslik}</h3>
              <p>{s.metin}</p>
              <svg className="kivilcim" viewBox="0 0 200 44" preserveAspectRatio="none" aria-hidden="true">
                <path id={`kv${i}`} className="cizim" d={s.yol} pathLength={1} />
                <circle r="3.4">
                  <animateMotion dur={s.sure} repeatCount="indefinite">
                    <mpath href={`#kv${i}`} />
                  </animateMotion>
                </circle>
              </svg>
            </div>
          ))}
        </div>
        <CanliGrafik />
      </div>
    </section>
  );
}
