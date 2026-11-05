// Ana sayfadaki SVG'lerin paylaştığı gradyanlar ve simgeler (tik, ok, yıldız).
import type { CSSProperties } from "react";

export default function SvgTanimlari() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
      <defs>
        <linearGradient id="halkaGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8EF0DE" />
          <stop offset="1" stopColor="#F5B8CF" />
        </linearGradient>
        <linearGradient id="alanGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#52E0C8" stopOpacity=".45" />
          <stop offset="1" stopColor="#52E0C8" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="cbGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#52E0C8" />
          <stop offset="1" stopColor="#1FC2B0" stopOpacity=".55" />
        </linearGradient>
        <linearGradient id="cbGradP" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F5B8CF" />
          <stop offset="1" stopColor="#E07AA3" stopOpacity=".75" />
        </linearGradient>
        <symbol id="tik" viewBox="0 0 16 16">
          <path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        </symbol>
        <symbol id="ok" viewBox="0 0 24 24">
          <path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </symbol>
        <symbol id="yildizS" viewBox="0 0 20 20">
          <path
            fill="currentColor"
            d="M9.05 2.93c.3-.92 1.6-.92 1.9 0l1.07 3.29a1 1 0 00.95.69h3.46c.97 0 1.37 1.24.59 1.81l-2.8 2.03a1 1 0 00-.36 1.12l1.07 3.29c.3.92-.76 1.69-1.54 1.12l-2.8-2.03a1 1 0 00-1.18 0l-2.8 2.03c-.78.57-1.84-.2-1.54-1.12l1.07-3.29a1 1 0 00-.36-1.12L2.98 8.72c-.78-.57-.38-1.81.59-1.81h3.46a1 1 0 00.95-.69l1.07-3.29z"
          />
        </symbol>
      </defs>
    </svg>
  );
}

/** Tik ve ok simgelerinin kısa kullanımı. */
export function Tik() {
  return (
    <svg aria-hidden="true">
      <use href="#tik" />
    </svg>
  );
}

export function Ok({ ters = false }: { ters?: boolean }) {
  return (
    <svg aria-hidden="true" style={ters ? { transform: "scaleX(-1)" } : undefined}>
      <use href="#ok" />
    </svg>
  );
}

/** Belirme gecikmesi: style={gecikme(".1s")} */
export function gecikme(s: string): CSSProperties {
  return { ["--g" as string]: s } as CSSProperties;
}
