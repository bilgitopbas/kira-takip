// Yeni panelin istemci tarafı bina görünüm modeli: PanelBirimi listesinden
// bina → blok → birim ağacı ve özet sayılar. SAF; Prisma içe aktarmaz.
import type { BirimDurumu, PanelBirimi } from "@/lib/yeniPanelTipleri";

export const DURUM_SIRASI: BirimDurumu[] = ["gecikmis", "bekliyor", "odendi", "bos"];

export const DURUM_ETIKETI: Record<BirimDurumu, string> = {
  odendi: "Ödendi",
  bekliyor: "Bekliyor",
  gecikmis: "Gecikmiş",
  bos: "Boş",
};

export type Ozet = {
  n: number;
  sayac: Record<BirimDurumu, number>;
  /** Oturan kiracısı olan birim */
  dolu: number;
  /** Dolu birimlerin girilmiş aylık kira toplamı */
  aylikKira: number;
  gecikmisBorc: number;
  /** En kötü durum (ikon rengi) */
  enKotu: BirimDurumu;
  borcKaydiYok: number;
};

export function ozetle(birimler: PanelBirimi[]): Ozet {
  const sayac: Record<BirimDurumu, number> = { odendi: 0, bekliyor: 0, gecikmis: 0, bos: 0 };
  let dolu = 0;
  let aylikKira = 0;
  let gecikmisBorc = 0;
  let borcKaydiYok = 0;
  for (const b of birimler) {
    sayac[b.durum]++;
    if (b.kiraci) {
      dolu++;
      aylikKira += b.kiraci.monthlyRent ?? 0;
    }
    gecikmisBorc += b.gecikmisBorc;
    if (b.borcKaydiYok) borcKaydiYok++;
  }
  const enKotu = DURUM_SIRASI.find((d) => sayac[d] > 0) ?? "bos";
  return { n: birimler.length, sayac, dolu, aylikKira, gecikmisBorc, enKotu, borcKaydiYok };
}

export type BinaBlogu = { ad: string; birimler: PanelBirimi[] };

export type Bina = {
  anahtar: string;
  ad: string;
  il: string | null;
  ilce: string | null;
  adres: string;
  /** En çok görülen mülk tipi (ikon için) */
  tip: string | null;
  /** Adlandırılmış bloklar (A, B…); bloksuz birimler `bloksuz`da */
  bloklar: BinaBlogu[];
  bloksuz: PanelBirimi[];
  birimler: PanelBirimi[];
  kontrolGerekli: boolean;
  /** Binalarım'da kaydedilmiş bina kimliği; öneriyse null */
  binaId: string | null;
  /** Kayıtlı konum (varsa) */
  konum: { lat: number; lng: number; dogrulandi: boolean } | null;
  /** Mülk kendi başına (eşleşmedi ya da tek birim) */
  tekBirim: boolean;
};

function enSik<T>(dizi: (T | null)[]): T | null {
  const say = new Map<T, number>();
  for (const x of dizi) if (x !== null) say.set(x, (say.get(x) ?? 0) + 1);
  let en: T | null = null;
  let max = 0;
  for (const [x, n] of say) if (n > max) [en, max] = [x, n];
  return en;
}

export function noKarsilastir(a: PanelBirimi, b: PanelBirimi) {
  const x = a.bina.birimNo;
  const y = b.bina.birimNo;
  if (x === y) return a.title.localeCompare(b.title, "tr", { numeric: true });
  if (x === null) return 1;
  if (y === null) return -1;
  return x.localeCompare(y, "tr", { numeric: true });
}

