// Mobil API'nin SAF kuralları: oturum yanıtı alanları, yenileme kararı, sayfalama,
// tarih okuma. Veritabanı yok; tablo testleri tests/mobilBicim.test.ts.
import type { AccessState } from "@/lib/access";

export type KullaniciTuru = "SAHIP" | "UYE" | "ADMIN";

export function kullaniciTuru(role: "ADMIN" | "CUSTOMER", memberId?: string | null): KullaniciTuru {
  if (memberId) return "UYE";
  return role === "ADMIN" ? "ADMIN" : "SAHIP";
}

// Kullanım koşulları ve açık rıza yalnız hesap sahibinden istenir
export function sozlesmeGerekli(
  tur: KullaniciTuru,
  sahip: { termsAcceptedAt: Date | null; marketingConsentAt: Date | null }
): boolean {
  return tur === "SAHIP" && (!sahip.termsAcceptedAt || !sahip.marketingConsentAt);
}

export type ErisimOzeti = {
  state: AccessState;
  trialDaysLeft: number;
  graceDaysLeft: number;
  graceEndsAt: Date;
};

// yazmaKapali, lib/access.ts requireWriteAccess ile aynı kural: istemci yazma
// düğmelerini önceden kapatabilsin diye. Ödeme ya da fiyat bilgisi taşımaz.
export function abonelikBilgisi(
  sahip: { subscriptionStatus: string; trialEndsAt: Date; emailVerifiedAt: Date | null },
  erisim: ErisimOzeti
) {
  const kilitli = erisim.state === "LOCKED";
  const epostaOnaysiz = !kilitli && erisim.state !== "TRIAL" && !sahip.emailVerifiedAt;
  return {
    durum: sahip.subscriptionStatus,
    erisim: erisim.state,
    denemeBitis: sahip.trialEndsAt,
    ekSureBitis: erisim.graceEndsAt,
    denemeKalanGun: erisim.trialDaysLeft,
    ekSureKalanGun: erisim.graceDaysLeft,
    kilitli,
    yazmaKapali: kilitli || epostaOnaysiz,
    yazmaKapaliSebep: kilitli ? ("KILITLI" as const) : epostaOnaysiz ? ("EPOSTA_ONAYSIZ" as const) : null,
  };
}

export type YenilemeHatasi = "GECERSIZ" | "SURESI_DOLDU" | "SIFRE_DEGISTI" | "CALINMA_SUPHESI";

// Yenileme jetonu kaydı bulunduktan sonraki karar. null = yenilenebilir.
export function yenilemeKarari(
  kayit: { yenilemeOzeti: string; oncekiGecerlilik: Date | null; sonKullanma: Date; sessionVersion: number },
  gelenOzet: string,
  guncelSurum: number,
  simdi: Date
): YenilemeHatasi | null {
  // Süresi geçmiş eski jeton yeniden geldi: biri kopyalamış olabilir
  const eskiJeton = kayit.yenilemeOzeti !== gelenOzet;
  if (eskiJeton && !(kayit.oncekiGecerlilik && kayit.oncekiGecerlilik > simdi)) return "CALINMA_SUPHESI";
  if (kayit.sonKullanma <= simdi) return "SURESI_DOLDU";
  if (kayit.sessionVersion !== guncelSurum) return "SIFRE_DEGISTI";
  return null;
}

const ADET_SINIRI = 100;
const SAYFA_SINIRI = 1_000_000;

/** ?sayfa=1&adet=20 → Prisma skip/take + yanıt sarmalayıcı */
export function sayfalama(arama: URLSearchParams, varsayilanAdet = 20) {
  const tamsayi = (ad: string) => {
    const n = Math.trunc(Number(arama.get(ad)));
    return Number.isFinite(n) ? n : 0;
  };
  const sayfa = Math.min(SAYFA_SINIRI, Math.max(1, tamsayi("sayfa") || 1));
  const adet = Math.min(ADET_SINIRI, Math.max(1, tamsayi("adet") || varsayilanAdet));
  return {
    sayfa,
    adet,
    skip: (sayfa - 1) * adet,
    take: adet,
    sar: <T>(kayitlar: T[], toplam: number) => ({ kayitlar, sayfa, adet, toplam, sonrakiVar: sayfa * adet < toplam }),
  };
}

export function sorguMetni(arama: URLSearchParams, ad: string, sinir = 200): string | null {
  const d = arama.get(ad)?.trim();
  return d ? d.slice(0, sinir) : null;
}

/** Geçersiz tarih süzgeç sayılmaz */
export function sorguTarihi(arama: URLSearchParams, ad: string): Date | null {
  const d = arama.get(ad);
  if (!d) return null;
  const t = new Date(d);
  return Number.isNaN(t.getTime()) ? null : t;
}

/** bas dahil, bit hariç; ikisi de yoksa undefined (Prisma süzmez) */
export function tarihAraligi(bas: Date | null, bit: Date | null) {
  if (!bas && !bit) return undefined;
  return { ...(bas ? { gte: bas } : {}), ...(bit ? { lt: bit } : {}) };
}

/** Decimal | number | null → sayı | null */
export function sayiya(d: { toString(): string } | number | null | undefined): number | null {
  return d === null || d === undefined ? null : Number(d);
}
