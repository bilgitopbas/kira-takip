// Mülk başlık/adres metninden bina, blok ve birim (daire) numarası çıkarımı.
// SAF işlev: veritabanına, ağa ya da zamana bakmaz; aynı girdi hep aynı sonucu
// verir. Sonuç yalnız ÖNERİDİR — kalıcı bina kaydı "Binalarım" ekranında
// mülk sahibinin onayıyla yapılır ve her zaman elle düzeltilebilir.
//
// Desteklenen yazımlar (gerçek kayıtlardan):
//   "Beştepe A No:48"                       → BEŞTEPE · A · 48
//   "ÇAKIROĞLU A-BLOK NO:14"                → ÇAKIROĞLU · A · 14
//   "Beştepe 2A No:10"                      → BEŞTEPE · A · 10   (düşük güven)
//   "BEŞTEPE 2A BLOK NO : 5"                → BEŞTEPE · A · 5    (düşük güven)
//   "BEŞTEPE 2A / 75"                       → BEŞTEPE · A · 75   (düşük güven)
//   "BEŞTEPE 31.SK. BİNA NO 2A KAPI NO :28" → BEŞTEPE · A · 28   (düşük güven)
//   "KONYA DORUK SAN. 1M-1N"                → eşleşmez, tek başına bina
//
// "2A" kuralı: rakam + tek harf biçimindeki blok yazımı harfe indirgenir
// (kullanıcı teyidi, 19 Eki 2026: Beştepe Plaza'da yalnız A ve B blok var;
// "2A" ayrı blok değildir). Bu çıkarım "dusuk" güvenle işaretlenir ve
// eşleme ekranında "kontrol edin" diye gösterilir.
import { ilCoz, katla, type Il } from "@/lib/iller";

export type Guven = "yuksek" | "dusuk";

export type BinaCozumu = {
  /** Aynı binadaki mülkleri gruplayan anahtar (il + katlanmış bina adı) */
  binaAnahtari: string;
  /** Görüntülenecek bina adı, ör. "Beştepe" */
  binaAdi: string;
  /** Blok harfi (A, B…) ya da yok */
  blok: string | null;
  /** Birim/daire numarası metni, ör. "48", "12B" */
  birimNo: string | null;
  guven: Guven;
  /** Çözüm hangi alandan geldi; "yok" = eşleşmedi, mülk tek başına bina */
  kaynak: "baslik" | "adres" | "yok";
  il: Il | null;
};

const HARF = "A-ZÇĞİÖŞÜ";

/** Türkçe-duyarlı büyük harf + boşluk sadeleştirme */
export function buyukHarf(metin: string): string {
  return metin.toLocaleUpperCase("tr-TR").replace(/\s+/g, " ").trim();
}

/** "BEŞTEPE" → "Beştepe", "ÇAKIROĞLU APT." → "Çakıroğlu Apt." */
export function basHarfBuyuk(metin: string): string {
  return metin
    .toLocaleLowerCase("tr-TR")
    .split(" ")
    .map((k) => (k ? k.charAt(0).toLocaleUpperCase("tr-TR") + k.slice(1) : k))
    .join(" ");
}

type Parca = { ad: string; blok: string | null; birimNo: string | null; guven: Guven };

// Birim numarası kalıpları; öncelik sırasıyla denenir.
const DAIRE_KALIPLARI = [
  // "KAPI NO :28", "DAİRE 5", "DAİRE NO:5"
  new RegExp(`(?:KAPI\\s*NO|DA[İI]RE(?:\\s*NO)?)\\s*[:.]?\\s*(\\d+[${HARF}]?)\\b`),
  // "D:5", "D.5" — ayraç ZORUNLU ("D100 Karayolu" daire sanılmasın)
  new RegExp(`\\bD\\s*[:.]\\s*(\\d+[${HARF}]?)\\b`),
];
const NO_KALIBI = new RegExp(`\\bNO\\s*[:.]?\\s*(\\d+[${HARF}]?)\\b`);
const EGIK_KALIBI = /\/\s*(\d+)\s*$/;

function sonEslesme(re: RegExp, metin: string): RegExpExecArray | null {
  const genel = new RegExp(re.source, "g");
  let son: RegExpExecArray | null = null;
  let m: RegExpExecArray | null;
  while ((m = genel.exec(metin))) son = m;
  return son;
}

function kes(metin: string, m: RegExpExecArray): string {
  return (metin.slice(0, m.index) + " " + metin.slice(m.index + m[0].length)).replace(/\s+/g, " ").trim();
}

/** "2A" → { blok: "A", dusuk }, "A" → { blok: "A", yuksek } */
function blokNormalle(ham: string): { blok: string; guven: Guven } {
  const m = new RegExp(`^\\d+([${HARF}])$`).exec(ham);
  if (m) return { blok: m[1], guven: "dusuk" };
  return { blok: ham, guven: "yuksek" };
}

// Bina adından atılan sokak/cadde/mahalle parçaları ve artık işaretler
const GURULTU = [
  /\b\d+\s*\.?\s*(?:SK|SOK|SOKAK|CD|CAD|CADDE|CADDESİ|BLV|BULVAR|BULVARI)\b\.?/g,
  /\b(?:SK|SOK|SOKAK|CD|CAD|CADDE|CADDESİ|MAH|MAHALLE|MAHALLESİ)\b\.?/g,
  /\bB[İI]NA\s*NO\b/g,
  /\bNO\b/g,
  /[:/,]+/g,
  /\s-\s|\s-$|^-\s/g,
];

function adiTemizle(metin: string): string {
  let s = metin;
  for (const re of GURULTU) s = s.replace(re, " ");
  return s.replace(/\s+/g, " ").replace(/^[\s.\-]+|[\s.\-]+$/g, "").trim();
}

