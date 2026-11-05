// Ana sayfa (/) hareketli grafikleri ve giriş videosu üstündeki bina etiketleri
// için saf yardımcılar. DOM'a dokunmaz; testleri tests/anasayfaGrafik.test.ts.

export type Nokta = [number, number];

/** Noktalardan yumuşak (yatay teğetli kübik) SVG yolu üretir. */
export function egriYolu(noktalar: Nokta[]): string {
  if (noktalar.length === 0) return "";
  const [x0, y0] = noktalar[0];
  let d = `M${yuvarla(x0)},${yuvarla(y0)}`;
  for (let i = 1; i < noktalar.length; i++) {
    const [ax, ay] = noktalar[i - 1];
    const [bx, by] = noktalar[i];
    const cx = yuvarla((ax + bx) / 2);
    d += ` C${cx},${yuvarla(ay)} ${cx},${yuvarla(by)} ${yuvarla(bx)},${yuvarla(by)}`;
  }
  return d;
}

/** Değerleri [0,genislik]×[0,yukseklik] alanına yerleştirir; büyük değer yukarıda. */
export function olcekle(degerler: number[], genislik: number, yukseklik: number, min: number, max: number): Nokta[] {
  const aralik = max - min || 1;
  const adim = degerler.length > 1 ? genislik / (degerler.length - 1) : 0;
  return degerler.map((v, i) => [i * adim, yukseklik - ((v - min) / aralik) * yukseklik]);
}

/** Türkçe sayı biçimi: 1,62 · 5.000 */
export function trSayi(n: number, ondalik = 0): string {
  return n.toLocaleString("tr-TR", { minimumFractionDigits: ondalik, maximumFractionDigits: ondalik });
}

/** Sayaç için yumuşak yavaşlayan ilerleme (0→1). */
export function yavaslayan(p: number): number {
  if (p <= 0) return 0;
  if (p >= 1) return 1;
  return 1 - Math.pow(2, -10 * p);
}

/** Her çalıştırmada aynı diziyi veren rastgele üreteç (sunucu/istemci aynı çizer). */
export function tohumluRastgele(tohum: number): () => number {
  let t = tohum | 0;
  return () => {
    t = (t + 0x6d2b79f5) | 0;
    let x = Math.imul(t ^ (t >>> 15), 1 | t);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * object-fit: cover ile yerleşen videoda, video karesindeki 0–1 konumunun
 * kaptaki piksel karşılığı. konumX/konumY: object-position (0–1).
 */
export function kapakEsle(
  video: { g: number; y: number },
  kap: { g: number; y: number },
  konumX: number,
  konumY: number,
) {
  const olcek = Math.max(kap.g / video.g, kap.y / video.y);
  const g = video.g * olcek;
  const y = video.y * olcek;
  const ox = (kap.g - g) * konumX;
  const oy = (kap.y - y) * konumY;
  return (nx: number, ny: number): Nokta => [ox + nx * g, oy + ny * y];
}

/** Kayıttaki etiket izi: 0–1000 tamsayı x,y; görünmüyorsa null. */
export type EtiketKaresi = ([number, number] | null)[];

/** Video zamanına göre iki iz karesi arasında konum enterpolasyonu (döngüsel). */
export function etiketKonumu(kareler: EtiketKaresi[], fps: number, saniye: number, i: number): Nokta | null {
  const n = kareler.length;
  if (n === 0) return null;
  const f = (((saniye * fps) % n) + n) % n;
  const a = Math.floor(f);
  const b = (a + 1) % n;
  const pa = kareler[a][i];
  const pb = kareler[b][i];
  if (!pa || !pb) return null;
  const t = f - a;
  return [(pa[0] + (pb[0] - pa[0]) * t) / 1000, (pa[1] + (pb[1] - pa[1]) * t) / 1000];
}

export type Kutu = { l: number; t: number; r: number; b: number };

export function kesisir(a: Kutu, b: Kutu): boolean {
  return a.l < b.r && a.r > b.l && a.t < b.b && a.b > b.t;
}

function yuvarla(n: number): number {
  return Math.round(n * 10) / 10;
}
