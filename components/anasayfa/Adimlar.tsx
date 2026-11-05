"use client";

import { useEffect, useRef, useState } from "react";
import { gecikme } from "./SvgTanimlari";
import { dongudeCalis } from "./hareket";

// Online ödeme linki, iyzico ve otomatik SMS henüz çalışmadığı için anlatılmıyor.
const ADIMLAR = [
  {
    no: "01",
    baslik: "Mülkünü Ekle",
    metin: "Daire, dükkan ya da taşınmazınızı sisteme kaydedin. Adres, kat, metrekare ve kullanım türünü tek seferinde tanımlayın. Farklı şehirlerdeki portföyünüzü tek panelden görün.",
    etiketler: ["Adres bilgisi", "Mülk türü", "Portföy görünümü"],
  },
  {
    no: "02",
    baslik: "Kiracını Gir",
    metin: "Kiracı bilgilerini ve iletişim detaylarını ekleyin. Hangi mülkte oturduğunu belirleyin. Birden fazla kiracıyı aynı anda takip edin.",
    etiketler: ["İletişim bilgileri", "Mülk ataması", "Çoklu kiracı"],
  },
  {
    no: "03",
    baslik: "Sözleşmeni Hazırla",
    metin: "Kira sözleşmenizi dijital ortamda saklayın. Başlangıç ve bitiş tarihlerini girin; sistem yenileme tarihini önceden hatırlatır.",
    etiketler: ["Sözleşme tarihleri", "Dijital arşiv", "Otomatik hatırlatma"],
  },
  {
    no: "04",
    baslik: "Ödeme Planını Ayarla",
    metin: "Aylık kira bedelini ve ödeme gününü tanımlayın. 12 aylık plan otomatik oluşur. Gelen ödemeyi kaydedin; kalan borç anında güncellenir.",
    etiketler: ["Aylık plan", "Tahsilat kaydı", "Kalan borç takibi"],
  },
  {
    no: "05",
    baslik: "Gelirleri Kontrol Et",
    metin: "Ödendi, gecikti, bekleniyor — tek bakışta görün. Aylık ve yıllık gelir raporlarına anında ulaşın. Gecikmeleri bildirimlerle kaçırmayın.",
    etiketler: ["Gelir raporu", "Gecikme takibi", "Bildirimler"],
  },
];
const SURE = 5200;

export default function Adimlar() {
  const [secili, setSecili] = useState(0);
  const [degisiyor, setDegisiyor] = useState(false);
  const [gosterilen, setGosterilen] = useState(0);
  const ilerlemeRef = useRef<(HTMLSpanElement | null)[]>([]);
  const ustundeRef = useRef(false);
  const birikimRef = useRef(0);

  // Seçim değişince içerik kısa bir solmayla yenilenir.
  const sec = (i: number) => {
    setSecili(i);
    setDegisiyor(true);
    window.setTimeout(() => {
      setGosterilen(i);
      setDegisiyor(false);
    }, 220);
    birikimRef.current = 0;
    ilerlemeRef.current.forEach((el) => el && (el.style.width = "0"));
  };

  // Kendiliğinden ilerleme: fare üstündeyken ya da hareket durunca bekler.
  useEffect(() => {
    let id = 0;
    let son = performance.now();
    const dongu = (t: number) => {
      const dt = t - son;
      son = t;
      if (dongudeCalis() && !ustundeRef.current) {
        birikimRef.current += dt;
        const p = birikimRef.current / SURE;
        const el = ilerlemeRef.current[secili];
        if (el) el.style.width = `${Math.min(100, p * 100)}%`;
        if (p >= 1) sec((secili + 1) % ADIMLAR.length);
      }
      id = requestAnimationFrame(dongu);
    };
    id = requestAnimationFrame(dongu);
    return () => cancelAnimationFrame(id);
  }, [secili]);

  const a = ADIMLAR[gosterilen];

  return (
    <section className="nasil bolum" aria-labelledby="nasilBas">
      <div className="kap">
        <div className="orta">
          <span className="cip belir">Nasıl Kullanılır?</span>
          <h2 className="bas belir" id="nasilBas" style={gecikme(".08s")}>
            Beş adımda <span className="vurgu">kontrol sizde</span>
          </h2>
        </div>
        <div
          className="adimlar"
          onPointerEnter={() => (ustundeRef.current = true)}
          onPointerLeave={() => (ustundeRef.current = false)}
        >
          <div className="adim-liste" role="tablist" aria-label="Adımlar">
            {ADIMLAR.map((s, i) => (
              <button
                key={s.no}
                type="button"
                role="tab"
                id={`adim${i}`}
                aria-controls="adimPanel"
                aria-selected={i === secili}
                tabIndex={i === secili ? 0 : -1}
                className="adim-dugme belir"
                style={gecikme(`${i * 0.06}s`)}
                onClick={() => sec(i)}
                onKeyDown={(e) => {
                  if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
                  e.preventDefault();
                  const n = (secili + (e.key === "ArrowDown" ? 1 : -1) + ADIMLAR.length) % ADIMLAR.length;
                  sec(n);
                  document.getElementById(`adim${n}`)?.focus();
                }}
              >
                <span className="n">{s.no}</span>
                <b>{s.baslik}</b>
                <span
                  className="ilerleme"
                  ref={(el) => {
                    ilerlemeRef.current[i] = el;
                  }}
                />
              </button>
            ))}
          </div>
          <div className="adim-panel belir" role="tabpanel" id="adimPanel" aria-labelledby={`adim${secili}`}>
            <div className={`adim-icerik${degisiyor ? " degis" : ""}`}>
              <div className="buyuk-n">{a.no}</div>
              <h3>{a.baslik}</h3>
              <p>{a.metin}</p>
              <div className="etiketler-sat">
                {a.etiketler.map((t) => (
                  <span key={t}>{t}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
