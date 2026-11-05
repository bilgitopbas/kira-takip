"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { gecikme } from "./SvgTanimlari";
import { dongudeCalis } from "./hareket";

// "Neler Yapıyoruz?": tek büyük panel önizlemesi. Solda dört yetenek; seçilen
// yeteneğin panel ekranı sağda hareketli olarak çizilir. Sekmeler kendiliğinden
// sırayla geçer (fare üstündeyken ya da "hareketi azalt" açıkken bekler). Tüm veriler örnektir.

type Sekme = "kiraci" | "mulk" | "rapor" | "bulut";
const SEKMELER: { id: Sekme; baslik: string; metin: string; yol: string; adres: string }[] = [
  {
    id: "kiraci",
    baslik: "Profesyonel kiracı takibi",
    metin: "Tüm kiracıların — ödemeler, sözleşmeler, bakiyeler tek ekranda. Kim ödedi, kim geçti, anında gör.",
    yol: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75",
    adres: "panel/kiracilar",
  },
  {
    id: "mulk",
    baslik: "Kapsamlı mülk yönetimi",
    metin: "Her mülk için sözleşme, doluluk durumu, kiracı bilgisi — hepsi tek yerde, güvende.",
    yol: "M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5zM9 21V12h6v9",
    adres: "panel/mulkler",
  },
  {
    id: "rapor",
    baslik: "Finansal raporlama",
    metin: "Aylık ve yıllık gelir raporları, tahsilat oranı — tek tıkla Excel'e aktarın.",
    yol: "M4 20V10M10 20V4M16 20v-7M22 20H2",
    adres: "panel/raporlar",
  },
  {
    id: "bulut",
    baslik: "Bulut tabanlı erişim",
    metin: "Bilgisayar, tablet, telefon — her yerden erişin, veriniz güvende.",
    yol: "M17.5 19H9a5 5 0 110-10 6.5 6.5 0 0112.6 2.1A4.5 4.5 0 0117.5 19z",
    adres: "panel",
  },
];
const SURE = 5600;

const KIRACILAR = [
  { harf: "DA", renk: { background: "#DCEBFF", color: "#1F55B8" }, ad: "Deniz Aydın", mulk: "Ataşehir Daire", durum: "Ödendi", sinif: "d-odendi", tutar: "24.000 ₺" },
  { harf: "BŞ", renk: { background: "#FDF0D5", color: "#8A5A00" }, ad: "Burak Şahin", mulk: "Maslak Ofis", durum: "2 gün geç", sinif: "d-gec", tutar: "41.500 ₺", canli: true },
  { harf: "CY", renk: { background: "#F0E6FF", color: "#6A3DB8" }, ad: "Cemre Yıldız", mulk: "Nişantaşı Daire", durum: "Yarın", sinif: "d-yarin", tutar: "29.000 ₺" },
  { harf: "EK", renk: { background: "#FCE3EC", color: "#9E3D66" }, ad: "Ece Kaya", mulk: "Kadıköy Dükkan", durum: "Ödendi", sinif: "d-odendi", tutar: "18.500 ₺" },
];
// Birim durum dağılımı: gecikmiş / bekliyor / ödendi / boş
const MULKLER = [
  { ad: "Mavi Kule", yer: "Ankara / Çankaya", birim: 24, dagilim: [3, 3, 15, 3], ikon: "#E25C7F" },
  { ad: "Örnek Çarşı", yer: "Konya / Karatay", birim: 12, dagilim: [2, 2, 8, 0], ikon: "#E25C7F" },
  { ad: "Liman İş Hanı", yer: "Konya / Selçuklu", birim: 10, dagilim: [0, 2, 6, 2], ikon: "#E0A93B" },
  { ad: "Çınar Apartmanı", yer: "Konya / Meram", birim: 8, dagilim: [1, 1, 5, 1], ikon: "#E25C7F" },
];
const DAGILIM_RENK = ["#F58FB0", "#F6C56B", "#2CC9B5", "#C9D2E0"];
const AYLAR = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
const GELIR = [42, 48, 45, 55, 52, 60, 58, 66, 63, 72, 78, 0];

function Ikon({ yol }: { yol: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={yol} />
    </svg>
  );
}

