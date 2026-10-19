// Konum haritasının saf modeli: bina konumları ve il/ilçe kümeleri.
// Veritabanında henüz koordinat yok (F aşamasında şema ekiyle gelecek); bu
// yüzden her binanın konumu ilçe merkezinden, yoksa il merkezinden TÜRETİLİR
// ve "konum doğrulanmadı" sayılır. Mülk sahibinin bu oturumda sürükleyerek
// verdiği konum `duzeltmeler` ile gelir (kalıcı kayıt F'de).
import { baslangicKonumu } from "@/lib/konumMerkezi";
import { katla } from "@/lib/iller";
import { ozetle, type Bina, type Ozet } from "@/lib/yeniPanelBina";
import type { BirimDurumu } from "@/lib/yeniPanelTipleri";

export type Nokta = [number, number];

export type BinaKonumu = {
  anahtar: string;
  nokta: Nokta;
  /** Konum nereden geldi */
  kaynak: "ilce" | "il" | "duzeltildi" | "kayit";
  /** Kayıtlı/doğrulanmış koordinat yok (D aşamasında her zaman true) */
  dogrulanmadi: boolean;
  il: string;
  ilce: string | null;
  ozet: Ozet;
};

export type HaritaSeviyesi = "il" | "ilce" | "pin";

/** Lider kuralı: zoom < 11 il, 11–13 ilçe, sonrası tek tek pin */
export function haritaSeviyesi(zoom: number): HaritaSeviyesi {
  if (zoom < 11) return "il";
  if (zoom < 13) return "ilce";
  return "pin";
}

// Aynı merkeze düşen binalar üst üste binmesin: merkez çevresinde halka.
const HALKA_ADIMI = 0.0035; // ≈ 300-400 m

function yay(index: number): Nokta {
  if (index === 0) return [0, 0];
  // 1. halka 6, 2. halka 12, … nokta
  let halka = 1;
  let kalan = index - 1;
  while (kalan >= halka * 6) {
    kalan -= halka * 6;
    halka++;
  }
  const aci = (2 * Math.PI * kalan) / (halka * 6);
  return [Math.cos(aci) * HALKA_ADIMI * halka, Math.sin(aci) * HALKA_ADIMI * halka * 0.8];
}

/**
 * Haritaya konabilen binaların konumu. İli bilinmeyen bina haritaya konamaz
 * (`konumsuz` listesinde döner).
 */
export function binaKonumlari(
  binalar: Bina[],
  duzeltmeler: Record<string, Nokta> = {}
): { konumlar: BinaKonumu[]; konumsuz: Bina[] } {
  const konumlar: BinaKonumu[] = [];
  const konumsuz: Bina[] = [];
  const merkezSayaci = new Map<string, number>();

  for (const b of binalar) {
    if (!b.il) {
      konumsuz.push(b);
      continue;
    }
    const ozet = ozetle(b.birimler);
    const elle = duzeltmeler[b.anahtar];
    if (elle) {
      konumlar.push({ anahtar: b.anahtar, nokta: elle, kaynak: "duzeltildi", dogrulanmadi: true, il: b.il, ilce: b.ilce, ozet });
      continue;
    }
    if (b.konum) {
      konumlar.push({ anahtar: b.anahtar, nokta: [b.konum.lng, b.konum.lat], kaynak: "kayit", dogrulanmadi: !b.konum.dogrulandi, il: b.il, ilce: b.ilce, ozet });
      continue;
    }
    const bas = baslangicKonumu(b.il, b.ilce);
    if (!bas) {
      konumsuz.push(b);
      continue;
    }
    const anahtar = bas.nokta.join(",");
    const sira = merkezSayaci.get(anahtar) ?? 0;
    merkezSayaci.set(anahtar, sira + 1);
    const [dx, dy] = yay(sira);
    konumlar.push({
      anahtar: b.anahtar,
      nokta: [bas.nokta[0] + dx, bas.nokta[1] + dy],
      kaynak: bas.seviye,
      dogrulanmadi: true,
      il: b.il,
      ilce: b.ilce,
      ozet,
    });
  }
  return { konumlar, konumsuz };
}

export type Kume = {
  anahtar: string;
  ad: string;
  nokta: Nokta;
  binalar: string[];
  binaSayisi: number;
  birimSayisi: number;
  gecikmis: number;
  enKotu: BirimDurumu;
};

const SIRA: BirimDurumu[] = ["gecikmis", "bekliyor", "odendi", "bos"];

/**
 * Seviyeye göre kümeler; tek binalık grup kümelenmez (pin olarak kalır).
 * `haric` (seçili bina) hiçbir kümeye girmez.
 */
export function kumele(konumlar: BinaKonumu[], seviye: HaritaSeviyesi, haric: string | null): { kumeler: Kume[]; kumedekiler: Set<string> } {
  const kumedekiler = new Set<string>();
  if (seviye === "pin") return { kumeler: [], kumedekiler };

  const gruplar = new Map<string, BinaKonumu[]>();
  for (const k of konumlar) {
    if (k.anahtar === haric) continue;
    const g = seviye === "il" ? k.il : `${k.il}|${k.ilce ? katla(k.ilce) : "-"}`;
    gruplar.set(g, [...(gruplar.get(g) ?? []), k]);
  }

  const kumeler: Kume[] = [];
  for (const [anahtar, liste] of gruplar) {
    if (liste.length < 2) continue;
    let x = 0;
    let y = 0;
    let birim = 0;
    let gecikmis = 0;
    let enKotu: BirimDurumu = "bos";
    for (const k of liste) {
      kumedekiler.add(k.anahtar);
      x += k.nokta[0];
      y += k.nokta[1];
      birim += k.ozet.n;
      gecikmis += k.ozet.sayac.gecikmis;
      if (SIRA.indexOf(k.ozet.enKotu) < SIRA.indexOf(enKotu)) enKotu = k.ozet.enKotu;
    }
    const ilk = liste[0];
    kumeler.push({
      anahtar,
      ad: seviye === "il" ? ilk.il : ilk.ilce ?? ilk.il,
      nokta: [x / liste.length, y / liste.length],
      binalar: liste.map((k) => k.anahtar),
      binaSayisi: liste.length,
      birimSayisi: birim,
      gecikmis,
      enKotu,
    });
  }
  return { kumeler, kumedekiler };
}

/** Noktaları kapsayan sınır kutusu [[minX,minY],[maxX,maxY]]; tek nokta için küçük pay bırakılır */
export function sinirKutusu(noktalar: Nokta[]): [Nokta, Nokta] | null {
  if (noktalar.length === 0) return null;
  let [x0, y0] = noktalar[0];
  let [x1, y1] = noktalar[0];
  for (const [x, y] of noktalar) {
    x0 = Math.min(x0, x);
    y0 = Math.min(y0, y);
    x1 = Math.max(x1, x);
    y1 = Math.max(y1, y);
  }
  const px = Math.max(0, 0.012 - (x1 - x0) / 2);
  const py = Math.max(0, 0.009 - (y1 - y0) / 2);
  return [
    [x0 - px, y0 - py],
    [x1 + px, y1 + py],
  ];
}
