import { PRICE_PER_PROPERTY } from "@/lib/fiyat";

/** Havale açıklamasına yazılacak seçenekler */
export const ODEME_PERIYOTLARI = [
  { ay: 1, etiket: "1 Ay" },
  { ay: 3, etiket: "3 Ay" },
  { ay: 6, etiket: "6 Ay" },
  { ay: 12, etiket: "1 Yıl" },
] as const;

export function periyotGecerliMi(ay: number) {
  return ODEME_PERIYOTLARI.some((p) => p.ay === ay);
}

/** Mülk sayısı × aylık birim fiyat × ay sayısı */
export function tutarHesapla(mulkSayisi: number, ay: number) {
  return mulkSayisi * PRICE_PER_PROPERTY * ay;
}

// Karisikligi onlemek icin benzer gorunen harf/rakamlar (I, O, 0, 1) yok.
const KOD_ALFABESI = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/**
 * "MZN-4F7K" biçiminde havale referans kodu üretir. Müşteri bunu havale
 * açıklamasına yazar, ekstrede kimin ödediği anında bulunur.
 */
export function referansKoduUret() {
  let kod = "";
  for (let i = 0; i < 4; i++) {
    kod += KOD_ALFABESI[Math.floor(Math.random() * KOD_ALFABESI.length)];
  }
  return `MZN-${kod}`;
}

/**
 * Banka bilgileri .env'den okunur — IBAN kod deposuna girmez.
 * Eksikse ödeme bölümü gösterilmez.
 */
export function bankaBilgileri() {
  const iban = process.env.BANKA_IBAN?.trim();
  const sahip = process.env.BANKA_HESAP_SAHIBI?.trim();
  const banka = process.env.BANKA_ADI?.trim();
  if (!iban || !sahip) return null;
  return { iban, sahip, banka: banka || "" };
}
