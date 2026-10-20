// Mülk Şehrim 3D'nin SAF modeli: her binanın görsel ailesi (plaza, han,
// apartman…), ölçüleri ve "pencere = birim" ızgarası; şehir ızgarası
// yerleşimi. three.js içe aktarmaz; test edilebilir.
//
// Aile seçimi (önizleme v6 aileleri, gerçek veriden):
//  - AVM → avm · FABRIKA/DEPO → fabrika · ARSA → arsa (çevrili boş parsel)
//  - 2+ blok ya da çok birimli bina → plaza (blok başına bir kule, en çok 4)
//  - Ofis: 1 birim küçük ofis, 2–20 birim iş hanı
//  - Konut (ve tipi girilmemiş): 1 birim villa/müstakil, 2–24 birim apartman
import type { Bina } from "@/lib/yeniPanelBina";
import { ILLER, plakaKodu, type Il } from "@/lib/iller";
import { gorunumdenAile } from "@/lib/binaGorunumu";
import type { BirimDurumu, PanelBirimi } from "@/lib/yeniPanelTipleri";

export type Aile = "plaza" | "han" | "kucukofis" | "apt" | "villa" | "mustakil" | "avm" | "fabrika" | "arsa";

export type Hucre = { id: string; durum: BirimDurumu } | null;

export type Kule = {
  /** Blok adı ("A", "B"); tek kuleli plazada "" */
  ad: string;
  /** [kat][sıra] — alttan üste */
  izgara: Hucre[][];
};

export type SehirBinasi = {
  anahtar: string;
  ad: string;
  aile: Aile;
  /** Gövde genişlik/derinlik (m) */
  w: number;
  d: number;
  /** Parsel içinde kaydırma */
  off: [number, number];
  /** Kat sayısı (plazada kule kat sayısı) */
  katlar: number;
  /** Kat başına birim */
  kat_basi: number;
  /** Plaza kuleleri (blok başına) */
  kuleler: Kule[];
  /** Plaza dışı ailelerde [kat][sıra] */
  izgara: Hucre[][];
  /** Tüm birimler (tek birimli ailelerde pencereler bunlara dağıtılır) */
  birimler: { id: string; durum: BirimDurumu }[];
  cati: "kiremit" | "duz";
  renk: { duvar: string; susleme: string; taban: string; korkuluk: string };
  /** 0..1 tohum (çeşitlilik için, anahtardan) */
  tohum: number;
  /** İl plaka kodu ("06"); il bilinmiyorsa null — "Tüm iller"de etikette gösterilir */
  plaka: string | null;
};

const DUVARLAR = ["#d9c9a8", "#b9785a", "#cfd4cf", "#e2d2b4", "#e4d5b7", "#b26a4e"];
const KORKULUK = ["#56606a", "#9fc0c6", "#56606a", "#7b8a7a"];

/** Anahtardan 0..1 arası kararlı sayı (FNV-1a) */
export function tohum(metin: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < metin.length; i++) {
    h ^= metin.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0) / 4294967296;
}

function hucre(b: PanelBirimi): Hucre {
  return { id: b.id, durum: b.durum };
}

/** Birimleri alttan üste katlara diz: [kat][sıra] */
export function izgaraKur(birimler: PanelBirimi[], katBasi: number, katlar: number): Hucre[][] {
  const izgara: Hucre[][] = [];
  for (let k = 0; k < katlar; k++) {
    const sira: Hucre[] = [];
    for (let s = 0; s < katBasi; s++) {
      const b = birimler[k * katBasi + s];
      sira.push(b ? hucre(b) : null);
    }
    izgara.push(sira);
  }
  return izgara;
}

const sinirla = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));

function plazaKatBasi(kuleSayisi: number, enCokBirim: number) {
  const tavan = kuleSayisi >= 4 ? 3 : kuleSayisi === 3 ? 4 : 5;
  const istenen = enCokBirim <= 12 ? 3 : enCokBirim <= 30 ? 4 : 5;
  return Math.min(tavan, istenen);
}

/** Plaza kule genişliği (insa kodu aynı formülü kullanır) */
export function kuleGenisligi(katBasi: number) {
  const ws = katBasi >= 5 ? 2.5 : 2.3;
  return katBasi * ws + 0.9;
}

export function aileSec(bina: Bina): Aile {
  const n = bina.birimler.length;
  // Mülk sahibi görünümü seçtiyse o (ör. "Towerpark Sitesi" → plaza)
  if (bina.gorunum) return gorunumdenAile(bina.gorunum, n);
  const tip = bina.tip;
  if (tip === "AVM") return "avm";
  if (tip === "FABRIKA" || tip === "DEPO") return "fabrika";
  // Arsa: bina yok; çevrili boş parsel + küçük tabela
  if (tip === "ARSA") return "arsa";
  // Ad ipucu: "Towerpark Sitesi", "Adalet Plaza", "… Rezidans", "… Kuleleri" → gökdelen
  if (/tower|plaza|rezidans|residence|(^|\s)kule/i.test(bina.ad)) return "plaza";
  if (bina.bloklar.length >= 2) return "plaza";
  if (tip === "OFIS") {
    if (n <= 1) return "kucukofis";
    return n <= 20 ? "han" : "plaza";
  }
  if (n <= 1) return tohum(bina.anahtar) < 0.5 ? "villa" : "mustakil";
  return n <= 24 ? "apt" : "plaza";
}

