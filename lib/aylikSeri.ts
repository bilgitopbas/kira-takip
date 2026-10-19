// KPI kartlarındaki küçük eğriler (sparkline) için aylık seriler — SAF.

/** Son `ay` ayın her ay sonunda kaç kayıt vardı (birikimli) */
export function birikimliSeri(tarihler: Date[], bugun: Date, ay = 8): number[] {
  const seri: number[] = [];
  for (let i = ay - 1; i >= 0; i--) {
    const sinir = new Date(bugun.getFullYear(), bugun.getMonth() - i + 1, 1);
    seri.push(tarihler.filter((t) => t < sinir).length);
  }
  return seri;
}

/** Son `ay` ayın aylık toplamları */
export function aylikToplam(kayitlar: { tarih: Date; tutar: number }[], bugun: Date, ay = 8): number[] {
  const seri: number[] = [];
  for (let i = ay - 1; i >= 0; i--) {
    const bas = new Date(bugun.getFullYear(), bugun.getMonth() - i, 1);
    const son = new Date(bugun.getFullYear(), bugun.getMonth() - i + 1, 1);
    seri.push(kayitlar.filter((k) => k.tarih >= bas && k.tarih < son).reduce((t, k) => t + k.tutar, 0));
  }
  return seri;
}

/** Yılbaşından bu aya birikimli aylık gelir (Ocak … bu ay) */
export function yilIciBirikimli(kayitlar: { tarih: Date; tutar: number }[], bugun: Date): number[] {
  const seri: number[] = [];
  let toplam = 0;
  for (let m = 0; m <= bugun.getMonth(); m++) {
    const bas = new Date(bugun.getFullYear(), m, 1);
    const son = new Date(bugun.getFullYear(), m + 1, 1);
    toplam += kayitlar.filter((k) => k.tarih >= bas && k.tarih < son).reduce((t, k) => t + k.tutar, 0);
    seri.push(toplam);
  }
  return seri;
}
