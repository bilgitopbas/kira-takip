"use client";

import { useState } from "react";

// Hızlı aralık seçenekleri: bugünden geriye doğru
export const HIZLI_ARALIKLAR = [
  { key: "1a", label: "1 Ay", months: 1 },
  { key: "3a", label: "3 Ay", months: 3 },
  { key: "6a", label: "6 Ay", months: 6 },
  { key: "1y", label: "1 Yıl", months: 12 },
  { key: "3y", label: "3 Yıl", months: 36 },
  { key: "tum", label: "Tümü", months: null },
] as const;

export type HizliAralik = (typeof HIZLI_ARALIKLAR)[number];

/**
 * <input type="date"> için YEREL tarihi biçimler.
 * toISOString() UTC'ye çevirdiği için Türkiye saatinde (UTC+3) tarih bir gün
 * geri kayıyordu — "3 Ay" seçilince 30 Nisan yerine 29 Nisan görünüyordu.
 */
export function toDateInput(d: Date) {
  const yil = d.getFullYear();
  const ay = String(d.getMonth() + 1).padStart(2, "0");
  const gun = String(d.getDate()).padStart(2, "0");
  return `${yil}-${ay}-${gun}`;
}

/**
 * Tahsilat defteri ve finans raporlarının ortak tarih aralığı filtresi.
 * @param enEskiTarihBul "Tümü" seçilince kullanılacak en eski kayıt tarihi
 * @param araliktaDegisince aralık her değiştiğinde çalışır (ör. sayfalamayı
 *   başa sarmak için)
 */
export function useTarihAraligi(
  enEskiTarihBul: () => Date,
  araliktaDegisince?: () => void
) {
  const now = new Date();
  // Sayfa açılırken tüm geçmiş yerine son 1 ay gösterilir.
  const [startDate, setStartDate] = useState(
    toDateInput(new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()))
  );
  const [endDate, setEndDate] = useState(toDateInput(now));
  // Hangi hızlı seçeneğin etkin olduğunu göstermek için (tarih elle
  // değiştirilirse boşalır)
  const [aktifAralik, setAktifAralik] = useState<string | null>("1a");
  const [seciliAy, setSeciliAy] = useState("");

  function tarihAraligiSec(baslangic: Date, bitis: Date, aralikKey: string | null) {
    setStartDate(toDateInput(baslangic));
    setEndDate(toDateInput(bitis));
    setAktifAralik(aralikKey);
    araliktaDegisince?.();
  }

  function hizliAralikSec(secenek: HizliAralik) {
    setSeciliAy("");
    if (secenek.months === null) {
      tarihAraligiSec(enEskiTarihBul(), new Date(), secenek.key);
      return;
    }
    const bugun = new Date();
    const baslangic = new Date(
      bugun.getFullYear(),
      bugun.getMonth() - secenek.months,
      bugun.getDate()
    );
    tarihAraligiSec(baslangic, bugun, secenek.key);
  }

  // "2026-05" biçimindeki ay seçimi -> o ayın ilk ve son günü
  function aySec(deger: string) {
    setSeciliAy(deger);
    if (!deger) return;
    const [yil, ay] = deger.split("-").map(Number);
    tarihAraligiSec(new Date(yil, ay - 1, 1), new Date(yil, ay, 0), null);
  }

  function elleTarihDegistir(tip: "start" | "end", deger: string) {
    if (tip === "start") setStartDate(deger);
    else setEndDate(deger);
    setAktifAralik(null);
    setSeciliAy("");
    araliktaDegisince?.();
  }

  return {
    startDate,
    endDate,
    seciliAy,
    aktifAralik,
    hizliAralikSec,
    aySec,
    elleTarihDegistir,
  };
}

/** Bir ISO tarihin seçili aralığa girip girmediğini söyler. */
export function araliktaMi(isoTarih: string, startDate: string, endDate: string) {
  const bitis = new Date(endDate);
  bitis.setHours(23, 59, 59, 999);
  const d = new Date(isoTarih);
  return d >= new Date(startDate) && d <= bitis;
}
