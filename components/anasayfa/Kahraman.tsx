"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Ok, Tik, gecikme } from "./SvgTanimlari";
import { azHareketMi, dongudeCalis, hareketDurdu, hareketiAyarla, HAREKET_OLAYI } from "./hareket";
import { egriYolu, etiketKonumu, kapakEsle, kesisir, olcekle, trSayi, yavaslayan, type Kutu } from "@/lib/anasayfaGrafik";
import izler from "./sehirEtiketleri.json";

// Giriş: 3D Mülk Şehri videosu (onaylanan sahneden kaydedilmiş 12 sn'lik döngü),
// üstünde bina etiketleri ve canlı örnek kartlar. Tüm veriler örnektir.

const ETIKET_RENGI: Record<string, string> = { odendi: "#52E0C8", bekliyor: "#F6C56B", gecikmis: "#F58FB0" };
const BILDIRIMLER = [
  ["Deneme Kafe · 43.500 ₺", "Mavi Kule B No:2 · tahsil edildi"],
  ["Örnek Mimarlık · 42.000 ₺", "Mavi Kule A No:1 · bugün vadesi"],
  ["Deneme Kırtasiye · sözleşme", "19.11.2026 · yenileme 14 gün kaldı"],
  ["Örnek Yazılım · 45.000 ₺", "Mavi Kule A No:3 · tahsil edildi"],
];
const ILK_VERI = [22, 30, 26, 38, 34, 46, 42, 55, 50, 63, 58, 72];
const GRAFIK = { g: 260, y: 84, min: 14, max: 80 };
// Kayıtların piksel boyutu ve kapta yerleşimi (CSS object-position ile aynı)
const VIDEO = { masaustu: { g: 1600, y: 900, x: 0.7 }, telefon: { g: 720, y: 880, x: 0.5 } };

function alanYollari(veri: number[]) {
  const n = olcekle(veri, GRAFIK.g, GRAFIK.y, GRAFIK.min, GRAFIK.max);
  const d = egriYolu(n);
  return { cizgi: d, alan: `${d} L${GRAFIK.g},${GRAFIK.y} L0,${GRAFIK.y}Z`, uc: n[n.length - 1] };
}

