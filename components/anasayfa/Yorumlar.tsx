"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Ok, gecikme } from "./SvgTanimlari";
import { dongudeCalis } from "./hareket";

const YORUMLAR = [
  {
    ad: "Mevlüt Topbaş",
    unvan: "Opt. Dr. — Genel Cerrahi Uzmanı",
    foto: "/photo-topbas.jpg",
    metin: "Mizan Profesyonel Mülk Yönetimi benim için ciddi bir kolaylık sağladı. Gayrimenkullerle ilgili süreçleri düzenli, şeffaf ve sistemli şekilde takip edebiliyorum.",
  },
  {
    ad: "AHMED AL-NASERI",
    unvan: "Mülk Sahibi",
    foto: "/photo-ahmed.jpg",
    fotoKonum: "50% 12%",
    metin: "İşimiz gereği sürekli seyahat ediyorum. Eskiden kira takibi, ödemeler ve sözleşmeler ciddi zaman alıyordu. Mizan Mülk Yönetimi ile tüm mülklerimi tek bir uygulama üzerinden takip edebiliyorum.",
  },
  {
    ad: "Hasan Çıbık",
    unvan: "Mülk Sahibi",
    harf: "HÇ",
    metin: "Eski usul yöntemlerle sözleşme tarihi takip etmek, kim ödedi, kim gecikti diye Excel tutmak çok karışıktı. Mizan Mülk Yönetimi uygulaması ile fiziki evraklara rahatlıkla erişebiliyor finans raporları ile mülkümün değerini analiz edebiliyorum.",
  },
];
const SURE = 6500;

// Dönen müşteri yorumları: fare/odak üstündeyken ya da hareket durunca bekler; kaydırma ile geçilir.
export default function Yorumlar() {
  const [aktif, setAktif] = useState(0);
  const [onceki, setOnceki] = useState<number | null>(null);
  const ilerlemeRef = useRef<(HTMLElement | null)[]>([]);
  const birikimRef = useRef(0);
  const durRef = useRef(false);
  const kaydirRef = useRef<number | null>(null);

  const git = (k: number) => {
    const yeni = (k + YORUMLAR.length) % YORUMLAR.length;
    setOnceki(aktif);
    setAktif(yeni);
    birikimRef.current = 0;
    ilerlemeRef.current.forEach((el, j) => el && (el.style.width = j < yeni ? "100%" : "0"));
    window.setTimeout(() => setOnceki(null), 700);
  };

  useEffect(() => {
    let id = 0;
    let son = performance.now();
    const dongu = (t: number) => {
      const dt = t - son;
      son = t;
      if (dongudeCalis() && !durRef.current) {
        birikimRef.current += dt;
        const p = birikimRef.current / SURE;
        const el = ilerlemeRef.current[aktif];
        if (el) el.style.width = `${Math.min(100, p * 100)}%`;
        if (p >= 1) git(aktif + 1);
      }
      id = requestAnimationFrame(dongu);
    };
    id = requestAnimationFrame(dongu);
    return () => cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- git her çizimde yeni; döngü yalnız etkin yorum değişince kurulur
  }, [aktif]);

  return (
    <section className="referans bolum" id="referanslar" aria-labelledby="refBas">
      <div className="kap">
        <div className="orta">
          <span className="cip belir">Referanslarımız</span>
          <h2 className="bas belir" id="refBas" style={gecikme(".08s")}>
            Müşterilerimiz <span className="vurgu">Mizan Mülk Yönetimini</span> anlatıyor
          </h2>
        </div>
        <div
          className="yorum-sahne belir"
          aria-roledescription="carousel"
          aria-label="Müşteri yorumları"
          onPointerEnter={() => (durRef.current = true)}
          onPointerLeave={() => (durRef.current = false)}
          onFocus={() => (durRef.current = true)}
          onBlur={() => (durRef.current = false)}
          onPointerDown={(e) => (kaydirRef.current = e.clientX)}
          onPointerUp={(e) => {
            const x = kaydirRef.current;
            kaydirRef.current = null;
            if (x !== null && Math.abs(e.clientX - x) > 50) git(aktif + (e.clientX < x ? 1 : -1));
          }}
        >
          <div className="yorum-cerceve">
            {YORUMLAR.map((y, i) => (
              <figure
                key={y.ad}
                className={`yorum${i === aktif ? " aktif" : ""}${i === onceki ? " cikis" : ""}`}
                aria-roledescription="slide"
                aria-label={`${i + 1} / ${YORUMLAR.length}`}
                aria-hidden={i !== aktif}
              >
                <div className="foto">
                  {y.foto ? (
                    <Image src={y.foto} alt={y.ad} width={300} height={375} sizes="(max-width: 860px) 150px, 300px" style={y.fotoKonum ? { objectPosition: y.fotoKonum } : undefined} />
                  ) : (
                    <div className="harf">{y.harf}</div>
                  )}
                </div>
                <div>
                  <div className="yildiz" role="img" aria-label="5 üzerinden 5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <svg key={s} aria-hidden="true">
                        <use href="#yildizS" />
                      </svg>
                    ))}
                  </div>
                  <blockquote>“{y.metin}”</blockquote>
                  <figcaption>
                    <cite>
                      <b>{y.ad}</b>
                      <span>{y.unvan}</span>
                    </cite>
                  </figcaption>
                </div>
              </figure>
            ))}
          </div>
          <div className="yorum-kontrol">
            <div className="noktalar">
              {YORUMLAR.map((y, i) => (
                <button key={y.ad} type="button" aria-label={`${i + 1}. yorum`} aria-current={i === aktif} onClick={() => git(i)}>
                  <i
                    ref={(el) => {
                      ilerlemeRef.current[i] = el;
                    }}
                  />
                </button>
              ))}
            </div>
            <div className="oklar">
              <button type="button" aria-label="Önceki yorum" onClick={() => git(aktif - 1)}>
                <Ok ters />
              </button>
              <button type="button" aria-label="Sonraki yorum" onClick={() => git(aktif + 1)}>
                <Ok />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
