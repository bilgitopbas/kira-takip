// Mülk Şehrim 3D: kullanıcının binaları ızgarada taşıdığı düzen — SAF.
// Düzen il başına tutulur ("*" = tüm iller): bina anahtarı → [sütun, satır].
// Kayıtlı düzen yoksa ya da bir bina için kayıt yoksa varsayılan sıra
// (izgaraYerlesimi) kullanılır; böylece düzensiz görünüm eskisiyle aynıdır.
import { izgaraYerlesimi } from "@/lib/sehir3dModeli";

export type Hucre = [number, number];
export type Duzen = Record<string, Hucre>;

export const DUZEN_SINIRI = { bina: 2000, anahtar: 160, il: 40 };

/** N bina için ızgara kenarı en çok N + 2 hücre olabilir (boş hücreler bırakma hedefi) */
export const kenarSiniri = (n: number) => Math.max(1, n) + 2;

const tamsayiMi = (v: unknown): v is number => typeof v === "number" && Number.isInteger(v);

/** Binaların hücreleri (anahtarlar sırasıyla). Geçersiz/çakışan kayıtlar varsayılana düşer. */
export function yerlesimCoz(anahtarlar: string[], duzen: Duzen | null | undefined): Hucre[] {
  const n = anahtarlar.length;
  const S = kenarSiniri(n);
  const sonuc: (Hucre | null)[] = new Array(n).fill(null);
  const dolu = new Set<string>();
  if (duzen) {
    anahtarlar.forEach((k, i) => {
      const h = duzen[k];
      if (!Array.isArray(h) || !tamsayiMi(h[0]) || !tamsayiMi(h[1])) return;
      if (h[0] < 0 || h[1] < 0 || h[0] >= S || h[1] >= S) return;
      const a = `${h[0]},${h[1]}`;
      if (dolu.has(a)) return;
      dolu.add(a);
      sonuc[i] = [h[0], h[1]];
    });
  }
  const varsayilan = izgaraYerlesimi(n).hucreler;
  let v = 0;
  let tarama = 0;
  for (let i = 0; i < n; i++) {
    if (sonuc[i]) continue;
    let h: Hucre | null = null;
    while (v < varsayilan.length && !h) {
      const c = varsayilan[v++];
      if (!dolu.has(`${c[0]},${c[1]}`)) h = c;
    }
    while (!h) {
      const c: Hucre = [tarama % S, Math.floor(tarama / S)];
      tarama++;
      if (!dolu.has(`${c[0]},${c[1]}`)) h = c;
    }
    dolu.add(`${h[0]},${h[1]}`);
    sonuc[i] = h;
  }
  return sonuc as Hucre[];
}

type Kutu = { minI: number; maxI: number; minJ: number; maxJ: number };
function kutu(hucreler: Hucre[]): Kutu {
  let minI = Infinity, maxI = -Infinity, minJ = Infinity, maxJ = -Infinity;
  for (const [i, j] of hucreler) {
    minI = Math.min(minI, i);
    maxI = Math.max(maxI, i);
    minJ = Math.min(minJ, j);
    maxJ = Math.max(maxJ, j);
  }
  return { minI, maxI, minJ, maxJ };
}

/**
 * Bırakma hedefi geçerli mi: dolu alanın bir halka dışına kadar ve kenar
 * sınırını aşmadan. Dolu hücreye bırakmak yer değiştirmedir (geçerli).
 */
export function hedefGecerli(hucreler: Hucre[], tasinan: number, hedef: Hucre): boolean {
  if (!tamsayiMi(hedef[0]) || !tamsayiMi(hedef[1])) return false;
  const k = kutu(hucreler);
  if (hedef[0] < k.minI - 1 || hedef[0] > k.maxI + 1 || hedef[1] < k.minJ - 1 || hedef[1] > k.maxJ + 1) return false;
  const S = kenarSiniri(hucreler.length);
  const sonra = hucreler.map((h, i) => (i === tasinan ? hedef : h));
  const s = kutu(sonra);
  return s.maxI - s.minI + 1 <= S && s.maxJ - s.minJ + 1 <= S;
}