export default function Kahraman() {
  const kapRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const etiketRef = useRef<(HTMLDivElement | null)[]>([]);
  const grafikRef = useRef<SVGSVGElement>(null);
  const tahsilatRef = useRef<HTMLSpanElement>(null);
  const dolulukRef = useRef<HTMLSpanElement>(null);
  const [oynuyor, setOynuyor] = useState(false);
  const [durdu, setDurdu] = useState(false);
  const [bi, setBi] = useState(0);
  const [degisiyor, setDegisiyor] = useState(false);

  // Hareket anahtarı: "hareketi azalt" açıksa baştan durur.
  useEffect(() => {
    const dinle = (e: Event) => setDurdu((e as CustomEvent<{ durdu: boolean }>).detail.durdu);
    window.addEventListener(HAREKET_OLAYI, dinle);
    hareketiAyarla(azHareketMi());
    return () => window.removeEventListener(HAREKET_OLAYI, dinle);
  }, []);

  // Video: veri tasarrufu açıksa yalnız poster; ekran dışındayken bekler.
  useEffect(() => {
    const v = videoRef.current;
    const kap = kapRef.current;
    if (!v || !kap) return;
    const tasarruf = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData === true;
    let gorunur = true;
    const ayarla = () => {
      if (tasarruf || hareketDurdu() || !gorunur) v.pause();
      else {
        v.muted = true;
        v.play().catch(() => {});
      }
    };
    const io = new IntersectionObserver(([e]) => {
      gorunur = e.isIntersecting;
      ayarla();
    });
    io.observe(kap);
    window.addEventListener(HAREKET_OLAYI, ayarla);
    return () => {
      io.disconnect();
      window.removeEventListener(HAREKET_OLAYI, ayarla);
    };
  }, []);

  // Bina etiketleri: video zamanına göre kayıtlı izden konum; kart ve metinle çakışan gizlenir.
  useEffect(() => {
    const kap = kapRef.current;
    const v = videoRef.current;
    if (!kap || !v) return;
    let engeller: Kutu[] = [];
    let kare = 0;
    let id = 0;
    const engelOlc = () => {
      const h = kap.getBoundingClientRect();
      const kahraman = kap.parentElement!;
      engeller = [...kahraman.querySelectorAll(".cam-kart, .kahraman-ic > div:first-child > *")].map((e) => {
        const r = e.getBoundingClientRect();
        return { l: r.left - h.left - 8, t: r.top - h.top - 8, r: r.right - h.left + 8, b: r.bottom - h.top + 8 };
      });
    };
    const guncelle = () => {
      const masaustu = window.innerWidth > 1060;
      const iz = masaustu ? izler.masaustu : izler.telefon;
      const vb = masaustu ? VIDEO.masaustu : VIDEO.telefon;
      const W = kap.clientWidth;
      const H = kap.clientHeight;
      const esle = kapakEsle({ g: v.videoWidth || vb.g, y: v.videoHeight || vb.y }, { g: W, y: H }, vb.x, 0.5);
      const zaman = v.readyState >= 2 ? v.currentTime : 0;
      if (kare++ % 30 === 0) engelOlc();
      const alinan: Kutu[] = [];
      izler.bilgi.forEach((b, i) => {
        const el = etiketRef.current[i];
        if (!el) return;
        const n = etiketKonumu(iz.kareler as ([number, number] | null)[][], iz.fps, zaman, i);
        let ok = !!n;
        let x = 0;
        let y = 0;
        if (n) {
          [x, y] = esle(n[0], n[1]);
          const gw = el.offsetWidth || 120;
          const gh = el.offsetHeight || 26;
          const kutu = { l: x - gw / 2, r: x + gw / 2, t: y - gh * 1.2, b: y - gh * 0.2 };
          ok = kutu.l > 8 && kutu.r < W - 8 && kutu.t > (masaustu ? 76 : 110) && kutu.b < H - 40 && !(W < 420 && b.birim < 6);
          if (ok && masaustu) ok = x > W * 0.48;
          if (ok) ok = !engeller.some((g) => kesisir(kutu, g)) && !alinan.some((g) => kesisir(kutu, g));
          if (ok) alinan.push(kutu);
        }
        el.style.opacity = ok ? "1" : "0";
        if (n) el.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0) translate(-50%,-120%)`;
      });
    };
    const dongu = () => {
      if (dongudeCalis()) guncelle();
      id = requestAnimationFrame(dongu);
    };
    guncelle();
    id = requestAnimationFrame(dongu);
    const yenidenOlc = () => {
      engelOlc();
      guncelle();
    };
    window.addEventListener("resize", yenidenOlc);
    window.addEventListener(HAREKET_OLAYI, yenidenOlc);
    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener("resize", yenidenOlc);
      window.removeEventListener(HAREKET_OLAYI, yenidenOlc);
    };
  }, []);

  // Kartlar: sayaçlar, kayan tahsilat eğrisi, dönen bildirim
  useEffect(() => {
    const az = azHareketMi();
    const say = (el: HTMLSpanElement | null, hedef: number, ondalik: number) => {
      if (!el || az) return;
      const t0 = performance.now();
      const adim = (t: number) => {
        const p = Math.min(1, (t - t0) / 2000);
        el.textContent = trSayi(hedef * yavaslayan(p), ondalik);
        if (p < 1) requestAnimationFrame(adim);
      };
      requestAnimationFrame(adim);
    };
    const bekle = window.setTimeout(() => {
      say(tahsilatRef.current, 1.4, 1);
      say(dolulukRef.current, 89, 0);
    }, 600);

    let veri = ILK_VERI.slice();
    const svg = grafikRef.current;
    const kaydir = window.setInterval(() => {
      if (!svg || !dongudeCalis()) return;
      const eski = veri.slice();
      const son = eski[eski.length - 1];
      const yeni = eski.slice(1).concat([Math.max(30, Math.min(76, son + (Math.random() * 14 - 5)))]);
      const t0 = performance.now();
      const ara = (t: number) => {
        const p = Math.min(1, (t - t0) / 900);
        const e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
        const y = alanYollari(eski.map((v, i) => v + (yeni[i] - v) * e));
        svg.querySelector(".cizgi")?.setAttribute("d", y.cizgi);
        svg.querySelector(".alanp")?.setAttribute("d", y.alan);
        svg.querySelectorAll("circle").forEach((c) => {
          c.setAttribute("cx", String(y.uc[0]));
          c.setAttribute("cy", String(y.uc[1]));
        });
        if (p < 1) requestAnimationFrame(ara);
        else veri = yeni;
      };
      requestAnimationFrame(ara);
    }, 4200);

    const bildirim = window.setInterval(() => {
      if (!dongudeCalis()) return;
      setDegisiyor(true);
      window.setTimeout(() => {
        setBi((i) => (i + 1) % BILDIRIMLER.length);
        setDegisiyor(false);
      }, 350);
    }, 3800);

    return () => {
      window.clearTimeout(bekle);
      window.clearInterval(kaydir);
      window.clearInterval(bildirim);
    };
  }, []);

  const ilk = alanYollari(ILK_VERI);

  return (
    <section className="kahraman" id="kahraman" aria-labelledby="h1">
      <div className="sehir-kap" ref={kapRef}>
        <div className="poster" aria-hidden="true" />
        <video
          ref={videoRef}
          className={`sehir-video${oynuyor ? " oynuyor" : ""}`}
          muted
          loop
          playsInline
          preload="none"
          aria-hidden="true"
          onPlaying={() => setOynuyor(true)}
        >
          <source media="(max-width: 1060px)" src="/anasayfa/sehir-telefon.webm" type='video/webm; codecs="vp9"' />
          <source media="(max-width: 1060px)" src="/anasayfa/sehir-telefon.mp4" type="video/mp4" />
          <source src="/anasayfa/sehir-masaustu.webm" type='video/webm; codecs="vp9"' />
          <source src="/anasayfa/sehir-masaustu.mp4" type="video/mp4" />
        </video>
        <div className="perde" aria-hidden="true" />
        <div className="etiketler" aria-hidden="true">
          {izler.bilgi.map((b, i) => (
            <div
              key={b.ad}
              className="etiket"
              ref={(el) => {
                etiketRef.current[i] = el;
              }}
            >
              <i style={{ background: ETIKET_RENGI[b.durum], boxShadow: `0 0 0 3px ${ETIKET_RENGI[b.durum]}33` }} />
              <b>{b.ad}</b>
              <span>· {b.birim} birim</span>
            </div>
          ))}
        </div>
        <div className="ornek-not">Örnek görünüm · sahte veri</div>
        <button type="button" className="durdur" aria-pressed={durdu} onClick={() => hareketiAyarla(!durdu)}>
          <svg viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
            {durdu ? (
              <path d="M3 1.5v9l7.5-4.5z" />
            ) : (
              <>
                <rect x="2" y="1.5" width="2.6" height="9" rx="1" />
                <rect x="7.4" y="1.5" width="2.6" height="9" rx="1" />
              </>
            )}
          </svg>
          <span>{durdu ? "Hareketi başlat" : "Hareketi durdur"}</span>
        </button>
      </div>

      <div className="kap kahraman-ic">
        <div>
          <span className="cip koyu belir">
            <span className="nokta" />
            Kira Takip Yazılımı<span className="uzun"> · Kira Takibinde Yeni Dönem</span>
          </span>
          <h1 id="h1" className="belir" style={gecikme(".08s")}>
            Kira takibinde bütün mülkleriniz <span className="vurgu">tek bakışta.</span>
          </h1>
          <p className="giris-metni belir" style={gecikme(".16s")}>
            Mülklerinizi, kiracılarınızı ve tahsilatlarınızı tek ekrandan yönetin. Gecikmeleri asla kaçırmayın.
          </p>
          <ul className="tikler belir" style={gecikme(".24s")}>
            {["Kullanıcı Dostu Arayüz", "Bulut Tabanlı Erişim", "Güvenli Altyapı"].map((t) => (
              <li key={t}>
                <span>
                  <Tik />
                </span>
                {t}
              </li>
            ))}
          </ul>
          <div className="cta-satir belir" style={gecikme(".32s")}>
            <a href="/register" className="dugme ana">
              45 Gün Ücretsiz Deneyin <Ok />
            </a>
            <a href="#neler-yapiyoruz" className="dugme hayalet">
              Nasıl Çalışır?
            </a>
          </div>
          <div className="kucuk-not belir" style={gecikme(".4s")}>
            Kurulum yok · kredi kartı gerekmez
          </div>
        </div>

        <div className="kahraman-sag" aria-hidden="true">
          <div className="cam-kart k-tahsilat belir" style={gecikme(".5s")}>
            <div className="ust-yazi">Bu ay tahsilat</div>
            <div className="buyuk">
              <span>
                <span ref={tahsilatRef}>1,4</span> Mn ₺
              </span>
              <span className="rozet-yuzde">%68</span>
            </div>
            <svg className="alan-grafik" ref={grafikRef} viewBox="0 0 260 84" preserveAspectRatio="none">
              <path className="alanp" d={ilk.alan} fill="url(#alanGrad)" />
              <path className="cizgi cizim" d={ilk.cizgi} pathLength={1} />
              <circle className="uc-hale" cx={ilk.uc[0]} cy={ilk.uc[1]} r="4" />
              <circle className="uc" cx={ilk.uc[0]} cy={ilk.uc[1]} r="4" />
            </svg>
            <div className="ay-etiket">
              {["Oca", "Mar", "May", "Tem", "Eyl", "Kas"].map((a) => (
                <span key={a}>{a}</span>
              ))}
            </div>
          </div>
          <div className="cam-kart k-doluluk belir" style={gecikme(".65s")}>
            <div className="ust-yazi">Doluluk</div>
            <div className="halka-sat">
              <svg className="halka" viewBox="0 0 100 100">
                <circle className="iz" cx="50" cy="50" r="40" />
                <circle className="dolu" cx="50" cy="50" r="40" pathLength={100} style={{ ["--yuzde" as string]: 89 } as CSSProperties} />
              </svg>
              <div>
                <div className="yuzde">
                  %<span ref={dolulukRef}>89</span>
                </div>
                <div className="lejant">
                  <span>
                    <i style={{ background: "#52E0C8" }} />
                    Ödendi 40
                  </span>
                  <span>
                    <i style={{ background: "#F6C56B" }} />
                    Bekliyor 9
                  </span>
                  <span>
                    <i style={{ background: "#F58FB0" }} />
                    Gecikmiş 7
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="cam-kart k-bildirim belir" style={gecikme(".8s")}>
            <div className="bildirim-ikon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>
            <div className={`bildirim-metin${degisiyor ? " degis" : ""}`}>
              <b>{BILDIRIMLER[bi][0]}</b>
              <span>{BILDIRIMLER[bi][1]}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