export function binalariKur(birimler: PanelBirimi[]): Bina[] {
  const harita = new Map<string, PanelBirimi[]>();
  for (const b of birimler) {
    const liste = harita.get(b.bina.anahtar) ?? [];
    liste.push(b);
    harita.set(b.bina.anahtar, liste);
  }

  const binalar: Bina[] = [];
  for (const [anahtar, liste] of harita) {
    const sirali = [...liste].sort(noKarsilastir);
    const blokMap = new Map<string, PanelBirimi[]>();
    const bloksuz: PanelBirimi[] = [];
    for (const b of sirali) {
      if (b.bina.blok) blokMap.set(b.bina.blok, [...(blokMap.get(b.bina.blok) ?? []), b]);
      else bloksuz.push(b);
    }
    const ilk = sirali[0];
    binalar.push({
      anahtar,
      ad: ilk.bina.ad,
      il: enSik(sirali.map((b) => b.il)),
      ilce: enSik(sirali.map((b) => (b.district?.trim() ? b.district.trim() : null))),
      adres: ilk.address,
      tip: enSik(sirali.map((b) => b.propertyType)),
      bloklar: [...blokMap.entries()]
        .sort(([a], [b]) => a.localeCompare(b, "tr"))
        .map(([ad, b]) => ({ ad, birimler: b })),
      bloksuz,
      birimler: sirali,
      kontrolGerekli: sirali.some((b) => b.bina.guven === "dusuk"),
      binaId: ilk.bina.binaId ?? null,
      konum: sirali.find((b) => b.bina.konum)?.bina.konum ?? null,
      tekBirim: sirali.length === 1,
    });
  }
  return binalar.sort((a, b) => a.ad.localeCompare(b.ad, "tr"));
}

export type BirimSiralama = "no" | "gec" | "kira";

export function birimleriSirala(birimler: PanelBirimi[], siralama: BirimSiralama): PanelBirimi[] {
  const kopya = [...birimler];
  if (siralama === "gec") {
    return kopya.sort(
      (a, b) =>
        DURUM_SIRASI.indexOf(a.durum) - DURUM_SIRASI.indexOf(b.durum) ||
        b.gecikmisBorc - a.gecikmisBorc ||
        noKarsilastir(a, b)
    );
  }
  if (siralama === "kira") {
    return kopya.sort((a, b) => (b.kiraci?.monthlyRent ?? -1) - (a.kiraci?.monthlyRent ?? -1) || noKarsilastir(a, b));
  }
  return kopya.sort(noKarsilastir);
}

/** Türkçe-duyarlı arama anahtarı */
export function aramaAnahtari(metin: string) {
  return metin.toLocaleLowerCase("tr-TR").replace(/\s+/g, " ").trim();
}

/** Birim içinde arama: daire no ya da kiracı adı (ve başlık) */
export function birimEslesir(b: PanelBirimi, sorgu: string) {
  const q = aramaAnahtari(sorgu);
  if (!q) return true;
  return aramaAnahtari(`${b.bina.birimNo ?? ""} ${b.kiraci?.fullName ?? ""} ${b.title}`).includes(q);
}

/** Bina listesinde arama: ad, adres, ilçe, birim başlıkları, kiracı adları */
export function binaEslesir(bina: Bina, sorgu: string) {
  const q = aramaAnahtari(sorgu);
  if (!q) return true;
  const metin = [bina.ad, bina.adres, bina.ilce ?? "", ...bina.birimler.map((b) => `${b.title} ${b.kiraci?.fullName ?? ""}`)].join(" ");
  return aramaAnahtari(metin).includes(q);
}

/** Birim satırının alt satırı ve kart rozeti metni */
export function durumMetni(b: PanelBirimi): string {
  if (b.durum === "bos") return "Boş · kiracı yok";
  if (b.durum === "gecikmis") return `Gecikmiş · ${b.gecikmeGun} gün`;
  if (b.durum === "odendi") return "Ödendi";
  if (b.borcKaydiYok) return "Bu ay borç kaydı yok";
  return b.buAyVade ? `Bekliyor · vade ${b.buAyVade.split("-").reverse().join(".")}` : "Bekliyor";
}

/** Harita/3D için mülk tipi ailesi (önizleme v6'daki dört ikon) */
export type TipAilesi = "ofis" | "konut" | "fabrika" | "avm";
export function tipAilesi(tip: string | null): TipAilesi {
  if (tip === "OFIS") return "ofis";
  if (tip === "FABRIKA" || tip === "DEPO") return "fabrika";
  if (tip === "AVM") return "avm";
  return "konut";
}

/** Konum kartı çipleri: durum (en az bir birimi o durumda) ve tip ailesi süzgeci */
export function binaSuzgectenGecer(bina: Bina, durum: BirimDurumu | "", tipler: TipAilesi[]): boolean {
  if (durum && !bina.birimler.some((b) => b.durum === durum)) return false;
  if (tipler.length && !tipler.includes(tipAilesi(bina.tip))) return false;
  return true;
}
