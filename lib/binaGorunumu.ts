// Binanın 3D görünümü — mülk sahibinin seçimi (Building.gorunum). Boş (null)
// = "Otomatik": mülk tipi ve birim sayısından seçilir (sehir3dModeli.aileSec).
import type { Aile } from "@/lib/sehir3dModeli";

export type Gorunum = "villa" | "mustakil" | "apt" | "ofis" | "plaza" | "avm" | "fabrika" | "arsa";

export const GORUNUMLER: { deger: Gorunum; ad: string; aciklama: string }[] = [
  { deger: "villa", ad: "Villa", aciklama: "Bahçeli, iki katlı" },
  { deger: "mustakil", ad: "Müstakil ev", aciklama: "Küçük, kiremit çatılı" },
  { deger: "apt", ad: "Apartman", aciklama: "Katlar birim sayısına göre" },
  { deger: "ofis", ad: "İş hanı / küçük ofis", aciklama: "Tabelalı ofis binası" },
  { deger: "plaza", ad: "Plaza / gökdelen", aciklama: "Blok başına bir kule (en çok 4)" },
  { deger: "avm", ad: "AVM / dükkân", aciklama: "Geniş, otoparklı" },
  { deger: "fabrika", ad: "Fabrika / depo", aciklama: "Testere çatı, baca" },
  { deger: "arsa", ad: "Arsa", aciklama: "Çevrili boş parsel" },
];

const DEGERLER = new Set<string>(GORUNUMLER.map((g) => g.deger));

/** Gelen değer geçerli görünüm mü; "" / null = Otomatik (null) */
export function gorunumCoz(v: unknown): Gorunum | null | undefined {
  if (v === undefined) return undefined;
  if (v === null || v === "") return null;
  return typeof v === "string" && DEGERLER.has(v) ? (v as Gorunum) : undefined;
}

/** Seçili görünümün 3D ailesi (ofis: tek birim küçük ofis, çok birim iş hanı) */
export function gorunumdenAile(g: Gorunum, birimSayisi: number): Aile {
  if (g === "ofis") return birimSayisi <= 1 ? "kucukofis" : "han";
  return g;
}

export const gorunumAdi = (g: Gorunum | null | undefined) => GORUNUMLER.find((x) => x.deger === g)?.ad ?? "Otomatik";
