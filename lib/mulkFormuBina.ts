// Mülk Ekle/Düzenle formundaki bina + konum alanlarının saf modeli.
// Öneri: başlık/adres eşlemesi (lib/binaEslestir.ts); aynı ildeki aynı adlı
// kayıtlı bina varsa o seçilir, yoksa önerilen adla yeni bina. Pin: seçili
// kayıtlı binanın konumu, yoksa ilçe/il merkezi; il yoksa Türkiye geneli.
// İl çözülemezse hiçbir ile VARSAYILMAZ.
import { binaAnahtariOlustur, binaCoz } from "@/lib/binaEslestir";
import { ilCoz } from "@/lib/iller";
import { baslangicKonumu } from "@/lib/konumMerkezi";

export type FBina = {
  id: string;
  name: string;
  city: string | null;
  district: string | null;
  lat: number | null;
  lng: number | null;
  locationVerified: boolean;
  birimSayisi: number;
};

/** "" = binaya bağlama · "yeni" = yeni bina · diğerleri kayıtlı bina kimliği */
export type BinaAlani = { secim: string; yeniAd: string; blok: string; daireNo: string };

export function formOnerisi(mulk: { title: string; address: string; city: string }, binalar: FBina[]): BinaAlani {
  const c = binaCoz({ id: "form", title: mulk.title, address: mulk.address, city: mulk.city });
  const blok = c.blok ?? "";
  const daireNo = c.birimNo ?? "";
  if (c.kaynak !== "yok") {
    const es = binalar.find((b) => binaAnahtariOlustur(b.city, b.name) === c.binaAnahtari);
    if (es) return { secim: es.id, yeniAd: "", blok, daireNo };
    return { secim: "yeni", yeniAd: c.binaAdi, blok, daireNo };
  }
  // Tek başına mülk: kendi adıyla tek birimli bina (konumu tutabilmek için)
  return { secim: "yeni", yeniAd: mulk.title.trim(), blok: "", daireNo: "" };
}

export const TURKIYE_MERKEZI: [number, number] = [35.2, 39.0];

export function pinBaslangici(
  bina: FBina | null,
  sehir: string,
  ilce: string
): { nokta: [number, number]; yakinlik: number; kaynak: "bina" | "ilce" | "il" | "turkiye"; dogrulandi: boolean } {
  if (bina && bina.lat !== null && bina.lng !== null) {
    return { nokta: [bina.lng, bina.lat], yakinlik: 15, kaynak: "bina", dogrulandi: bina.locationVerified };
  }
  const bas = baslangicKonumu(sehir, ilce);
  if (bas) return { nokta: bas.nokta, yakinlik: bas.seviye === "ilce" ? 13 : 10, kaynak: bas.seviye, dogrulandi: false };
  return { nokta: TURKIYE_MERKEZI, yakinlik: 5, kaynak: "turkiye", dogrulandi: false };
}

/** Seçilebilir kayıtlı binalar: aynı ildekiler (il seçilmediyse hepsi) + şu an seçili olan */
export function secilebilirBinalar(binalar: FBina[], sehir: string, seciliId: string): FBina[] {
  const il = ilCoz(sehir);
  return binalar.filter((b) => b.id === seciliId || !il || ilCoz(b.city) === il);
}

/** /api/dashboard/binalar/ata gövdesi */
export function atamaGovdesi(
  propertyId: string,
  alan: BinaAlani,
  mulk: { title: string; city: string; district: string },
  binalar: FBina[],
  konum: { lat: number; lng: number } | null
) {
  const k = konum ? { lat: konum.lat, lng: konum.lng, dogrulandi: true } : null;
  if (!alan.secim) return { propertyId, bina: null, blok: null, daireNo: null };
  const blok = alan.blok.trim() || null;
  const daireNo = alan.daireNo.trim() || null;
  if (alan.secim === "yeni") {
    return {
      propertyId,
      bina: { id: null, ad: alan.yeniAd.trim() || mulk.title.trim(), il: ilCoz(mulk.city), ilce: mulk.district.trim() || null, konum: k },
      blok,
      daireNo,
    };
  }
  const b = binalar.find((x) => x.id === alan.secim);
  return { propertyId, bina: { id: alan.secim, ad: b?.name ?? "Bina", il: ilCoz(b?.city), ilce: b?.district ?? null, konum: k }, blok, daireNo };
}
