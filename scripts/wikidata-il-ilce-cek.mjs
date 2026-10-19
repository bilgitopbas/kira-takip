// TEK SEFERLİK araç: Wikidata'dan Türkiye il ve ilçe merkez koordinatlarını
// çekip lib/veri/il-ilce-merkezleri.json dosyasını üretir. Build'de ÇALIŞMAZ;
// yalnız veri yenilenmek istenirse elle çalıştırılır:
//   node scripts/wikidata-il-ilce-cek.mjs
//
// Kaynak: Wikidata (https://www.wikidata.org), lisans CC0 1.0 (kamu malı).
// Yalnız idari birim adı ve koordinat alınır; kişisel veri yoktur.
// Kullanım: yeni paneldeki harita pininin BAŞLANGIÇ noktası. Kesin konum
// değildir; mülk sahibi pini sürükleyip doğrular.
//
// İl koordinatı: ilin merkezi (P36, il merkezi şehir) koordinatı; yoksa ilin
// kendi koordinatı. İlçe: Wikidata'da "Türkiye ilçesi" (Q1147395) olan,
// sona ermemiş öğeler. Wikidata'da bazı eski/çift ilçe öğeleri bulunabilir;
// eşleşmeyen ilçe için il merkezine düşülür.
import fs from "node:fs";
import path from "node:path";
const UC = "https://query.wikidata.org/sparql";
const UA = "MizanMulkPanel/1.0 (tek seferlik idari birim koordinat cekimi)";

const IL_SORGUSU = `SELECT ?il ?ilLabel ?koord ?bkoord WHERE {
  ?il wdt:P31 wd:Q48336 .
  FILTER NOT EXISTS { ?il wdt:P576 ?bitis . }
  OPTIONAL { ?il wdt:P625 ?koord . }
  OPTIONAL { ?il wdt:P36 ?baskent . ?baskent wdt:P625 ?bkoord . }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "tr". }
}`;

const ILCE_SORGUSU = `SELECT ?ilce ?ilceLabel ?ilLabel ?koord WHERE {
  ?ilce wdt:P31 wd:Q1147395 .
  FILTER NOT EXISTS { ?ilce wdt:P576 ?bitis . }
  ?ilce wdt:P131 ?il . ?il wdt:P31 wd:Q48336 .
  OPTIONAL { ?ilce wdt:P625 ?koord . }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "tr". }
}`;

async function sorgula(sorgu) {
  const url = `${UC}?query=${encodeURIComponent(sorgu)}`;
  const yanit = await fetch(url, { headers: { Accept: "application/sparql-results+json", "User-Agent": UA } });
  if (!yanit.ok) throw new Error(`Wikidata ${yanit.status}`);
  return (await yanit.json()).results.bindings;
}

/** "Point(32.48 37.87)" → [32.48, 37.87] (4 ondalık ≈ 11 m) */
function nokta(deger) {
  const m = /^Point\(([-\d.]+) ([-\d.]+)\)$/.exec(deger ?? "");
  if (!m) return null;
  return [Number(Number(m[1]).toFixed(4)), Number(Number(m[2]).toFixed(4))];
}

// 81 il listesiyle birebir eşleme için lib/iller.ts'deki adlar kullanılır.
const ILLER_KAYNAK = fs.readFileSync(path.join(process.cwd(), "lib", "iller.ts"), "utf8");
const ILLER_DIZISI = ILLER_KAYNAK.slice(ILLER_KAYNAK.indexOf("export const ILLER = ["), ILLER_KAYNAK.indexOf("] as const"));
const ILLER = [...ILLER_DIZISI.matchAll(/"([^"]+)"/g)].map((m) => m[1]);
if (ILLER.length !== 81) throw new Error("lib/iller.ts'den 81 il okunamadı");

const ilSatirlari = await sorgula(IL_SORGUSU);
const ilceSatirlari = await sorgula(ILCE_SORGUSU);

const iller = {};
for (const ad of ILLER) {
  const satirlar = ilSatirlari.filter((s) => s.ilLabel.value === ad);
  const merkez = satirlar.map((s) => nokta(s.bkoord?.value)).find(Boolean) ?? satirlar.map((s) => nokta(s.koord?.value)).find(Boolean);
  if (!merkez) throw new Error(`İl koordinatı yok: ${ad}`);
  iller[ad] = merkez;
}