/** Tek bir metinden (başlık ya da adres) çözüm; eşleşmezse null. */
export function metinCoz(hamMetin: string): Parca | null {
  let s = buyukHarf(hamMetin);
  if (!s) return null;

  // 1) Birim numarası
  let birimNo: string | null = null;
  let m: RegExpExecArray | null = null;
  for (const re of DAIRE_KALIPLARI) {
    m = sonEslesme(re, s);
    if (m) break;
  }
  if (!m) m = sonEslesme(NO_KALIBI, s);
  if (!m) m = EGIK_KALIBI.exec(s);
  if (m) {
    birimNo = m[1];
    s = kes(s, m);
  }

  // 2) Blok: "A BLOK", "A-BLOK", "BLOK A", "BİNA NO 2A", ya da sondaki tek harf / rakam+harf
  let blok: string | null = null;
  let guven: Guven = "yuksek";
  let acikBlok = false;
  const blokKaliplari = [
    new RegExp(`\\b(\\d*[${HARF}])\\s*-?\\s*BLOK\\b`),
    new RegExp(`\\bBLOK\\s*[:.]?\\s*(\\d*[${HARF}])\\b`),
    new RegExp(`\\bB[İI]NA\\s*NO\\s*[:.]?\\s*(\\d*[${HARF}])\\b`),
  ];
  for (const re of blokKaliplari) {
    const b = re.exec(s);
    if (b) {
      ({ blok, guven } = blokNormalle(b[1]));
      s = kes(s, b);
      acikBlok = true;
      break;
    }
  }
  if (!blok && birimNo) {
    // Sondaki tek başına blok işareti yalnız birim numarası varsa aranır;
    // "1M-1N" gibi kodlar yanlışlıkla blok sanılmasın.
    const b = new RegExp(`(?:^|\\s)(\\d{0,2}[${HARF}])$`).exec(s);
    if (b && s.slice(0, b.index).trim()) {
      ({ blok, guven } = blokNormalle(b[1]));
      s = s.slice(0, b.index).trim();
    }
  }

  // Birim numarası ya da açık "BLOK" yoksa çok birimli bina sayılmaz.
  if (!birimNo && !acikBlok) return null;

  const ad = adiTemizle(s);
  if (!ad) return null;
  return { ad, blok, birimNo, guven };
}

/**
 * Bir mülkün bina çözümü. Önce başlık, olmazsa adres denenir. İkisi de
 * eşleşmezse mülk kendi başına bir "bina" sayılır (anahtarı mülk kimliği).
 */
export function binaCoz(mulk: { id: string; title: string; address?: string | null; city?: string | null }): BinaCozumu {
  const il = ilCoz(mulk.city);
  const ilAnahtari = il ? katla(il) : "-";

  const basliktan = metinCoz(mulk.title);
  const adresten = basliktan ? null : mulk.address ? metinCoz(mulk.address) : null;
  const parca = basliktan ?? adresten;

  if (!parca) {
    return {
      binaAnahtari: `tek:${mulk.id}`,
      binaAdi: mulk.title.trim(),
      blok: null,
      birimNo: null,
      guven: "yuksek",
      kaynak: "yok",
      il,
    };
  }

  return {
    binaAnahtari: `${ilAnahtari}|${katla(parca.ad)}`,
    binaAdi: basHarfBuyuk(parca.ad),
    blok: parca.blok,
    birimNo: parca.birimNo,
    guven: parca.guven,
    kaynak: basliktan ? "baslik" : "adres",
    il,
  };
}

export type GrupluBina<T> = {
  anahtar: string;
  ad: string;
  il: Il | null;
  /** Blok adı → birimler; bloksuz birimler "" anahtarında */
  bloklar: { ad: string; birimler: (T & { cozum: BinaCozumu })[] }[];
  birimSayisi: number;
  /** En az bir birimin çözümü düşük güvenli ("kontrol edin") */
  kontrolGerekli: boolean;
};

function noKarsilastir(a: string | null, b: string | null) {
  if (a === b) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return a.localeCompare(b, "tr", { numeric: true });
}

/** Mülkleri binalara ve bloklara gruplar (bina adı A→Z, blok A→Z, daire no artan). */
export function binalaraGrupla<T extends { id: string; title: string; address?: string | null; city?: string | null }>(
  mulkler: T[]
): GrupluBina<T>[] {
  const harita = new Map<string, GrupluBina<T>>();
  for (const mulk of mulkler) {
    const cozum = binaCoz(mulk);
    let bina = harita.get(cozum.binaAnahtari);
    if (!bina) {
      bina = { anahtar: cozum.binaAnahtari, ad: cozum.binaAdi, il: cozum.il, bloklar: [], birimSayisi: 0, kontrolGerekli: false };
      harita.set(cozum.binaAnahtari, bina);
    }
    const blokAdi = cozum.blok ?? "";
    let blok = bina.bloklar.find((b) => b.ad === blokAdi);
    if (!blok) {
      blok = { ad: blokAdi, birimler: [] };
      bina.bloklar.push(blok);
    }
    blok.birimler.push({ ...mulk, cozum });
    bina.birimSayisi++;
    if (cozum.guven === "dusuk") bina.kontrolGerekli = true;
  }

  const sonuc = [...harita.values()];
  for (const b of sonuc) {
    b.bloklar.sort((x, y) => (x.ad === "" ? 1 : y.ad === "" ? -1 : x.ad.localeCompare(y.ad, "tr")));
    for (const bl of b.bloklar) bl.birimler.sort((x, y) => noKarsilastir(x.cozum.birimNo, y.cozum.birimNo));
  }
  return sonuc.sort((a, b) => a.ad.localeCompare(b.ad, "tr"));
}
