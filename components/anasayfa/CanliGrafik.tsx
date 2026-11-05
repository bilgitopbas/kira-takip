"use client";

import { useEffect, useRef, useState } from "react";
import { egriYolu, trSayi } from "@/lib/anasayfaGrafik";
import { dongudeCalis } from "./hareket";

// Rakamlar bölümündeki örnek aylık tahsilat (sütun) + tahsilat oranı (çizgi) grafiği.
// Vurgu ayları sırayla dolaşır; fareyle istenen ay seçilebilir.
const AYLAR = ["Ara", "Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas"];
const TAHSILAT = [1.08, 1.12, 1.05, 1.21, 1.18, 1.3, 1.27, 1.38, 1.35, 1.47, 1.55, 1.62];
const ORAN = [71, 73, 70, 76, 75, 79, 78, 81, 80, 82, 83, 84];
const W = 720;
const H = 220;
const ALT = 26;
const UST = 12;
const GEN = W / 12;
const yT = (v: number) => H - ALT - (v / 1.8) * (H - ALT - UST);
const yO = (v: number) => H - ALT - ((v - 60) / 30) * (H - ALT - UST);
const NOKTALAR = ORAN.map((v, i): [number, number] => [i * GEN + GEN / 2, yO(v)]);

export default function CanliGrafik() {
  const [ay, setAy] = useState(11);
  const kutuRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const ipucuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = window.setInterval(() => {
      if (dongudeCalis() && !kutuRef.current?.classList.contains("bekle")) setAy((a) => (a + 1) % 12);
    }, 1700);
    return () => window.clearInterval(id);
  }, []);

  // İpucu kutusunu seçili sütunun üstüne yerleştir; kart kenarından taşırma.
  useEffect(() => {
    const yerlestir = () => {
      const kutu = kutuRef.current;
      const svg = svgRef.current;
      const ipucu = ipucuRef.current;
      if (!kutu || !svg || !ipucu) return;
      const sr = svg.getBoundingClientRect();
      const kr = kutu.getBoundingClientRect();
      const yari = ipucu.offsetWidth / 2 + 8;
      const x = sr.left - kr.left + (ay * GEN + GEN / 2) * (sr.width / W);
      ipucu.style.left = `${Math.max(yari, Math.min(kr.width - yari, x))}px`;
      ipucu.style.top = `${sr.top - kr.top + yT(TAHSILAT[ay]) * (sr.height / H)}px`;
    };
    yerlestir();
    window.addEventListener("resize", yerlestir);
    return () => window.removeEventListener("resize", yerlestir);
  }, [ay]);

  const tutar = `${trSayi(TAHSILAT[ay], 2)} Mn ₺`;

  return (
    <div className="canli-grafik belir" ref={kutuRef}>
      <div className="cg-ust">
        <div>
          <h3>Aylık tahsilat ve tahsilat oranı</h3>
          <small>Örnek görünüm · panelde canlı raporlar</small>
          <div className="cg-lejant">
            <span>
              <i style={{ background: "#2CC9B5" }} />
              Tahsilat
            </span>
            <span>
              <i style={{ background: "#E07AA3" }} />
              Tahsilat oranı
            </span>
          </div>
        </div>
        <div className="cg-deger" aria-live="off">
          {tutar}
          <span>%{ORAN[ay]}</span>
        </div>
      </div>
      <svg
        className="cg-svg"
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        aria-hidden="true"
        onPointerMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          setAy(Math.max(0, Math.min(11, Math.floor(((e.clientX - r.left) / r.width) * 12))));
        }}
      >
        {TAHSILAT.map((v, i) => (
          <g key={AYLAR[i]}>
            <rect
              className={`cb${i === ay ? " aktif" : ""}`}
              x={i * GEN + GEN * 0.2}
              y={yT(v)}
              width={GEN * 0.6}
              height={H - ALT - yT(v)}
              rx="6"
              style={{ transitionDelay: `${i * 0.06}s` }}
            />
            <text className="ay" x={i * GEN + GEN / 2} y={H - 6}>
              {AYLAR[i]}
            </text>
          </g>
        ))}
        <path className="cl cizim" d={egriYolu(NOKTALAR)} pathLength={1} />
        {NOKTALAR.map(([x, y]) => (
          <circle key={x} cx={x} cy={y} r="3.6" fill="#fff" stroke="#E07AA3" strokeWidth="2" />
        ))}
      </svg>
      <div className="cg-ipucu" ref={ipucuRef} aria-hidden="true">
        {AYLAR[ay]}
        <span>
          {tutar} · %{ORAN[ay]}
        </span>
      </div>
    </div>
  );
}