function KiraciEkrani() {
  const [odendi, setOdendi] = useState(false);
  useEffect(() => {
    const id = window.setInterval(() => dongudeCalis() && setOdendi((o) => !o), 2600);
    return () => window.clearInterval(id);
  }, []);
  return (
    <>
      <div className="oz-kpiler">
        <div>
          <small>Toplam kiracı</small>
          <b>56</b>
        </div>
        <div>
          <small>Bu ay tahsilat</small>
          <b>1,4 Mn ₺</b>
        </div>
        <div className="pembe">
          <small>Gecikmiş</small>
          <b>7 kayıt</b>
        </div>
      </div>
      <div className="satirlar">
        {KIRACILAR.map((k) => {
          const durum = k.canli && odendi ? { metin: "Ödendi", sinif: "d-odendi" } : { metin: k.durum, sinif: k.sinif };
          return (
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
                <span className={`durum ${durum.sinif}`}>{durum.metin}</span>
                <span className="tutar">{k.tutar}</span>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

function MulkEkrani() {
  return (
    <div className="oz-mulk">
      <div className="oz-mulk-liste">
        {MULKLER.map((m) => (
          <div className="oz-mulk-satir" key={m.ad}>
            <span className="oz-mulk-ikon" style={{ background: m.ikon }}>
              <Ikon yol="M4 21V5a2 2 0 012-2h8a2 2 0 012 2v16M16 9h2a2 2 0 012 2v10M8 7h4M8 11h4M8 15h4" />
            </span>
            <div className="oz-mulk-govde">
              <div className="oz-mulk-ust">
                <b>{m.ad}</b>
                <small>{m.birim} birim</small>
              </div>
              <small>{m.yer}</small>
              <div className="oz-dagilim">
                {m.dagilim.map((n, i) =>
                  n ? <i key={i} style={{ flexGrow: n, background: DAGILIM_RENK[i] }} /> : null,
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="oz-doluluk">
        <div className="oz-halka">
          <svg viewBox="0 0 100 100" aria-hidden="true">
            <circle cx="50" cy="50" r="40" className="iz" />
            <circle cx="50" cy="50" r="40" className="dolu" pathLength={100} />
          </svg>
          <b>%89</b>
        </div>
        <small>doluluk</small>
        <div className="oz-lejant">
          <span>
            <i style={{ background: DAGILIM_RENK[0] }} />
            Gecikmiş
          </span>
          <span>
            <i style={{ background: DAGILIM_RENK[1] }} />
            Bekliyor
          </span>
          <span>
            <i style={{ background: DAGILIM_RENK[2] }} />
            Ödendi
          </span>
          <span>
            <i style={{ background: DAGILIM_RENK[3] }} />
            Boş
          </span>
        </div>
      </div>
    </div>
  );
}

function RaporEkrani() {
  const [carpan, setCarpan] = useState(GELIR.map(() => 1));
  useEffect(() => {
    const id = window.setInterval(() => {
      if (dongudeCalis()) setCarpan(GELIR.map(() => 0.9 + Math.random() * 0.18));
    }, 2200);
    return () => window.clearInterval(id);
  }, []);
  return (
    <>
      <div className="oz-kpiler">
        <div>
          <small>Bu yıl kira geliri</small>
          <b>19,3 Mn ₺</b>
        </div>
        <div>
          <small>Tahsilat oranı</small>
          <b>%84</b>
        </div>
        <div className="oz-excel">
          <Ikon yol="M12 3v12m0 0l-4-4m4 4l4-4M4 21h16" />
          Excel&apos;e aktar
        </div>
      </div>
      <div className="oz-cubuklar" aria-hidden="true">
        {GELIR.map((h, i) => (
          <div key={AYLAR[i]}>
            <span
              className={i === 10 ? "p" : undefined}
              style={{ height: `${h ? Math.min(100, h * carpan[i]) : 4}%`, animationDelay: `${i * 0.05}s` }}
            />
            <small>{AYLAR[i]}</small>
          </div>
        ))}
      </div>
    </>
  );
}

function BulutEkrani() {
  const cihazlar = ["Bilgisayar", "Tablet", "Telefon"];
  return (
    <div className="oz-bulut">
      <div className="oz-cihazlar" aria-hidden="true">
        <div className="oz-laptop">
          <div className="oz-ekrancik">
            <small>Bu ay tahsilat</small>
            <b>1,4 Mn ₺</b>
            <i />
          </div>
        </div>
        <div className="oz-tablet">
          <div className="oz-ekrancik">
            <small>Doluluk</small>
            <b>%89</b>
            <i />
          </div>
        </div>
        <div className="oz-telefon">
          <div className="oz-ekrancik">
            <b>7</b>
            <small>gecikmiş</small>
          </div>
        </div>
        <span className="oz-bulut-ikon">
          <Ikon yol="M17.5 19H9a5 5 0 110-10 6.5 6.5 0 0112.6 2.1A4.5 4.5 0 0117.5 19z" />
        </span>
      </div>
      <div className="oz-esitleme">
        {cihazlar.map((c, i) => (
          <span key={c} style={{ animationDelay: `${0.4 + i * 0.5}s` }}>
            <Ikon yol="M20 6L9 17l-5-5" />
            {c} · eşitlendi
          </span>
        ))}
      </div>
      <div className="oz-guven">
        <span>SSL ile şifreli bağlantı</span>
        <span>Düzenli yedekleme</span>
      </div>
    </div>
  );
}

const EKRANLAR: Record<Sekme, () => ReactNode> = {
  kiraci: KiraciEkrani,
  mulk: MulkEkrani,
  rapor: RaporEkrani,
  bulut: BulutEkrani,
};

export default function NelerYapiyoruz() {
  const [secili, setSecili] = useState(0);
  const ilerlemeRef = useRef<(HTMLSpanElement | null)[]>([]);
  const birikimRef = useRef(0);
  const ustundeRef = useRef(false);

  const sec = (i: number) => {
    setSecili(i);
    birikimRef.current = 0;
    ilerlemeRef.current.forEach((el) => el && (el.style.width = "0"));
  };

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
        if (p >= 1) sec((secili + 1) % SEKMELER.length);
      }
      id = requestAnimationFrame(dongu);
    };
    id = requestAnimationFrame(dongu);
    return () => cancelAnimationFrame(id);
  }, [secili]);

  const aktif = SEKMELER[secili];
  const Ekran = EKRANLAR[aktif.id];

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

        <div
          className="onizleme belir"
          style={gecikme(".1s")}
          onPointerEnter={() => (ustundeRef.current = true)}
          onPointerLeave={() => (ustundeRef.current = false)}
        >
          <div className="oz-sekmeler" role="tablist" aria-label="Mizan Mülk Yönetimi yetenekleri">
            {SEKMELER.map((s, i) => (
              <button
                key={s.id}
                type="button"
                role="tab"
                id={`oz-${s.id}`}
                aria-selected={i === secili}
                aria-controls="ozEkran"
                tabIndex={i === secili ? 0 : -1}
                onClick={() => sec(i)}
                onKeyDown={(e) => {
                  if (!["ArrowDown", "ArrowUp", "ArrowLeft", "ArrowRight"].includes(e.key)) return;
                  e.preventDefault();
                  const ileri = e.key === "ArrowDown" || e.key === "ArrowRight";
                  const n = (secili + (ileri ? 1 : -1) + SEKMELER.length) % SEKMELER.length;
                  sec(n);
                  document.getElementById(`oz-${SEKMELER[n].id}`)?.focus();
                }}
              >
                <span className="oz-ikon">
                  <Ikon yol={s.yol} />
                </span>
                <span className="oz-yazi">
                  <b>
                    {s.baslik}
                    {s.id === "kiraci" && <em className="etk">En Çok Kullanılan</em>}
                  </b>
                  <small>{s.metin}</small>
                </span>
                <span
                  className="ilerleme"
                  ref={(el) => {
                    ilerlemeRef.current[i] = el;
                  }}
                />
              </button>
            ))}
          </div>

          <div className="oz-pencere" role="tabpanel" id="ozEkran" aria-labelledby={`oz-${aktif.id}`}>
            <div className="oz-cubuk">
              <i />
              <i />
              <i />
              <span>mizanmulkyonetimi.com/{aktif.adres}</span>
            </div>
            <div className="oz-icerik" key={aktif.id}>
              <h3>{aktif.baslik}</h3>
              <Ekran />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