/** Boş bırakma hedefleri: dolu alanın bir halka genişletilmişi içindeki boş hücreler */
export function bosHedefler(hucreler: Hucre[], tasinan: number): Hucre[] {
  if (hucreler.length === 0) return [];
  const k = kutu(hucreler);
  const dolu = new Set(hucreler.map(([i, j]) => `${i},${j}`));
  const sonuc: Hucre[] = [];
  for (let j = k.minJ - 1; j <= k.maxJ + 1; j++) {
    for (let i = k.minI - 1; i <= k.maxI + 1; i++) {
      if (dolu.has(`${i},${j}`)) continue;
      if (hedefGecerli(hucreler, tasinan, [i, j])) sonuc.push([i, j]);
    }
  }
  return sonuc;
}

/**
 * Binayı hedef hücreye taşı (doluysa yer değiştir). Dönen düzen TÜM binaları
 * içerir ve sol üst köşe (0,0) olacak şekilde kaydırılır.
 */
export function tasi(anahtarlar: string[], hucreler: Hucre[], tasinan: number, hedef: Hucre): Duzen | null {
  if (tasinan < 0 || tasinan >= hucreler.length || !hedefGecerli(hucreler, tasinan, hedef)) return null;
  const yeni = hucreler.map((h) => [h[0], h[1]] as Hucre);
  const kaynak = yeni[tasinan];
  const diger = yeni.findIndex((h, i) => i !== tasinan && h[0] === hedef[0] && h[1] === hedef[1]);
  if (diger >= 0) yeni[diger] = [kaynak[0], kaynak[1]];
  yeni[tasinan] = [hedef[0], hedef[1]];
  const k = kutu(yeni);
  const duzen: Duzen = {};
  anahtarlar.forEach((a, i) => (duzen[a] = [yeni[i][0] - k.minI, yeni[i][1] - k.minJ]));
  return duzen;
}

/** Sunucu ucu için doğrulama (PUT gövdesi) */
export function duzenDogrula(govde: unknown): { ok: true; il: string; duzen: Duzen } | { ok: false; hata: string } {
  const g = govde as Record<string, unknown>;
  const il = typeof g?.il === "string" ? g.il.trim() : "";
  if (!il || il.length > DUZEN_SINIRI.il) return { ok: false, hata: "Geçersiz il." };
  const ham = g.duzen;
  if (!ham || typeof ham !== "object" || Array.isArray(ham)) return { ok: false, hata: "Geçersiz düzen." };
  const girdiler = Object.entries(ham as Record<string, unknown>);
  if (girdiler.length > DUZEN_SINIRI.bina) return { ok: false, hata: "Çok fazla bina." };
  const S = kenarSiniri(girdiler.length);
  const duzen: Duzen = {};
  const dolu = new Set<string>();
  for (const [k, v] of girdiler) {
    if (!k || k.length > DUZEN_SINIRI.anahtar || /[\u0000-\u001f]/.test(k)) return { ok: false, hata: "Geçersiz bina anahtarı." };
    if (!Array.isArray(v) || v.length !== 2 || !tamsayiMi(v[0]) || !tamsayiMi(v[1]) || v[0] < 0 || v[1] < 0 || v[0] >= S || v[1] >= S) {
      return { ok: false, hata: "Geçersiz hücre." };
    }
    const a = `${v[0]},${v[1]}`;
    if (dolu.has(a)) return { ok: false, hata: "İki bina aynı hücrede olamaz." };
    dolu.add(a);
    duzen[k] = [v[0], v[1]];
  }
  return { ok: true, il, duzen };
}

/** Etiketteki kısa ad: uzun adlarda ilk kelime (ör. "Çakıroğlu İş Merkezi" → "Çakıroğlu") */
export function kisaAd(ad: string): string {
  const t = ad.trim();
  if (t.length <= 14) return t;
  const ilk = t.split(/\s+/)[0];
  return ilk.length <= 16 ? ilk : `${ilk.slice(0, 14)}…`;
}
