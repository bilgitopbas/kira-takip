// "Binalarım" eşleme ekranının başlangıç modeli — SAF.
// Kayıtlı binalar olduğu gibi gelir; bir binaya bağlanmamış mülkler başlık/
// adres eşlemesinden (lib/binaEslestir.ts) ÖNERİ grupları olarak gelir.
// Düşük güvenli ("2A" gibi) öneriler en üstte "kontrol edin" ile gösterilir.
import { binaCoz } from "@/lib/binaEslestir";
import { ilCoz, ILLER } from "@/lib/iller";
import type { KayitBinasi } from "@/lib/binalarimKayit";

export type BMulk = {
  id: string;
  title: string;
  address: string;
  city: string | null;
  district: string | null;
  propertyType: string | null;
  buildingId: string | null;
  block: string | null;
  unitNo: string | null;
};
export type BBina = {
  id: string;
  name: string;
  city: string | null;
  district: string | null;
  lat: number | null;
  lng: number | null;
  locationVerified: boolean;
};

export type EBirim = { propertyId: string; title: string; blok: string; daireNo: string; kontrol: boolean };
export type EGrup = {
  /** Ekran anahtarı: kayıtlı "b:<id>", öneri "o:<eşleme anahtarı>", yeni "y:<n>" */
  anahtar: string;
  id: string | null;
  ad: string;
  il: string;
  ilce: string;
  konum: { lat: number; lng: number; dogrulandi: boolean } | null;
  birimler: EBirim[];
  /** Öneri mi (henüz kaydedilmemiş) */
  oneri: boolean;
  /** Kayda girecek mi: kayıtlılar her zaman; öneriler onaylanınca ya da düzenlenince */
  onayli: boolean;
};

const ILLER_KUMESI = new Set<string>(ILLER);

function enSik(dizi: (string | null)[]): string {
  const say = new Map<string, number>();
  for (const x of dizi) if (x && x.trim()) say.set(x.trim(), (say.get(x.trim()) ?? 0) + 1);
  let en = "";
  let max = 0;
  for (const [x, n] of say) if (n > max) [en, max] = [x, n];
  return en;
}

const noSirasi = (a: EBirim, b: EBirim) =>
  a.blok.localeCompare(b.blok, "tr") || a.daireNo.localeCompare(b.daireNo, "tr", { numeric: true }) || a.title.localeCompare(b.title, "tr");

export function baslangicGruplari(mulkler: BMulk[], binalar: BBina[]): EGrup[] {
  const kayitli = new Map<string, EGrup>(
    binalar.map((b) => [
      b.id,
      {
        anahtar: `b:${b.id}`,
        id: b.id,
        ad: b.name,
        il: b.city && ILLER_KUMESI.has(b.city) ? b.city : "",
        ilce: b.district ?? "",
        konum: b.lat !== null && b.lng !== null ? { lat: b.lat, lng: b.lng, dogrulandi: b.locationVerified } : null,
        birimler: [],
        oneri: false,
        onayli: true,
      },
    ])
  );
  const oneriler = new Map<string, { grup: EGrup; ilceler: (string | null)[] }>();

  for (const m of mulkler) {
    const k = m.buildingId ? kayitli.get(m.buildingId) : undefined;
    if (k) {
      k.birimler.push({ propertyId: m.id, title: m.title, blok: m.block ?? "", daireNo: m.unitNo ?? "", kontrol: false });
      continue;
    }
    const c = binaCoz(m);
    let o = oneriler.get(c.binaAnahtari);
    if (!o) {
      o = {
        grup: { anahtar: `o:${c.binaAnahtari}`, id: null, ad: c.binaAdi, il: c.il ?? ilCoz(m.city) ?? "", ilce: "", konum: null, birimler: [], oneri: true, onayli: false },
        ilceler: [],
      };
      oneriler.set(c.binaAnahtari, o);
    }
    o.ilceler.push(m.district);
    o.grup.birimler.push({ propertyId: m.id, title: m.title, blok: c.blok ?? "", daireNo: c.birimNo ?? "", kontrol: c.guven === "dusuk" });
  }

  const oneriGruplari = [...oneriler.values()].map(({ grup, ilceler }) => ({ ...grup, ilce: enSik(ilceler) }));
  const kontrolVar = (g: EGrup) => g.birimler.some((b) => b.kontrol);
  const tum = [...oneriGruplari, ...[...kayitli.values()].filter((g) => g.birimler.length > 0)];
  for (const g of tum) g.birimler.sort(noSirasi);
  return tum.sort(
    (a, b) =>
      Number(kontrolVar(b)) - Number(kontrolVar(a)) ||
      Number(b.oneri) - Number(a.oneri) ||
      Number(b.birimler.length > 1) - Number(a.birimler.length > 1) ||
      a.ad.localeCompare(b.ad, "tr")
  );
}

/** Ekrandaki gruplardan kayıt gövdesi: yalnız onaylı ve birimi olan gruplar */
export function kayitGovdesi(gruplar: EGrup[]): { binalar: KayitBinasi[] } {
  return {
    binalar: gruplar
      .filter((g) => g.onayli && g.birimler.length > 0)
      .map((g) => ({
        id: g.id,
        ad: g.ad,
        il: g.il || null,
        ilce: g.ilce || null,
        konum: g.konum,
        birimler: g.birimler.map((b) => ({ propertyId: b.propertyId, blok: b.blok || null, daireNo: b.daireNo || null })),
      })),
  };
}
