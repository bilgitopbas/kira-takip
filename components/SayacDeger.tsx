"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Sayfa açılınca 0'dan hedefe sayan rakam.
 * - Türkçe binlik ayracıyla biçimlenir.
 * - "Hareketi azalt" tercihi açık olan kullanıcıda animasyon çalışmaz,
 *   değer doğrudan görünür.
 * - Yazdırırken de sorun çıkmasın diye animasyon her hâlükârda hedefte biter.
 */
export default function SayacDeger({
  hedef,
  sonEk = "",
  onEk = "",
  sure = 1100,
  ondalik = 0,
}: {
  hedef: number;
  sonEk?: string;
  onEk?: string;
  sure?: number;
  ondalik?: number;
}) {
  const [deger, setDeger] = useState(0);
  const cerceve = useRef<number | null>(null);

  useEffect(() => {
    // Hareketi azalt tercihi açıksa süre 0 olur; ilk karede değer hedefe oturur.
    const azalt = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const gercekSure = azalt ? 0 : sure;

    const baslangic = performance.now();
    // Sona doğru yavaşlayan yumuşak geçiş
    const yumusat = (t: number) => 1 - Math.pow(1 - t, 3);

    function adim(simdi: number) {
      const oran = gercekSure <= 0 ? 1 : Math.min(1, (simdi - baslangic) / gercekSure);
      setDeger(hedef * yumusat(oran));
      if (oran < 1) cerceve.current = requestAnimationFrame(adim);
    }
    cerceve.current = requestAnimationFrame(adim);

    // Sayaç sayarken yazdırılırsa kâğıda yarım rakam basılmasın: yazdırma
    // penceresi açılmadan önce değeri hedefe sabitle. (Finansal bir rapor,
    // yanlış tutar basmak kabul edilemez.)
    function yazdirmadanOnce() {
      if (cerceve.current !== null) cancelAnimationFrame(cerceve.current);
      setDeger(hedef);
    }
    window.addEventListener("beforeprint", yazdirmadanOnce);

    return () => {
      if (cerceve.current !== null) cancelAnimationFrame(cerceve.current);
      window.removeEventListener("beforeprint", yazdirmadanOnce);
    };
  }, [hedef, sure]);

  const gosterilen = deger.toLocaleString("tr-TR", {
    minimumFractionDigits: ondalik,
    maximumFractionDigits: ondalik,
  });

  return (
    <span className="tabular-nums">
      {onEk}
      {gosterilen}
      {sonEk}
    </span>
  );
}
