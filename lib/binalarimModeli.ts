// "Binalarım" eşleme ekranının başlangıç modeli — SAF.
// Kayıtlı binalar olduğu gibi gelir; bir binaya bağlanmamış mülkler başlık/
// adres eşlemesinden (lib/binaEslestir.ts) ÖNERİ grupları olarak gelir.
// Düşük güvenli ("2A" gibi) öneriler en üstte "kontrol edin" ile gösterilir.
import { binaAnahtariOlustur, binaCoz } from "@/lib/binaEslestir";
import { ilCoz, ILLER, katla } from "@/lib/iller";
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

export type EBirim = {
  propertyId: string;
  title: string;
  blok: string;
  daireNo: string;
  kontrol: boolean;
  /** Kayıtlı binaya yalnız ad + il eşleşmesiyle önerildi (kaydedince bağlanır) */
  yeniOneri?: boolean;
};
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
  // Kayıtlı binalar il + ad anahtarıyla: bağlanmamış mülkün önerisi aynı
  // ildeki aynı adlı kayıtlı binaya denk gelirse oraya önerilir.
  const kayitliAnahtarla = new Map<string, EGrup>(binalar.map((b) => [binaAnahtariOlustur(b.city, b.name), kayitli.get(b.id)!]));

  for (const m of mulkler) {
    const k = m.buildingId ? kayitli.get(m.buildingId) : undefined;
    if (k) {
      k.birimler.push({ propertyId: m.id, title: m.title, blok: m.block ?? "", daireNo: m.unitNo ?? "", kontrol: false });
      continue;
    }
    const c = binaCoz(m);
    const esKayitli = kayitliAnahtarla.get(c.binaAnahtari);
    if (esKayitli) {
      esKayitli.birimler.push({ propertyId: m.id, title: m.title, blok: c.blok ?? "", daireNo: c.birimNo ?? "", kontrol: c.guven === "dusuk", yeniOneri: true });
      continue;
    }
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
  const kontrolVar = (g: EGrup) => g.birimler.some((b) => b.kontrol || b.yeniOneri) || !g.il;
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

export type IlUyarisi = {
  /** İl seçilmemiş: haritada gösterilmez */
  ilYok: boolean;
  /** Aynı bina adı başka il(ler)de daha çok birimle var: il yanlış girilmiş olabilir */
  digerIller: { il: string; birim: number }[];
};

/** Grup başına il uyarıları (ör. "Beştepe" Konya'da 2, Ankara'da 49 birim) */
export function ilUyarilari(gruplar: EGrup[]): Map<string, IlUyarisi> {
  const adaGore = new Map<string, EGrup[]>();
  for (const g of gruplar) {
    const k = katla(g.ad);
    if (!k) continue;
    adaGore.set(k, [...(adaGore.get(k) ?? []), g]);
  }
  const sonuc = new Map<string, IlUyarisi>();
  for (const g of gruplar) {
    const digerIller = (adaGore.get(katla(g.ad)) ?? [])
      .filter((x) => x.anahtar !== g.anahtar && x.il && x.il !== g.il && x.birimler.length >= g.birimler.length)
      .map((x) => ({ il: x.il, birim: x.birimler.length }));
    if (!g.il || digerIller.length) sonuc.set(g.anahtar, { ilYok: !g.il, digerIller });
  }
  return sonuc;
}

/**
 * "Yeniden eşle": bir grubun birimlerini mülklerin GÜNCEL başlık/adres/il
 * bilgisinden yeniden önerir (ör. il düzeltildikten sonra). Birimler kendi
 * önerisine (aynı ildeki aynı adlı kayıtlı bina, mevcut öneri grubu ya da
 * yeni öneri grubu) taşınır; blok/daire no da yeniden hesaplanır. Boşalan
 * grup listeden düşer (kayıtlı ise kaydedince silinir).
 */
export function yenidenEsle(gruplar: EGrup[], anahtar: string, mulkler: BMulk[]): EGrup[] {
  const kaynak = gruplar.find((g) => g.anahtar === anahtar);
  if (!kaynak) return gruplar;
  const mulkHaritasi = new Map(mulkler.map((m) => [m.id, m]));
  let liste = gruplar.map((g) => (g.anahtar === anahtar ? { ...g, birimler: [] as EBirim[], onayli: true } : g));
  for (const b of kaynak.birimler) {
    const m = mulkHaritasi.get(b.propertyId);
    if (!m) continue;
    const c = binaCoz(m);
    const birim: EBirim = { propertyId: m.id, title: m.title, blok: c.blok ?? "", daireNo: c.birimNo ?? "", kontrol: c.guven === "dusuk" };
    const il = c.il ?? "";
    const hedef =
      liste.find((g) => g.id && binaAnahtariOlustur(g.il, g.ad) === c.binaAnahtari) ??
      liste.find((g) => g.anahtar === `o:${c.binaAnahtari}`);
    if (hedef) {
      liste = liste.map((g) => (g === hedef ? { ...g, birimler: [...g.birimler, birim], onayli: true } : g));
    } else {
      liste = [
        { anahtar: `o:${c.binaAnahtari}`, id: null, ad: c.binaAdi, il, ilce: m.district?.trim() ?? "", konum: null, birimler: [birim], oneri: true, onayli: true },
        ...liste,
      ];
    }
  }
  return liste.filter((g) => g.birimler.length > 0).map((g) => ({ ...g, birimler: [...g.birimler].sort(noSirasi) }));
}