export function sehirBinasi(bina: Bina): SehirBinasi {
  const aile = aileSec(bina);
  const t = tohum(bina.anahtar);
  const birimler = bina.birimler.map(hucre).filter((h): h is NonNullable<Hucre> => !!h);
  const temel: Omit<SehirBinasi, "aile" | "w" | "d" | "off" | "katlar" | "kat_basi" | "kuleler" | "izgara"> = {
    anahtar: bina.anahtar,
    ad: bina.ad,
    birimler,
    cati: t < 0.5 ? "kiremit" : "duz",
    renk: {
      duvar: DUVARLAR[Math.floor(t * DUVARLAR.length) % DUVARLAR.length],
      susleme: "#f1ece2",
      taban: "#8f887b",
      korkuluk: KORKULUK[Math.floor(t * 97) % KORKULUK.length],
    },
    tohum: t,
    plaka: bina.il && (ILLER as readonly string[]).includes(bina.il) ? String(plakaKodu(bina.il as Il)).padStart(2, "0") : null,
  };

  switch (aile) {
    case "plaza": {
      // 2–4 blok: blok başına kule; daha fazlası ya da bloksuz: tek kule
      const gruplar =
        bina.bloklar.length >= 2 && bina.bloklar.length <= 4
          ? bina.bloklar.map((b) => ({ ad: b.ad, birimler: b.birimler }))
          : [{ ad: "", birimler: bina.birimler }];
      const enCok = Math.max(...gruplar.map((g) => g.birimler.length));
      const katBasi = plazaKatBasi(gruplar.length, enCok);
      const katlar = sinirla(Math.ceil(enCok / katBasi), 3, 30);
      const tw = kuleGenisligi(katBasi);
      const w = Math.min(38, gruplar.length * tw + (gruplar.length - 1) * 2.4 + 1.4 + (gruplar.length === 1 ? 6 : 0));
      return {
        ...temel,
        aile,
        w,
        d: 17,
        off: [0, -2],
        katlar,
        kat_basi: katBasi,
        kuleler: gruplar.map((g) => ({ ad: g.ad, izgara: izgaraKur(g.birimler, katBasi, katlar) })),
        izgara: [],
      };
    }
    case "han": {
      const katlar = Math.max(2, Math.ceil(bina.birimler.length / 2));
      return { ...temel, aile, w: 15, d: 12, off: [0, 0], katlar, kat_basi: 2, kuleler: [], izgara: izgaraKur(bina.birimler, 2, katlar) };
    }
    case "apt": {
      const katlar = Math.max(2, Math.ceil(bina.birimler.length / 2));
      return { ...temel, aile, w: 16.2, d: 11, off: [0, 0], katlar, kat_basi: 2, kuleler: [], izgara: izgaraKur(bina.birimler, 2, katlar) };
    }
    case "avm": {
      const katlar = sinirla(Math.ceil(bina.birimler.length / 10), 2, 4);
      return { ...temel, aile, w: 34, d: 18, off: [0, -7.5], katlar, kat_basi: 10, kuleler: [], izgara: izgaraKur(bina.birimler, 10, katlar) };
    }
    case "fabrika":
      return { ...temel, aile, w: 26, d: 16, off: [-2, -3], katlar: 1, kat_basi: 1, kuleler: [], izgara: [] };
    case "kucukofis":
      return { ...temel, aile, w: 11, d: 10, off: [0, -2], katlar: 3, kat_basi: 1, kuleler: [], izgara: [] };
    case "villa":
      return { ...temel, aile, w: 12, d: 10, off: [2, -5], katlar: 2, kat_basi: 1, kuleler: [], izgara: [] };
    case "arsa":
      return { ...temel, aile, w: 26, d: 22, off: [0, 0], katlar: 0, kat_basi: 1, kuleler: [], izgara: [] };
    case "mustakil":
      return { ...temel, aile, w: 9, d: 8, off: [-3, -3], katlar: 2, kat_basi: 1, kuleler: [], izgara: [] };
  }
}

/**
 * Şehir ızgarası: N bina → GX sütun × GZ satır, yalnız ilk N hücre dolu
 * (boş arsa yok). Hücre i → [i % GX, floor(i / GX)].
 */
export function izgaraYerlesimi(n: number): { gx: number; gz: number; hucreler: [number, number][] } {
  const N = Math.max(1, n);
  const gx = Math.ceil(Math.sqrt(N));
  const gz = Math.ceil(N / gx);
  const hucreler: [number, number][] = [];
  for (let i = 0; i < n; i++) hucreler.push([i % gx, Math.floor(i / gx)]);
  return { gx, gz, hucreler };
}

/** Binada gecikmiş birim var mı ("Yalnız gecikmiş" çipi) */
export function gecikmeVar(b: SehirBinasi) {
  return b.birimler.some((u) => u.durum === "gecikmis");
}

/** Fabrika bacası tütüyor mu: içinde en az bir dolu birim varsa (önizleme v6 kuralı) */
export function bacaTutuyor(b: SehirBinasi) {
  return b.birimler.some((u) => u.durum !== "bos");
}

/** Duman bulutu yerleşimi: p = 0 baca ağzı, p = 1 izin ucu (yukarı ve rüzgâr yönüne açılır) */
export function dumanBulutu(p: number): { dx: number; dy: number; dz: number; olcek: number } {
  return { dx: p * 7, dy: p * 11, dz: -p * 3, olcek: 0.35 + p * 1.7 };
}

/** Sürekli çizimde i. bulutun t (ms) anındaki konumu; her bulut ~6,25 sn'de bir döner */
export function dumanEvresi(t: number, i: number, n = 7) {
  return (((t * 0.00016 + i / n) % 1) + 1) % 1;
}

/** Seçili birim pencere parlaması: sürekli çizimde 0,25–0,60 arası nabız; sabitte 0,45 */
export function parlamaKatsayisi(t: number | null) {
  return t === null ? 0.45 : 0.25 + 0.35 * (0.5 + 0.5 * Math.sin(t * 0.006));
}
