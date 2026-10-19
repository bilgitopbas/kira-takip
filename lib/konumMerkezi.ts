// Harita pininin BAŞLANGIÇ noktası: ilçe merkezi, bulunamazsa il merkezi.
// Veri: lib/veri/il-ilce-merkezleri.json (Wikidata, CC0; bkz.
// scripts/wikidata-il-ilce-cek.mjs). Dış servise hiçbir istek atılmaz.
// Sonuç kesin konum değildir; "konum doğrulanmadı" rozetiyle gösterilir ve
// mülk sahibi pini sürükleyerek doğrular.
import veri from "@/lib/veri/il-ilce-merkezleri.json";
import { ilCoz, katla } from "@/lib/iller";

type Nokta = [number, number];

const ILLER = veri.iller as unknown as Record<string, Nokta>;
const ILCELER = veri.ilceler as unknown as Record<string, Record<string, Nokta>>;

// İl → (katlanmış ilçe adı → koordinat)
const ILCE_ANAHTARLARI = new Map<string, Map<string, Nokta>>(
  Object.entries(ILCELER).map(([il, ilceler]) => [
    il,
    new Map(Object.entries(ilceler).map(([ad, k]) => [katla(ad), k])),
  ])
);

export type BaslangicKonumu = {
  /** [boylam, enlem] */
  nokta: Nokta;
  seviye: "ilce" | "il";
};

export function baslangicKonumu(sehir: string | null | undefined, ilce: string | null | undefined): BaslangicKonumu | null {
  const il = ilCoz(sehir);
  if (!il) return null;
  const ilceNoktasi = ilce ? ILCE_ANAHTARLARI.get(il)?.get(katla(ilce)) : undefined;
  if (ilceNoktasi) return { nokta: ilceNoktasi, seviye: "ilce" };
  const ilNoktasi = ILLER[il];
  return ilNoktasi ? { nokta: ilNoktasi, seviye: "il" } : null;
}