// Wikidata etiketleri tutarsız: "Akşehir (ilçe)", "Altınekin ilçesi",
// "Wikimedia yineleme sayfası" gibi. Ekler atılır, anlam ayrımı sayfaları ve
// il merkezine 2,5 dereceden (~250 km) uzak (yanlış ile bağlanmış) öğeler
// elenir; aynı ad iki kez gelirse ilki kalır.
function ilceAdiTemizle(ad) {
  return ad
    .replace(/\s*\([^)]*\)\s*/g, " ")
    .replace(/\s+(ilçesi|İlçesi|ilçe|İlçe)$/u, "")
    .replace(/\s+/g, " ")
    .trim();
}
const AZAMI_UZAKLIK = 2.5;
const ilceler = {};
const sayac = { etiketsiz: 0, koordsuz: 0, anlamAyrimi: 0, uzak: 0, cift: 0 };
// Bilinen Wikidata etiket sapmaları → resmî ilçe adı ("il/etiket" anahtarıyla).
// Her kayıt elle doğrulandı (gerekçe yanında).
const ETIKET_DUZELTME = {
  // Q14329111: Türkçe etiket "Selçuklular", İngilizce etiket "Selçuklu" (Konya merkez ilçesi)
  "Konya/Selçuklular": "Selçuklu",
};

// Aynı ilçe öğesinde birden fazla koordinat olabiliyor (ör. ilçe merkezi +
// alan ortası). Belirlenimci olmak için il merkezine en yakın olanı seçilir.
const adaylar = new Map();
for (const s of ilceSatirlari) {
  const il = s.ilLabel.value;
  if (!iller[il]) continue;
  const k = nokta(s.koord?.value);
  const kayit = adaylar.get(s.ilce.value) ?? { il, etiket: s.ilceLabel.value, noktalar: [] };
  if (k) kayit.noktalar.push(k);
  adaylar.set(s.ilce.value, kayit);
}
const uzaklik = (k, il) => Math.hypot(k[0] - iller[il][0], k[1] - iller[il][1]);
for (const { il, etiket, noktalar } of adaylar.values()) {
  if (noktalar.length === 0) { sayac.koordsuz++; continue; }
  if (/^Q\d+$/.test(etiket)) { sayac.etiketsiz++; continue; }
  if (/wikimedia|anlam ayrımı/i.test(etiket)) { sayac.anlamAyrimi++; continue; }
  const k = [...noktalar].sort((a, b) => uzaklik(a, il) - uzaklik(b, il))[0];
  if (uzaklik(k, il) > AZAMI_UZAKLIK) { sayac.uzak++; continue; }
  const temiz = ilceAdiTemizle(etiket);
  const ad = ETIKET_DUZELTME[`${il}/${temiz}`] ?? temiz;
  ilceler[il] ??= {};
  if (ilceler[il][ad]) { sayac.cift++; continue; }
  ilceler[il][ad] = k;
}
for (const il of Object.keys(ilceler)) {
  ilceler[il] = Object.fromEntries(Object.entries(ilceler[il]).sort(([a], [b]) => a.localeCompare(b, "tr")));
}

const cikti = {
  _kaynak: "Wikidata (https://www.wikidata.org) — SPARQL, scripts/wikidata-il-ilce-cek.mjs",
  _lisans: "CC0 1.0 (kamu malı). Yalnız idari birim adı ve koordinat; kişisel veri yok.",
  _sorguTarihi: new Date().toISOString().slice(0, 10),
  _not: "Koordinatlar [boylam, enlem]. Harita pininin başlangıç noktasıdır, kesin konum değildir.",
  iller,
  ilceler,
};

const hedef = path.join(process.cwd(), "lib", "veri", "il-ilce-merkezleri.json");
fs.mkdirSync(path.dirname(hedef), { recursive: true });
fs.writeFileSync(hedef, JSON.stringify(cikti) + "\n");
const ilceSayisi = Object.values(ilceler).reduce((t, x) => t + Object.keys(x).length, 0);
console.log(`yazıldı: ${path.relative(process.cwd(), hedef)} · ${fs.statSync(hedef).size} bayt · 81 il · ${ilceSayisi} ilçe · elenen ${JSON.stringify(sayac)}`);
