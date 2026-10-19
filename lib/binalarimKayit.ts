// "Binalarım" kaydının doğrulaması — SAF (veritabanına bakmaz; sahiplik
// kümeleri çağırandan gelir). Sunucu ucu (app/api/dashboard/binalar) bunu
// kullanır; istemci de aynı kurallarla önceden uyarı verebilir.
import { ILLER } from "@/lib/iller";

export type KayitBirimi = { propertyId: string; blok: string | null; daireNo: string | null };
export type KayitKonumu = { lat: number; lng: number; dogrulandi: boolean };
export type KayitBinasi = {
  /** Kayıtlı bina kimliği; yeni binada null */
  id: string | null;
  ad: string;
  il: string | null;
  ilce: string | null;
  konum: KayitKonumu | null;
  birimler: KayitBirimi[];
};

export const SINIR = { bina: 1000, ad: 80, ilce: 60, blok: 10, daireNo: 20 };
const BLOK_RE = /^[A-ZÇĞİÖŞÜ0-9-]{1,10}$/;
// Türkiye ve yakın çevresi (yanlışlıkla okyanusa düşen pin kaydedilmesin)
const ENLEM = [35.5, 42.5] as const;
const BOYLAM = [25.5, 45] as const;

const ILLER_KUMESI = new Set<string>(ILLER);

function metin(v: unknown): string | null {
  return typeof v === "string" ? v.replace(/[\u0000-\u001f\u007f]/g, "").replace(/\s+/g, " ").trim() : null;
}

export function kayitDogrula(
  govde: unknown,
  sahipMulkleri: Set<string>,
  sahipBinalari: Set<string>
): { ok: true; binalar: KayitBinasi[] } | { ok: false; hata: string } {
  const liste = (govde as { binalar?: unknown })?.binalar;
  if (!Array.isArray(liste)) return { ok: false, hata: "Geçersiz istek." };
  if (liste.length > SINIR.bina) return { ok: false, hata: "Çok fazla bina." };

  const gorulenMulk = new Set<string>();
  const gorulenBina = new Set<string>();
  const binalar: KayitBinasi[] = [];

  for (const [i, ham] of liste.entries()) {
    const b = ham as Record<string, unknown>;
    const sira = `${i + 1}. bina`;

    const id = b.id === null || b.id === undefined ? null : metin(b.id);
    if (id !== null) {
      if (!sahipBinalari.has(id)) return { ok: false, hata: `${sira}: bina bulunamadı.` };
      if (gorulenBina.has(id)) return { ok: false, hata: `${sira}: aynı bina iki kez gönderildi.` };
      gorulenBina.add(id);
    }

    const ad = metin(b.ad);
    if (!ad) return { ok: false, hata: `${sira}: bina adı boş olamaz.` };
    if (ad.length > SINIR.ad) return { ok: false, hata: `${sira}: bina adı en çok ${SINIR.ad} karakter.` };

    const il = b.il === null || b.il === undefined || b.il === "" ? null : metin(b.il);
    if (il !== null && !ILLER_KUMESI.has(il)) return { ok: false, hata: `${sira}: il listeden seçilmeli.` };

    const ilce = b.ilce === null || b.ilce === undefined ? null : metin(b.ilce) || null;
    if (ilce && ilce.length > SINIR.ilce) return { ok: false, hata: `${sira}: ilçe en çok ${SINIR.ilce} karakter.` };

    let konum: KayitKonumu | null = null;
    if (b.konum !== null && b.konum !== undefined) {
      const k = b.konum as Record<string, unknown>;
      const lat = Number(k.lat);
      const lng = Number(k.lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < ENLEM[0] || lat > ENLEM[1] || lng < BOYLAM[0] || lng > BOYLAM[1]) {
        return { ok: false, hata: `${sira}: konum Türkiye sınırları dışında.` };
      }
      konum = { lat: Number(lat.toFixed(6)), lng: Number(lng.toFixed(6)), dogrulandi: k.dogrulandi === true };
    }

    if (!Array.isArray(b.birimler) || b.birimler.length === 0) return { ok: false, hata: `${sira}: en az bir birim olmalı.` };
    const birimler: KayitBirimi[] = [];
    for (const hamBirim of b.birimler) {
      const u = hamBirim as Record<string, unknown>;
      const propertyId = metin(u.propertyId);
      if (!propertyId || !sahipMulkleri.has(propertyId)) return { ok: false, hata: `${sira}: mülk bulunamadı.` };
      if (gorulenMulk.has(propertyId)) return { ok: false, hata: `${sira}: bir mülk iki binada olamaz.` };
      gorulenMulk.add(propertyId);

      const blokHam = metin(u.blok);
      const blok = blokHam ? blokHam.toLocaleUpperCase("tr-TR") : null;
      if (blok && !BLOK_RE.test(blok)) return { ok: false, hata: `${sira}: blok yalnız harf/rakam olmalı (ör. A, B, 2A).` };

      const daireNo = metin(u.daireNo) || null;
      if (daireNo && daireNo.length > SINIR.daireNo) return { ok: false, hata: `${sira}: daire no en çok ${SINIR.daireNo} karakter.` };

      birimler.push({ propertyId, blok, daireNo });
    }

    binalar.push({ id, ad, il, ilce, konum, birimler });
  }

  return { ok: true, binalar };
}

/** Haritadan tek bina konumu kaydı için doğrulama */
export function konumDogrula(govde: unknown): KayitKonumu | null {
  const k = govde as Record<string, unknown>;
  const lat = Number(k?.lat);
  const lng = Number(k?.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < ENLEM[0] || lat > ENLEM[1] || lng < BOYLAM[0] || lng > BOYLAM[1]) return null;
  return { lat: Number(lat.toFixed(6)), lng: Number(lng.toFixed(6)), dogrulandi: true };
}
