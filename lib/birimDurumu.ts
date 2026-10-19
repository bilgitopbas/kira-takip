// Birim (mülk) ödeme durumu — SAF işlev (bugünün tarihi parametre olarak verilir).
// Kural için bkz. lib/yeniPanelTipleri.ts → BirimDurumu.
import { getEffectiveDebtStatus } from "@/lib/debtStatus";
import type { BirimDurumu } from "@/lib/yeniPanelTipleri";

export type DurumBorcu = {
  amount: number | string | { toString(): string };
  dueDate: Date | string;
  year: number;
  /** 1-12 */
  month: number;
  periodMonths: number;
  payments: { amount: number | string | { toString(): string } }[];
};

export type DurumSonucu = {
  durum: BirimDurumu;
  gecikmisBorc: number;
  gecikmeGun: number;
  buAyVade: Date | null;
  borcKaydiYok: boolean;
};

const GUN = 24 * 60 * 60 * 1000;

function gunBasi(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

/**
 * @param oturanKiracilarinBorclari Her oturan kiracı için borç listesi.
 *        Boş dizi = oturan kiracı yok → "bos".
 */
export function birimDurumuHesapla(oturanKiracilarinBorclari: DurumBorcu[][], bugun: Date): DurumSonucu {
  if (oturanKiracilarinBorclari.length === 0) {
    return { durum: "bos", gecikmisBorc: 0, gecikmeGun: 0, buAyVade: null, borcKaydiYok: false };
  }

  const bugunBasi = gunBasi(bugun);
  const buAyIndeksi = bugun.getFullYear() * 12 + bugun.getMonth();

  let gecikmisBorc = 0;
  let enEskiGecikme: Date | null = null;
  let kapsayanVar = false;
  let kapsayanHepsiOdendi = true;
  let buAyVade: Date | null = null;

  for (const borclar of oturanKiracilarinBorclari) {
    for (const b of borclar) {
      const etkin = getEffectiveDebtStatus(b);
      const vade = new Date(b.dueDate);
      const odenen = b.payments.reduce((t, p) => t + Number(p.amount), 0);
      const kalan = Math.max(0, Number(b.amount) - odenen);

      // Vadesi geçmiş (vade günü bugünden önce) ve tamamı ödenmemiş
      if (gunBasi(vade) < bugunBasi && etkin !== "PAID" && kalan > 0) {
        gecikmisBorc += kalan;
        if (!enEskiGecikme || vade < enEskiGecikme) enEskiGecikme = vade;
      }

      const baslangic = b.year * 12 + (b.month - 1);
      const kapsar = baslangic <= buAyIndeksi && buAyIndeksi < baslangic + Math.max(1, b.periodMonths);
      if (kapsar) {
        kapsayanVar = true;
        if (etkin !== "PAID") kapsayanHepsiOdendi = false;
        if (!buAyVade || vade < buAyVade) buAyVade = vade;
      }
    }
  }

  const gecikmeGun = enEskiGecikme ? Math.max(0, Math.round((bugunBasi.getTime() - gunBasi(enEskiGecikme).getTime()) / GUN)) : 0;

  let durum: BirimDurumu;
  if (gecikmisBorc > 0) durum = "gecikmis";
  else if (kapsayanVar && kapsayanHepsiOdendi) durum = "odendi";
  else durum = "bekliyor";

  return { durum, gecikmisBorc, gecikmeGun, buAyVade, borcKaydiYok: !kapsayanVar };
}
