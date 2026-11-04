// Mobil panel uçlarının SAF hesapları: birim süzme, il sayıları, "5. yıl" listesi,
// harita satırları. Veritabanı yok; tablo testleri tests/mobilPanelModeli.test.ts.
import { getFiveYearDate, toDateKey } from "@/lib/calendarEvents";
import { binaKonumlari } from "@/lib/haritaModeli";
import { aramaAnahtari, type Bina } from "@/lib/yeniPanelBina";
import type { BirimDurumu, BugunSatiri, IlOzeti, PanelBirimi } from "@/lib/yeniPanelTipleri";

const GUN = 24 * 60 * 60 * 1000;
const BES_YIL_GERI_GUN = 30;
const BES_YIL_ILERI_GUN = 90;

const DURUMLAR: BirimDurumu[] = ["odendi", "bekliyor", "gecikmis", "bos"];

export const durumOku = (d: string | null): BirimDurumu | null =>
  DURUMLAR.includes(d as BirimDurumu) ? (d as BirimDurumu) : null;

export type BirimSuzgeci = { q?: string | null; il?: string | null; durum?: BirimDurumu | null; tip?: string | null };

/** q: başlık, adres, kiracı adı */
export function birimleriSuz(birimler: PanelBirimi[], s: BirimSuzgeci): PanelBirimi[] {
  const q = s.q ? aramaAnahtari(s.q) : "";
  return birimler.filter(
    (b) =>
      (!s.il || b.il === s.il) &&
      (!s.durum || b.durum === s.durum) &&
      (!s.tip || b.propertyType === s.tip) &&
      (!q || aramaAnahtari(`${b.title} ${b.address} ${b.kiraci?.fullName ?? ""}`).includes(q))
  );
}

export function durumSayaci(birimler: PanelBirimi[]): Record<BirimDurumu, number> {
  const sayac: Record<BirimDurumu, number> = { odendi: 0, bekliyor: 0, gecikmis: 0, bos: 0 };
  for (const b of birimler) sayac[b.durum]++;
  return sayac;
}

/** Görünen birimlere göre il sayıları (kayıtlı binanın ili mülkün metninin önüne geçer) */
export function ilSayilari(birimler: PanelBirimi[]): { iller: IlOzeti[]; ilsizMulkSayisi: number } {
  const sayac = new Map<string, number>();
  let ilsizMulkSayisi = 0;
  for (const b of birimler) {
    if (b.il) sayac.set(b.il, (sayac.get(b.il) ?? 0) + 1);
    else ilsizMulkSayisi++;
  }
  const iller = [...sayac.entries()]
    .map(([il, mulkSayisi]) => ({ il, mulkSayisi }))
    .sort((a, b) => b.mulkSayisi - a.mulkSayisi || a.il.localeCompare(b.il, "tr"));
  return { iller, ilsizMulkSayisi };
}

/** Sözleşme başlangıcından 5 yıl: −30…+90 gün aralığındakiler, tarihe göre artan */
export function besYilListesi(
  kiracilar: { id: string; fullName: string; contractStart: Date | null; propertyId: string; propertyTitle: string }[],
  bugun: Date
): BugunSatiri[] {
  const bas = new Date(bugun);
  bas.setHours(0, 0, 0, 0);
  const satirlar: BugunSatiri[] = [];
  for (const k of kiracilar) {
    if (!k.contractStart) continue;
    const tarih = getFiveYearDate(new Date(k.contractStart));
    const fark = Math.round((tarih.getTime() - bas.getTime()) / GUN);
    if (fark < -BES_YIL_GERI_GUN || fark > BES_YIL_ILERI_GUN) continue;
    satirlar.push({
      birimId: k.propertyId,
      tenantId: k.id,
      tenantName: k.fullName,
      propertyTitle: k.propertyTitle,
      tarih: toDateKey(tarih),
    });
  }
  return satirlar.sort((a, b) => a.tarih.localeCompare(b.tarih));
}

/** Web'deki binaKonumlari + istemcinin göstereceği ad ve kayıtlı bina kimliği */
export function haritaVerisi(binalar: Bina[]) {
  const { konumlar, konumsuz } = binaKonumlari(binalar);
  const anahtarla = new Map(binalar.map((b) => [b.anahtar, b]));
  return {
    konumlar: konumlar.map((k) => {
      const b = anahtarla.get(k.anahtar);
      return { ...k, ad: b?.ad ?? "", binaId: b?.binaId ?? null };
    }),
    konumsuz: konumsuz.map((b) => ({ anahtar: b.anahtar, ad: b.ad, il: b.il, binaId: b.binaId })),
  };
}
