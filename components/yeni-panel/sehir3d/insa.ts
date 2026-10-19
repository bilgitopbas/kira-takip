// Mülk Şehrim 3D — prosedürel bina inşası (three.js).
// Önizleme v6'daki aileler (plaza, han, küçük ofis, apartman, villa, müstakil,
// AVM, fabrika) Next/TS'ye uyarlanarak yeniden yazıldı.
//
// Tüm statik geometri iki birleşik ağda toplanır (köşe renkleri; doku yok):
// binalar (soluklaştırılabilir) ve zemin/yol. Pencereler tek örneklenmiş ağdır;
// her pencere bir birime bağlıdır ve rengi birimin durumundan gelir.
// Tabelalar küçük canvas dokusudur (metin canvas'a çizilir; HTML'e girmez).
import * as THREE from "three";
import { izgaraYerlesimi, type Hucre, type SehirBinasi } from "@/lib/sehir3dModeli";
import type { BirimDurumu } from "@/lib/yeniPanelTipleri";

export const GY = 0.22;
export const ARALIK = 52; // hücre aralığı
const BS = 40; // blok (kaldırım dahil)
const PARSEL = 34;

export type Kutu = { x: number; z: number; w: number; d: number; ust: number };
export type BinaBilgisi = Kutu & { idx: number; bx: number; bz: number; bloklar: Record<string, Kutu> };
export type PencereBilgisi = { birim: string | null; bina: string; blok: string | null; idx: number; durum: BirimDurumu | null };
export type VurusKutusu = { x: number; y: number; z: number; w: number; h: number; d: number; bina: string; blok: string | null };
type Tabela = { mesh: THREE.Mesh; idx: number };

export type Sehir = {
  binaAgi: THREE.Mesh;
  zeminAgi: THREE.Mesh;
  pencereAgi: THREE.InstancedMesh;
  tabelalar: Tabela[];
  pencereler: PencereBilgisi[];
  birimPencereleri: Map<string, number[]>;
  binalar: Map<string, BinaBilgisi>;
  vuruslar: VurusKutusu[];
  /** Kamera hedefi ve sınırları */
  merkez: [number, number];
  sinirX: number;
  sinirZ: number;
  olcek: number;
  gx: number;
  binaSayisi: number;
  /** Soluklaştırma dokusu (bina sırası → 0..255) */
  solukDoku: THREE.DataTexture;
  temizle: () => void;
};

/* ---------- geometri birikimi ---------- */
const _m = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _s = new THREE.Vector3();
const _p = new THREE.Vector3();
const _e = new THREE.Euler();
const _v = new THREE.Vector3();
const _n = new THREE.Vector3();
const _nm = new THREE.Matrix3();
const _c = new THREE.Color();

function duz(g: THREE.BufferGeometry) {
  const r = g.index ? g.toNonIndexed() : g;
  r.computeVertexNormals();
  return r;
}

class Birikim {
  p: number[] = [];
  n: number[] = [];
  c: number[] = [];
  b: number[] = [];
  ekle(g: THREE.BufferGeometry, x: number, y: number, z: number, sx: number, sy: number, sz: number, renk: string, bid: number, rx = 0, ry = 0, rz = 0) {
    _e.set(rx, ry, rz);
    _q.setFromEuler(_e);
    _m.compose(_p.set(x, y, z), _q, _s.set(sx, sy, sz));
    _nm.getNormalMatrix(_m);
    _c.set(renk);
    const P = g.attributes.position;
    const N = g.attributes.normal;
    for (let i = 0; i < P.count; i++) {
      _v.fromBufferAttribute(P, i).applyMatrix4(_m);
      this.p.push(_v.x, _v.y, _v.z);
      _n.fromBufferAttribute(N, i).applyMatrix3(_nm).normalize();
      this.n.push(_n.x, _n.y, _n.z);
      this.c.push(_c.r, _c.g, _c.b);
      this.b.push(bid);
    }
  }
  ag(mat: THREE.Material) {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(this.p, 3));
    g.setAttribute("normal", new THREE.Float32BufferAttribute(this.n, 3));
    g.setAttribute("color", new THREE.Float32BufferAttribute(this.c, 3));
    g.setAttribute("aBid", new THREE.Float32BufferAttribute(this.b, 1));
    g.computeBoundingSphere();
    return new THREE.Mesh(g, mat);
  }
}

/** Mulberry32 — her bina aynı tohumla hep aynı ayrıntıları üretir */
function tohumlu(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function kalcaCati(w: number, d: number, h: number) {
  const a = w / 2;
  const b = d / 2;
  const r = Math.max(0, (w - d) / 2);
  const A = [-a, 0, b], B = [a, 0, b], C = [a, 0, -b], D = [-a, 0, -b], R1 = [-r, h, 0], R2 = [r, h, 0];
  const ucgen = [A, B, R2, A, R2, R1, C, D, R1, C, R1, R2, D, A, R1, B, C, R2];
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(ucgen.flat(), 3));
  g.computeVertexNormals();
  return g;
}

function tabelaDokusu(metin: string, zemin: string, yazi: string, oran: number) {
  const H = 128;
  const Wd = Math.min(1024, Math.round(H * oran));
  const c = document.createElement("canvas");
  c.width = Wd;
  c.height = H;
  const g = c.getContext("2d")!;
  g.fillStyle = zemin;
  g.fillRect(0, 0, Wd, H);
  g.strokeStyle = "rgba(255,255,255,.18)";
  g.lineWidth = 6;
  g.strokeRect(3, 3, Wd - 6, H - 6);
  let fs = H * 0.56;
  const font = (s: number) => `700 ${s}px "Segoe UI", Inter, Arial, sans-serif`;
  g.font = font(fs);
  while (g.measureText(metin).width > Wd * 0.9 && fs > 10) {
    fs -= 2;
    g.font = font(fs);
  }
  g.fillStyle = yazi;
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText(metin, Wd / 2, H / 2 + fs * 0.05);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

/* ---------- inşaatçı ---------- */
class Insaatci {
  // Şablon geometriler (inşa sonunda dispose edilir)
  T_BOX = new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0).toNonIndexed();
  T_BOXC = new THREE.BoxGeometry(1, 1, 1).toNonIndexed();
  T_CYL = new THREE.CylinderGeometry(1, 1, 1, 12, 1).translate(0, 0.5, 0).toNonIndexed();
  T_CYL6 = new THREE.CylinderGeometry(1, 1, 1, 6, 1).translate(0, 0.5, 0).toNonIndexed();
  T_CONE = new THREE.CylinderGeometry(0.55, 1, 1, 12, 1).translate(0, 0.5, 0).toNonIndexed();
  T_ICO = duz(new THREE.IcosahedronGeometry(1, 1));
  T_SAW = (() => {
    const s = new THREE.Shape();
    s.moveTo(0, 0);
    s.lineTo(1, 0);
    s.lineTo(1, 1);
    s.lineTo(0, 0);
    const g = new THREE.ExtrudeGeometry(s, { depth: 1, bevelEnabled: false });
    g.translate(0, 0, -0.5);
    return duz(g);
  })();
  T_GABLE = (() => {
    const s = new THREE.Shape();
    s.moveTo(-0.5, 0);
    s.lineTo(0.5, 0);
    s.lineTo(0, 1);
    s.lineTo(-0.5, 0);
    const g = new THREE.ExtrudeGeometry(s, { depth: 1, bevelEnabled: false });
    g.translate(0, 0, -0.5);
    return duz(g);
  })();
  gecici: THREE.BufferGeometry[] = [];

  accB = new Birikim();
  accG = new Birikim();
  pencereler: (PencereBilgisi & { x: number; y: number; z: number; w: number; h: number; ry: number })[] = [];
  vuruslar: VurusKutusu[] = [];
  tabelalar: Tabela[] = [];
  agaclar: [number, number, number, number, number][] = [];
  lambalar: [number, number, number][] = [];
  binalar = new Map<string, BinaBilgisi>();

  // Şu an inşa edilen bina bağlamı
  OX = 0;
  OZ = 0;
  CW = 0;
  CD = 0;
  CK = "";
  CBLK: string | null = null;
  BID = -1;
  rnd: () => number = Math.random;
  b!: SehirBinasi;

  bx(x: number, y: number, z: number, w: number, h: number, d: number, renk: string, ry = 0) {
    this.accB.ekle(this.T_BOX, this.OX + x, GY + y, this.OZ + z, w, h, d, renk, this.BID, 0, ry, 0);
  }
  gx(x: number, y: number, z: number, w: number, h: number, d: number, renk: string) {
    this.accG.ekle(this.T_BOX, x, y, z, w, h, d, renk, -1);
  }
  silindir(x: number, y: number, z: number, r: number, h: number, renk: string, t = this.T_CYL) {
    this.accB.ekle(t, this.OX + x, GY + y, this.OZ + z, r, h, r, renk, this.BID);
  }
  /** Mutlak konumda bina geometrisi */
  ham(g: THREE.BufferGeometry, x: number, y: number, z: number, sx: number, sy: number, sz: number, renk: string, rx = 0, ry = 0) {
    this.accB.ekle(g, x, y, z, sx, sy, sz, renk, this.BID, rx, ry, 0);
  }

  /** Birimi belirli bir pencereye bağla; tek birimli ailelerde pencereler birimlere dağıtılır */
  private sayac = 0;
  dagit(): Hucre {
    const l = this.b.birimler;
    if (l.length === 0) return null;
    return l[this.sayac++ % l.length];
  }

  /** Pencere: cephe f/b/l/r; u = cephe boyunca konum; y = merkez */
  W(cephe: "f" | "b" | "l" | "r", u: number, y: number, w: number, h: number, birim: Hucre) {
    let x: number, z: number, ry: number;
    if (cephe === "f") [x, z, ry] = [this.OX + u, this.OZ + this.CD / 2 + 0.02, 0];
    else if (cephe === "b") [x, z, ry] = [this.OX + u, this.OZ - this.CD / 2 - 0.02, Math.PI];
    else if (cephe === "r") [x, z, ry] = [this.OX + this.CW / 2 + 0.02, this.OZ + u, Math.PI / 2];
    else [x, z, ry] = [this.OX - this.CW / 2 - 0.02, this.OZ + u, -Math.PI / 2];
    this.pencereler.push({ x, y: GY + y, z, w, h, ry, birim: birim?.id ?? null, durum: birim?.durum ?? null, bina: this.CK, blok: this.CBLK, idx: this.BID });
  }
  Wham(x: number, y: number, z: number, w: number, h: number, ry: number, birim: Hucre) {
    this.pencereler.push({ x: this.OX + x, y: GY + y, z: this.OZ + z, w, h, ry, birim: birim?.id ?? null, durum: birim?.durum ?? null, bina: this.CK, blok: this.CBLK, idx: this.BID });
  }
  vurus(x: number, y: number, z: number, w: number, h: number, d: number, blok: string | null = this.CBLK) {
    this.vuruslar.push({ x: this.OX + x, y: GY + y, z: this.OZ + z, w, h, d, bina: this.CK, blok });
  }
  esik(cephe: "f" | "b", u: number, y: number, w: number, renk: string) {
    if (cephe === "f") this.bx(u, y, this.CD / 2 + 0.06, w + 0.25, 0.1, 0.2, renk);
    else this.bx(u, y, -this.CD / 2 - 0.06, w + 0.25, 0.1, 0.2, renk);
  }
  klima(cephe: "f" | "l" | "r", u: number, y: number) {
    const renk = "#e7e7e2";
    if (cephe === "f") {
      this.bx(u, y, this.CD / 2 + 0.2, 0.8, 0.55, 0.36, renk);
      this.bx(u, y + 0.12, this.CD / 2 + 0.39, 0.42, 0.32, 0.02, "#9aa0a2");
    } else if (cephe === "l") this.ham(this.T_BOX, this.OX - this.CW / 2 - 0.2, GY + y, this.OZ + u, 0.36, 0.55, 0.8, renk);
    else this.ham(this.T_BOX, this.OX + this.CW / 2 + 0.2, GY + y, this.OZ + u, 0.36, 0.55, 0.8, renk);
  }
  korkuluk(w: number, d: number, y: number, h: number, renk: string, t = 0.22) {
    this.bx(0, y, d / 2 - t / 2, w, h, t, renk);
    this.bx(0, y, -d / 2 + t / 2, w, h, t, renk);
    this.bx(-w / 2 + t / 2, y, 0, t, h, d, renk);
    this.bx(w / 2 - t / 2, y, 0, t, h, d, renk);
  }
  catiKlimasi(n: number, w: number, d: number, y: number) {
    for (let i = 0; i < n; i++) {
      const x = (this.rnd() - 0.5) * (w - 3);
      const z = (this.rnd() - 0.5) * (d - 3);
      this.bx(x, y, z, 1.2, 0.8, 0.9, "#c9cdcc");
      this.bx(x, y + 0.8, z, 0.7, 0.04, 0.7, "#5d6467");
    }
  }
  tabela(metin: string, x: number, y: number, z: number, w: number, h: number, zemin: string, yazi: string, ry = 0) {
    const geo = new THREE.PlaneGeometry(w, h);
    const mat = new THREE.MeshBasicMaterial({ map: tabelaDokusu(metin, zemin, yazi, w / h), toneMapped: false, transparent: true });
    const m = new THREE.Mesh(geo, mat);
    m.position.set(this.OX + x, GY + y, this.OZ + z);
    m.rotation.y = ry;
    this.tabelalar.push({ mesh: m, idx: this.BID });
  }
  araba(x: number, z: number, ry: number, renk: string) {
    const c = Math.cos(ry);
    const s = Math.sin(ry);
    const at = (dx: number, y: number, sx: number, sy: number, sz: number, cc: string) =>
      this.accB.ekle(this.T_BOX, x + c * dx, y, z - s * dx, sx, sy, sz, cc, this.BID, 0, ry, 0);
    at(0, GY + 0.12, 3.9, 0.3, 1.6, "#1d1f21");
    at(0, GY + 0.32, 4.2, 0.62, 1.78, renk);
    at(-0.2, GY + 0.94, 2.3, 0.58, 1.6, "#28323a");
    at(-0.2, GY + 1.5, 2.1, 0.06, 1.5, renk);
  }
  get UST() {
    return this.b.ad.toLocaleUpperCase("tr-TR");
  }

  /* ---------- aileler ---------- */
  plaza(): number {
    const b = this.b;
    const PW = b.w, PD = b.d, LH = 4.6, FH = 3.4, TF = b.katlar, PER = b.kat_basi;
    const WS = PER >= 5 ? 2.5 : 2.3;
    const TW = PER * WS + 0.9;
    const TD = 13;
    const NT = b.kuleler.length;
    const GAP = NT > 1 ? (PW - NT * TW - 1.4) / (NT - 1) : 0;
    const H = LH + TF * FH;
    this.CBLK = null;
    // ortak podyum (lobi)
    this.bx(0, 0, 0, PW, LH, PD, "#4f5f68");
    this.bx(0, 0, 0, PW + 0.1, 0.5, PD + 0.1, "#8a8f8c");
    this.bx(0, LH - 0.3, 0, PW + 0.3, 0.5, PD + 0.3, "#d3d9dc");
    const nb = Math.max(4, Math.round(PW / 3));
    const bw = (PW - 1) / nb;
    for (let i = 0; i < nb; i++) {
      const x = -PW / 2 + 0.5 + i * bw + bw / 2;
      if (Math.abs(x) > 2.6) this.W("f", x, 2.25, bw - 0.35, 3.3, null);
      this.W("b", x, 2.25, bw - 0.35, 3.3, null);
      this.bx(-PW / 2 + 0.5 + i * bw, 0.5, PD / 2 + 0.04, 0.2, LH - 0.8, 0.2, "#e2e6e8");
    }
    for (let i = 0; i < 5; i++) {
      const z = -PD / 2 + 0.5 + (i * (PD - 1)) / 5 + (PD - 1) / 10;
      this.W("l", z, 2.25, (PD - 1) / 5 - 0.35, 3.3, null);
      this.W("r", z, 2.25, (PD - 1) / 5 - 0.35, 3.3, null);
    }
    this.W("f", 0, 1.6, 4.4, 2.8, null);
    this.bx(0, LH - 0.25, PD / 2 + 2.2, 9, 0.35, 4.4, "#dfe3e5");
    this.bx(-4.2, 0, PD / 2 + 4.1, 0.3, LH - 0.25, 0.3, "#c8cfd2");
    this.bx(4.2, 0, PD / 2 + 4.1, 0.3, LH - 0.25, 0.3, "#c8cfd2");
    this.bx(0, 0, PD / 2 + 2.2, 9.6, 0.12, 4.8, "#bfb8a8");
    this.tabela(this.UST, 0, LH + 0.55, PD / 2 + 4.35, 8.6, 0.8, "#06211f", "#e9fbf9");
    this.vurus(0, 0, 0, PW + 0.3, LH + 0.2, PD + 0.3, null);

    const bilgi = this.binalar.get(this.CK)!;
    const sOX = this.OX, sCW = this.CW, sCD = this.CD, TZ = -0.8;
    const TCOL = ["#566770", "#5b6a72", "#52626b", "#5a6670"];
    b.kuleler.forEach((kule, ti) => {
      const tx = (ti - (NT - 1) / 2) * (TW + GAP);
      this.OX = sOX + tx;
      this.OZ += TZ;
      this.CW = TW;
      this.CD = TD;
      this.CBLK = kule.ad || null;
      this.bx(0, LH, 0, TW - 0.5, TF * FH, TD - 0.5, TCOL[ti % TCOL.length]);
      for (let k = 0; k <= TF; k++) this.bx(0, LH + k * FH - 0.18, 0, TW + 0.3, 0.32, TD + 0.3, "#d3d9dc");
      for (let i = 0; i <= PER; i++) {
        const x = -TW / 2 + 0.45 + i * WS;
        this.bx(x, LH, TD / 2 + 0.05, 0.2, TF * FH, 0.36, "#e2e6e8");
        this.bx(x, LH, -TD / 2 - 0.05, 0.2, TF * FH, 0.36, "#e2e6e8");
      }
      for (let f = 0; f < TF; f++) {
        for (let s = 0; s < PER; s++) {
          const u = kule.izgara[f]?.[s] ?? null;
          const x = -TW / 2 + 0.45 + s * WS + WS / 2;
          const y = LH + f * FH + 1.6;
          this.W("f", x, y, WS - 0.3, 2.5, u);
          this.W("b", x, y, WS - 0.3, 2.5, u);
        }
        for (let i = 0; i < 4; i++) {
          const z = -TD / 2 + 0.5 + i * 3 + 1.5;
          const y = LH + f * FH + 1.6;
          this.W("l", z, y, 2.6, 2.5, null);
          this.W("r", z, y, 2.6, 2.5, null);
        }
      }
      this.bx(0, H, 0, TW + 0.3, 1.2, TD + 0.3, "#dde2e4");
      if (kule.ad) this.tabela(`${kule.ad} BLOK`, 0, H + 0.6, TD / 2 + 0.17, Math.min(4.4, TW - 1), 0.95, "#06211f", "#e9fbf9");
      this.bx(1, H + 1.2, -1.5, Math.min(6, TW - 2), 2.6, 5, "#bcc4c7");
      if (ti === 0) this.silindir(-TW / 2 + 1.2, H + 1.2, -4.2, 0.13, 8, "#8a9296", this.T_CYL6);
      this.vurus(0, LH, 0, TW + 0.4, H + 1.2 - LH, TD + 0.4, this.CBLK);
      if (kule.ad) bilgi.bloklar[kule.ad] = { x: this.OX, z: this.OZ, w: TW, d: TD, ust: H + 1.2 };
      this.OX = sOX;
      this.OZ -= TZ;
      this.CW = sCW;
      this.CD = sCD;
    });
    this.CBLK = null;
    return H + 4.1;
  }

  han(): number {
    const b = this.b;
    const w = b.w, d = b.d, FH = 3.3, F = b.katlar, H = F * FH;
    const tas = "#cdbb98", sus = "#ebe2cf";
    this.bx(0, 0, 0, w, H, d, tas);
    this.bx(0, 0, 0, w + 0.12, 1.0, d + 0.12, "#8f8676");
    for (let k = 1; k < F; k++) this.bx(0, k * FH - 0.12, 0, w + 0.18, 0.24, d + 0.18, "#bca988");
    this.bx(0, H - 0.35, 0, w + 0.5, 0.45, d + 0.5, sus);
    for (let k = 0; k < F; k++) {
      for (let s = 0; s < 2; s++) {
        const u = b.izgara[k]?.[s] ?? null;
        const c0 = -w / 2 + (s * w) / 2 + w / 4;
        for (const x of [c0 - 1.6, c0 + 1.6]) {
          if (k === 0) this.W("f", x, 1.55, 2.0, 2.3, u);
          else {
            this.W("f", x, k * FH + 1.7, 1.9, 1.7, u);
            this.esik("f", x, k * FH + 0.75, 1.9, sus);
          }
          this.W("b", x, k * FH + 1.7, 1.9, 1.7, u);
        }
        this.W(s ? "r" : "l", -2.4, k * FH + 1.7, 1.3, 1.6, u);
        this.W(s ? "r" : "l", 2.4, k * FH + 1.7, 1.3, 1.6, u);
        if (this.rnd() < 0.55 && k > 0) this.klima("f", c0, k * FH + 0.25);
      }
    }
    this.bx(0, 0, d / 2 + 0.02, 1.8, 2.5, 0.12, "#33403f");
    this.bx(0, 2.55, d / 2 + 0.6, 3, 0.15, 1.2, sus);
    this.tabela(this.UST, 0, 3.0, d / 2 + 0.03, 4.0, 0.5, "#7b2d26", "#fff4e4");
    this.korkuluk(w, d, H, 0.9, sus);
    this.catiKlimasi(3, w, d, H);
    this.vurus(0, 0, 0, w + 0.5, H + 0.9, d + 0.5);
    return H + 1.5;
  }

  kucukofis(): number {
    const b = this.b;
    const w = b.w, d = b.d, FH = 3.3, F = b.katlar, H = F * FH;
    this.bx(0, 0, 0, w, H, d, "#eeece6");
    this.bx(0, 0, 0, w + 0.12, 0.7, d + 0.12, "#6f7c7e");
    for (let k = 1; k < F; k++) this.bx(0, k * FH - 0.1, 0, w + 0.12, 0.2, d + 0.12, "#d7d6cf");
    this.bx(-w / 2 + 0.9, 0, d / 2 + 0.25, 0.6, H + 0.9, 0.5, "#17a59d");
    for (let k = 1; k < F; k++) {
      this.W("f", -1.8, k * FH + 1.7, 3.6, 1.7, this.dagit());
      this.W("f", 2.6, k * FH + 1.7, 3.2, 1.7, this.dagit());
      this.W("b", -2.2, k * FH + 1.7, 4, 1.7, this.dagit());
      this.W("b", 2.4, k * FH + 1.7, 4, 1.7, this.dagit());
    }
    this.W("f", -2.0, 1.35, 2.2, 2.5, this.dagit());
    this.W("f", 2.4, 1.45, 3.6, 2.2, this.dagit());
    for (let k = 0; k < F; k++) {
      this.W("l", -2, k * FH + 1.7, 2.4, 1.6, this.dagit());
      this.W("r", 2, k * FH + 1.7, 2.4, 1.6, this.dagit());
    }
    this.bx(-2.0, 2.75, d / 2 + 0.7, 3.4, 0.16, 1.4, "#d7d6cf");
    this.korkuluk(w, d, H, 0.9, "#e2e0d9");
    this.tabela(this.UST, 0.4, H + 0.45, d / 2 + 0.12, 7.4, 0.7, "#ffffff", "#0a7c76");
    this.catiKlimasi(2, w, d, H);
    this.vurus(0, 0, 0.3, w + 0.6, H + 0.9, d + 1.0);
    return H + 1.2;
  }

  apt(): number {
    const b = this.b;
    const w = b.w, d = b.d, FH = 3.0, F = b.katlar, H = F * FH + 0.5;
    const r = b.renk;
    this.bx(0, 0, 0, w, H, d, r.duvar);
    this.bx(0, 0, 0, w + 0.12, 0.9, d + 0.12, r.taban);
    for (let k = 1; k <= F; k++) this.bx(0, k * FH - 0.1, 0, w + 0.22, 0.2, d + 0.22, r.susleme);
    const sol = (s: number) => (s === 0 ? -w / 2 : 1.3);
    for (let k = 0; k < F; k++) {
      for (let s = 0; s < 2; s++) {
        const u = b.izgara[k]?.[s] ?? null;
        const y0 = k * FH;
        const cx = sol(s) + 3.4;
        for (let bay = 0; bay < 2; bay++) {
          const x = sol(s) + 1.7 + bay * 3.4;
          if (k >= 1 && bay === 1) this.W("f", x, y0 + 1.25, 1.2, 2.2, u);
          else {
            this.W("f", x, y0 + 1.65, 1.5, 1.45, u);
            this.esik("f", x, y0 + 0.84, 1.5, r.susleme);
          }
          this.W("b", x, y0 + 1.65, 1.5, 1.45, u);
          this.esik("b", x, y0 + 0.84, 1.5, r.susleme);
        }
        this.W(s ? "r" : "l", -2.4, y0 + 1.65, 1.2, 1.4, u);
        this.W(s ? "r" : "l", 2.2, y0 + 1.65, 1.2, 1.4, u);
        if (k >= 1) {
          this.bx(cx, y0 - 0.05, d / 2 + 0.7, 6.4, 0.16, 1.4, r.susleme);
          this.bx(cx, y0 + 0.11, d / 2 + 1.37, 6.4, 0.95, 0.06, r.korkuluk);
          this.bx(cx - 3.17, y0 + 0.11, d / 2 + 0.7, 0.06, 0.95, 1.4, r.korkuluk);
          this.bx(cx + 3.17, y0 + 0.11, d / 2 + 0.7, 0.06, 0.95, 1.4, r.korkuluk);
          if (u && u.durum !== "bos" && this.rnd() < 0.55) this.bx(cx + (s ? 2.2 : -2.2), y0 + 0.11, d / 2 + 0.75, 0.75, 0.55, 0.35, "#e8e8e3");
          if (this.rnd() < 0.3) {
            this.bx(cx - 1, y0 + 0.11, d / 2 + 0.9, 0.5, 0.5, 0.5, "#9a6a4a");
            this.ham(this.T_ICO, this.OX + cx - 1, GY + y0 + 0.85, this.OZ + d / 2 + 0.9, 0.42, 0.42, 0.42, "#5e8f4e");
          }
        }
      }
    }
    for (let k = 1; k < F; k++) this.W("f", 0, k * FH + 0.3, 0.9, 1.1, null);
    this.bx(0, 0, d / 2 + 0.02, 1.6, 2.4, 0.12, "#5a3e2c");
    this.bx(0, 2.5, d / 2 + 0.6, 2.6, 0.14, 1.2, r.susleme);
    this.bx(0, 0, d / 2 + 0.6, 2.4, 0.2, 1.2, r.taban);
    this.tabela(this.UST, 0, 2.88, d / 2 + 0.04, 2.5, 0.42, "#123d3a", "#f1f7f5");
    if (b.cati === "kiremit") {
      this.bx(0, H - 0.05, 0, w + 0.9, 0.2, d + 0.9, r.susleme);
      const g = kalcaCati(w + 0.9, d + 0.9, 3.0);
      this.gecici.push(g);
      this.ham(g, this.OX, GY + H + 0.15, this.OZ, 1, 1, 1, "#b4573a");
      this.bx(w / 4, H + 0.6, -d / 6, 0.7, 2.8, 0.7, "#9b5a45");
      this.vurus(0, 0, 0.35, w + 0.9, H + 3.15, d + 1.6);
      return H + 3.2;
    }
    this.korkuluk(w, d, H, 0.9, r.susleme);
    this.bx(0, H, -1.5, 2.8, 2.4, 3.0, r.duvar);
    this.bx(0, H + 2.4, -1.5, 3.1, 0.15, 3.3, r.susleme);
    this.silindir(-w / 2 + 2.2, H, -d / 2 + 2, 0.6, 1.3, "#d9d6cc");
    for (let i = 0; i < 4; i++) {
      this.ham(this.T_BOX, this.OX + 2.5 + i * 1.5, GY + H + 0.4, this.OZ + d / 2 - 2.6, 1.3, 0.06, 1.8, "#2b3c56", -0.45);
      this.bx(2.5 + i * 1.5, H, d / 2 - 2.0, 0.08, 0.6, 0.08, "#9aa0a2");
    }
    this.vurus(0, 0, 0.35, w + 0.4, H + 2.55, d + 1.6);
    return H + 2.6;
  }

  villa(): number {
    const b = this.b;
    const w = b.w, d = b.d, FH = 3.2, H = 2 * FH, sus = "#f6f1e6";
    this.bx(0, 0, 0, w, H, d, "#efe4cc");
    this.bx(0, 0, 0, w + 0.14, 0.9, d + 0.14, "#a69b88");
    this.bx(0, FH - 0.1, 0, w + 0.2, 0.2, d + 0.2, sus);
    this.W("f", 0, 1.25, 1.3, 2.3, this.dagit());
    this.W("f", -3.6, 1.7, 1.7, 1.5, this.dagit());
    this.W("f", 3.6, 1.7, 1.7, 1.5, this.dagit());
    for (const x of [-3.6, 0, 3.6]) {
      this.W("f", x, FH + 1.6, 1.5, 1.5, this.dagit());
      this.W("b", x, 1.7, 1.6, 1.5, this.dagit());
      this.W("b", x, FH + 1.6, 1.5, 1.5, this.dagit());
      this.esik("f", x, FH + 0.8, 1.5, sus);
    }
    for (const z of [-2.2, 2.2]) {
      this.W("l", z, 1.7, 1.4, 1.5, this.dagit());
      this.W("l", z, FH + 1.6, 1.4, 1.5, this.dagit());
      this.W("r", z, 1.7, 1.4, 1.5, this.dagit());
      this.W("r", z, FH + 1.6, 1.4, 1.5, this.dagit());
    }
    this.bx(0, FH - 0.05, d / 2 + 0.6, 3.4, 0.16, 1.2, sus);
    this.bx(0, FH + 0.11, d / 2 + 1.17, 3.4, 0.9, 0.06, "#4c5458");
    this.bx(0, 0, d / 2 + 0.8, 2.2, 0.25, 1.6, "#a69b88");
    this.bx(0, H - 0.05, 0, w + 1.2, 0.22, d + 1.2, sus);
    const g = kalcaCati(w + 1.2, d + 1.2, 2.8);
    this.gecici.push(g);
    this.ham(g, this.OX, GY + H + 0.17, this.OZ, 1, 1, 1, "#a9502f");
    this.bx(2.5, H + 0.8, -1.5, 0.7, 2.4, 0.7, "#8d4a35");
    this.vurus(0, 0, 0.2, w + 1.2, H + 3, d + 1.6);
    return H + 3;
  }

  mustakil(): number {
    const b = this.b;
    const w = b.w, d = b.d, FH = 3.0, H = 2 * FH, sus = "#f1ece2", kepenk = "#4f6b4a";
    this.bx(0, 0, 0, w, FH, d, "#bdb2a0");
    this.bx(0, FH, 0, w, FH, d, "#a95b43");
    this.bx(0, FH - 0.1, 0, w + 0.18, 0.2, d + 0.18, sus);
    const pencere2 = (cephe: "f" | "b", x: number, y: number) => {
      this.W(cephe, x, y, 1.3, 1.35, this.dagit());
      if (cephe === "f") {
        this.bx(x - 0.95, y - 0.68, d / 2 + 0.06, 0.5, 1.36, 0.08, kepenk);
        this.bx(x + 0.95, y - 0.68, d / 2 + 0.06, 0.5, 1.36, 0.08, kepenk);
        this.esik("f", x, y - 0.76, 1.3, sus);
      }
    };
    this.bx(-2.4, 0, d / 2 + 0.02, 1.05, 2.2, 0.12, "#5a3e2c");
    this.bx(-2.4, 2.35, d / 2 + 0.45, 1.8, 0.12, 0.9, sus);
    pencere2("f", 1.6, 1.6);
    pencere2("f", -2.2, FH + 1.6);
    pencere2("f", 2.2, FH + 1.6);
    for (const x of [-2, 2]) {
      this.W("b", x, 1.6, 1.3, 1.35, this.dagit());
      this.W("b", x, FH + 1.6, 1.3, 1.35, this.dagit());
    }
    this.W("l", 0, 1.6, 1.2, 1.3, this.dagit());
    this.W("l", 0, FH + 1.6, 1.2, 1.3, this.dagit());
    this.W("r", 0, 1.6, 1.2, 1.3, this.dagit());
    this.W("r", 0, FH + 1.6, 1.2, 1.3, this.dagit());
    const rh = 2.6, yarim = d / 2 + 0.55, uz = Math.hypot(yarim, rh), aci = Math.atan2(rh, yarim);
    this.ham(this.T_GABLE, this.OX, GY + H, this.OZ, d, (rh * (d / 2)) / yarim, w, "#a95b43", 0, Math.PI / 2);
    this.ham(this.T_BOXC, this.OX, GY + H + rh / 2 - 0.05, this.OZ + yarim / 2, w + 0.9, 0.16, uz, "#8e3f2a", aci);
    this.ham(this.T_BOXC, this.OX, GY + H + rh / 2 - 0.05, this.OZ - yarim / 2, w + 0.9, 0.16, uz, "#8e3f2a", -aci);
    this.bx(2.2, H + 0.6, -1.0, 0.6, 2.6, 0.6, "#7d3f2e");
    this.vurus(0, 0, 0, w + 0.9, H + rh + 0.3, d + 1.1);
    return H + rh + 0.4;
  }

  avm(): number {
    const b = this.b;
    const w = b.w, d = b.d, FH = 4.6, F = b.katlar, H = F * FH, duvar = "#ece6d8";
    const PAL = ["#b8402f", "#1f6f78", "#d08a1e", "#25598a", "#6e3b8a", "#2a8a55", "#9a3b30", "#5b6b7a", "#c4651f", "#2f7fb5"];
    this.bx(0, 0, 0, w, H, d, duvar);
    for (let k = 1; k < F; k++) this.bx(0, k * FH - 0.2, 0, w + 0.5, 0.4, d + 0.5, "#d9d0bf");
    for (let k = 0; k < F; k++) {
      for (let s = 0; s < 10; s++) {
        const u = b.izgara[k]?.[s] ?? null;
        const x = -w / 2 + 1 + s * 3.2 + 1.6;
        if (k === 0) {
          this.W("f", x, 1.8, 2.8, 3.0, u);
          if (!u || u.durum === "bos") {
            this.bx(x, 3.45, d / 2 + 0.25, 3.0, 0.75, 0.5, "#a5a9a7");
          } else {
            const c = PAL[s % PAL.length];
            this.bx(x, 3.45, d / 2 + 0.25, 3.0, 0.75, 0.5, c);
            this.ham(this.T_BOXC, this.OX + x, GY + 3.15, this.OZ + d / 2 + 0.95, 2.9, 0.08, 1.2, c, 0.35);
          }
        } else this.W("f", x, k * FH + 1.9, 2.8, 2.5, u);
        this.bx(-w / 2 + 1 + s * 3.2, 0, d / 2 + 0.12, 0.36, H, 0.28, "#ddd5c4");
      }
    }
    this.bx(w / 2 - 1, 0, d / 2 + 0.12, 0.36, H, 0.28, "#ddd5c4");
    for (let i = 0; i < 6; i++) {
      this.W("b", -w / 2 + 3 + i * 5.6, FH + 1.9, 2.4, 1.4, null);
      this.W("b", -w / 2 + 3 + i * 5.6, 1.2, 1.4, 2.4, null);
    }
    for (let i = 0; i < 3; i++) this.W("l", -d / 2 + 3.5 + i * 5.5, FH + 1.9, 2.2, 2.2, null);
    this.korkuluk(w, d, H, 1.3, duvar, 0.3);
    this.bx(0, H + 0.25, d / 2 + 0.02, w + 0.4, 1.0, 0.26, "#1aa39b");
    this.tabela(this.UST, 0, H + 2.3, d / 2 - 0.6, 12, 1.6, "#06211f", "#ffffff");
    this.vurus(0, 0, 0.3, w + 0.6, H + 3.1, d + 1.2);
    this.catiKlimasi(6, w, d, H);
    // otopark
    const pz0 = d / 2 + 2.2;
    const satirlar = [pz0 + 2.6, pz0 + 10.2];
    for (const zc of satirlar) for (let i = 0; i <= 11; i++) this.accG.ekle(this.T_BOX, this.OX - 15.4 + i * 2.8, GY, this.OZ + zc, 0.14, 0.02, 5, "#f2efe6", -1);
    const renkler = ["#c8ccd0", "#1f2a33", "#8b1e1e", "#e9e6df", "#2c4f7c", "#6b6f73", "#b7a17a", "#3d5b45"];
    let ci = 0;
    satirlar.forEach((zc, r) => {
      for (let i = 0; i < 11; i++) if (this.rnd() < 0.55) this.araba(this.OX - 14 + i * 2.8, this.OZ + zc, Math.PI / 2 + (r ? Math.PI : 0), renkler[ci++ % renkler.length]);
    });
    return H + 3.1;
  }

  fabrika(): number {
    const b = this.b;
    const w = b.w, d = b.d, H = 7.5, panel = "#c9c4b7";
    this.bx(0, 0, 0, w, H, d, panel);
    this.bx(0, 0, 0, w + 0.1, 1.5, d + 0.1, "#9c5b43");
    for (let i = 0; i < 19; i++) {
      const x = -w / 2 + 0.7 + i * 1.37;
      this.bx(x, 1.5, d / 2 + 0.03, 0.1, H - 1.5, 0.08, "#b6b1a4");
      this.bx(x, 1.5, -d / 2 - 0.03, 0.1, H - 1.5, 0.08, "#b6b1a4");
    }
    this.bx(0, H - 0.2, 0, w + 0.3, 0.3, d + 0.3, "#a9a499");
    for (let t = 0; t < 4; t++) {
      const x0 = -w / 2 + t * 6.5;
      this.ham(this.T_SAW, this.OX + x0, GY + H, this.OZ, 6.5, 2.8, d, "#8e8a80");
      this.Wham(x0 + 6.5 + 0.04, H + 1.45, 0, d - 1.2, 2.1, Math.PI / 2, this.dagit());
    }
    for (let i = 0; i < 5; i++) this.W("f", -10.5 + i * 3.2, 5.6, 2.6, 1.1, this.dagit());
    for (let i = 0; i < 6; i++) this.W("b", -10.5 + i * 4.2, 5.6, 2.6, 1.1, this.dagit());
    for (let i = 0; i < 3; i++) {
      this.W("r", -5 + i * 5, 5.6, 2.6, 1.1, this.dagit());
      this.W("l", -5 + i * 5, 5.6, 2.6, 1.1, this.dagit());
    }
    this.bx(7, 0, d / 2 + 0.05, 4.6, 4.8, 0.14, "#7f878d");
    for (let i = 0; i < 8; i++) this.bx(7, 0.3 + i * 0.58, d / 2 + 0.13, 4.6, 0.05, 0.04, "#6a7177");
    this.bx(7, 4.8, d / 2 + 0.8, 5.6, 0.18, 1.6, "#a9a499");
    // idari ek bina
    const ax = -8.5, az = d / 2 + 2.6, aw = 7, ad = 5.2, ah = 6.4;
    this.ham(this.T_BOX, this.OX + ax, GY, this.OZ + az, aw, ah, ad, "#e4e0d6");
    this.ham(this.T_BOX, this.OX + ax, GY + ah, this.OZ + az, aw + 0.3, 0.5, ad + 0.3, "#d3cec2");
    for (const y of [1.6, 4.6]) {
      this.Wham(ax - 1.7, y, az + ad / 2 + 0.02, 2.2, 1.3, 0, this.dagit());
      this.Wham(ax + 1.7, y, az + ad / 2 + 0.02, 2.2, 1.3, 0, this.dagit());
      this.Wham(ax - aw / 2 - 0.02, y, az, 2.2, 1.3, -Math.PI / 2, this.dagit());
    }
    this.tabela(this.UST, ax, 5.85, az + ad / 2 + 0.03, 5.8, 0.7, "#1f3a4a", "#f3f6f7");
    this.vurus(0, 0, 0, w + 0.4, H + 2.8, d + 0.4);
    this.vurus(ax, 0, az, aw + 0.3, ah + 0.5, ad + 0.3);
    // baca
    const chx = w / 2 - 2.6, chz = -d / 2 + 2.6;
    this.ham(this.T_CONE, this.OX + chx, GY, this.OZ + chz, 1.1, 24, 1.1, "#a35a43");
    this.ham(this.T_CYL, this.OX + chx, GY + 19, this.OZ + chz, 0.78, 0.9, 0.78, "#efebe2");
    this.vurus(chx, 0, chz, 2.3, 24, 2.3);
    return H + 2.8;
  }

  agac(x: number, z: number, s = 1, yukari = 0, idx = -1) {
    this.agaclar.push([x, z, s, yukari, idx]);
  }

  /* ---------- dünya ---------- */
  kur(binalar: SehirBinasi[]) {
    const { gx: GX, gz: GZ, hucreler } = izgaraYerlesimi(binalar.length);
    const CX = (GX - 1) / 2, CZ = (GZ - 1) / 2;
    const dolu = new Set(hucreler.map(([i, j]) => `${i},${j}`));
    const var_ = (i: number, j: number) => dolu.has(`${i},${j}`);
    const cxx = (i: number) => (i - CX) * ARALIK;
    const czz = (j: number) => (j - CZ) * ARALIK;
    const H2 = ARALIK / 2, DIS = 14, CIZGI = "#ece8dc";
    const olcek = Math.max(0.62, (0.5 * Math.hypot(GX * ARALIK, GZ * ARALIK)) / 110);

    this.gx(0, -0.16, 0, 1100 * olcek, 0.05, 1100 * olcek, "#a7a58c");
    // asfalt: dolu hücrelerin çevresi; komşusu olmayan yanda dış yol
    for (const [i, j] of hucreler) {
      const l = var_(i - 1, j) ? 0 : DIS, r = var_(i + 1, j) ? 0 : DIS, t = var_(i, j - 1) ? 0 : DIS, d = var_(i, j + 1) ? 0 : DIS;
      this.gx(cxx(i) + (r - l) / 2, -0.1, czz(j) + (d - t) / 2, ARALIK + l + r, 0.1, ARALIK + t + d, "#4c5155");
    }
    const serit = (dikey: boolean, c: number, a: number, b: number) => {
      for (let t = a + 7.5; t < b - 9.5; t += 6) {
        if (dikey) this.gx(c, 0, t + 1.5, 0.18, 0.02, 3, CIZGI);
        else this.gx(t + 1.5, 0, c, 3, 0.02, 0.18, CIZGI);
      }
    };
    const zebra = (dikey: boolean, c: number, at: number) => {
      for (let q = 0; q < 7; q++) {
        const o = -4.2 + q * 1.4;
        if (dikey) this.gx(c + o, 0, at, 0.6, 0.02, 2.4, CIZGI);
        else this.gx(at, 0, c + o, 2.4, 0.02, 0.6, CIZGI);
      }
    };
    const seg = new Set<string>();
    const yollar: [boolean, number, number, number][] = [];
    for (const [i, j] of hucreler) {
      const x0 = cxx(i), z0 = czz(j);
      for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
        const k = dx ? `v${2 * i + dx},${j}` : `h${i},${2 * j + dz}`;
        if (seg.has(k)) continue;
        seg.add(k);
        const off = H2 + (var_(i + dx, j + dz) ? 0 : 1);
        if (dx) {
          const c = x0 + dx * off;
          serit(true, c, z0 - H2, z0 + H2);
          zebra(true, c, z0 - H2 + 8.2);
          zebra(true, c, z0 + H2 - 8.2);
          yollar.push([true, c, z0 - H2, z0 + H2]);
        } else {
          const c = z0 + dz * off;
          serit(false, c, x0 - H2, x0 + H2);
          zebra(false, c, x0 - H2 + 8.2);
          zebra(false, c, x0 + H2 - 8.2);
          yollar.push([false, c, x0 - H2, x0 + H2]);
        }
      }
    }

    const PARSEL_RENGI: Record<string, string> = { plaza: "#d2ccbe", han: "#cfc8b8", kucukofis: "#cfc9bb", apt: "#9fb27c", villa: "#93b06c", mustakil: "#9cb175", avm: "#55595c", fabrika: "#b9b4a8" };
    binalar.forEach((b, idx) => {
      const [ci, cj] = hucreler[idx];
      const bxc = cxx(ci), bzc = czz(cj);
      this.BID = idx;
      this.gx(bxc, 0, bzc, BS, 0.18, BS, "#c8c3b7");
      this.gx(bxc, 0, bzc, Math.max(PARSEL, b.w + 1.6), 0.22, PARSEL, PARSEL_RENGI[b.aile]);
      this.b = b;
      this.sayac = 0;
      this.OX = bxc + b.off[0];
      this.OZ = bzc + b.off[1];
      this.CW = b.w;
      this.CD = b.d;
      this.CK = b.anahtar;
      this.CBLK = null;
      this.binalar.set(b.anahtar, { x: this.OX, z: this.OZ, w: b.w, d: b.d, bx: bxc, bz: bzc, ust: 0, idx, bloklar: {} });
      this.rnd = tohumlu(4001 + idx * 37 + Math.floor(b.tohum * 1000));
      const once = this.vuruslar.length;
      const ust = this[b.aile]();
      this.binalar.get(b.anahtar)!.ust = ust;
      if (this.vuruslar.length === once) this.vuruslar.push({ x: this.OX, y: GY, z: this.OZ, w: b.w, h: ust, d: b.d, bina: b.anahtar, blok: null });
      // bahçe ağaçları (binayla birlikte soluklaşır)
      if (b.aile === "villa") {
        this.agac(bxc - 12, bzc + 10, 1.2, 0, idx);
        this.agac(bxc + 12, bzc + 11, 1.1, 0, idx);
        this.agac(bxc - 13, bzc - 12, 1.3, 0, idx);
        this.gx(bxc - 6.5, GY, bzc + 9, 7, 0.06, 3.6, "#e7e0cf");
        this.gx(bxc - 6.5, GY, bzc + 9, 6.2, 0.08, 2.8, "#4aa9c6");
      }
      if (b.aile === "mustakil") {
        this.agac(bxc + 9, bzc + 9, 1.2, 0, idx);
        this.agac(bxc - 11, bzc + 10, 0.9, 0, idx);
      }
      if (b.aile === "apt") {
        this.agac(bxc - 13, bzc - 12, 1.0, 0, idx);
        this.agac(bxc + 13, bzc - 12, 1.1, 0, idx);
      }
      if (b.aile === "han" || b.aile === "kucukofis") this.agac(bxc + 13, bzc + 12, 0.9, 0, idx);
      // kaldırım ağaçları + lambalar
      this.BID = -1;
      for (const t of [-10, 10]) {
        this.agac(bxc + t, bzc + 18.6);
        this.agac(bxc + t, bzc - 18.6);
        this.agac(bxc + 18.6, bzc + t);
        this.agac(bxc - 18.6, bzc + t);
      }
      for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) this.lambalar.push([bxc + sx * 19, bzc + sz * 19, sx]);
    });
    this.BID = -1;
    this.CK = "";
    this.OX = 0;
    this.OZ = 0;

    // yol kenarında park etmiş araçlar
    const cc = ["#e9e6df", "#1f2a33", "#8b1e1e", "#c8ccd0", "#2c4f7c", "#6b6f73", "#c9a13c", "#3d5b45"];
    const r2 = tohumlu(77);
    let k = 0;
    for (const [dikey, c, a, b] of yollar) {
      for (let t = a + 11; t < b - 11; t += 7.5) {
        if (r2() < 0.58) continue;
        if (dikey) this.araba(c + 4.4, t, Math.PI / 2, cc[k++ % cc.length]);
        else this.araba(t, c - 4.4, 0, cc[k++ % cc.length]);
      }
    }
    // ağaçlar
    const yesiller = ["#5c8c4b", "#6c9a52", "#4e7e45", "#78a35a"];
    const r3 = tohumlu(99);
    for (const [x, z, s, yukari, idx] of this.agaclar) {
      this.BID = idx;
      const sc = s * (0.85 + r3() * 0.3);
      const y0 = GY + yukari;
      this.ham(this.T_CYL6, x, y0, z, 0.17 * sc, 2.4 * sc, 0.17 * sc, "#6b5440");
      this.ham(this.T_ICO, x, y0 + 3.4 * sc, z, 1.75 * sc, 2.0 * sc, 1.75 * sc, yesiller[Math.floor(r3() * yesiller.length)], r3(), r3());
      this.ham(this.T_ICO, x + 0.5 * sc, y0 + 4.4 * sc, z - 0.3 * sc, 1.1 * sc, 1.2 * sc, 1.1 * sc, yesiller[Math.floor(r3() * yesiller.length)], r3());
    }
    this.BID = -1;
    for (const [x, z, sx] of this.lambalar) {
      this.ham(this.T_CYL6, x, GY, z, 0.09, 6.2, 0.09, "#3a4144");
      this.ham(this.T_BOX, x + sx * 0.7, GY + 6.1, z, 1.5, 0.1, 0.12, "#3a4144");
    }

    const dolular = hucreler.map(([i, j]) => [cxx(i), czz(j)]);
    const mx = dolular.reduce((t, c) => t + c[0], 0) / Math.max(1, dolular.length);
    const mz = dolular.reduce((t, c) => t + c[1], 0) / Math.max(1, dolular.length);
    return { merkez: [mx, mz] as [number, number], sinirX: CX * ARALIK + BS / 2 + 12, sinirZ: CZ * ARALIK + BS / 2 + 12, olcek, gx: GX };
  }

  sablonlariBirak() {
    for (const g of [this.T_BOX, this.T_BOXC, this.T_CYL, this.T_CYL6, this.T_CONE, this.T_ICO, this.T_SAW, this.T_GABLE, ...this.gecici]) g.dispose();
  }
}

/**
 * Şehri kur. `binaMalzemesi` soluklaştırma gölgelendiricisini taşır;
 * dönen `temizle` tüm geometri/doku/malzemeleri bırakır (malzemeler hariç
 * — onlar sahne ömrü boyunca paylaşılır).
 */
export function sehirKur(binalar: SehirBinasi[], binaMalzemesi: THREE.Material, zeminMalzemesi: THREE.Material, pencereMalzemesi: THREE.Material): Sehir {
  const ins = new Insaatci();
  const yer = ins.kur(binalar);

  const binaAgi = ins.accB.ag(binaMalzemesi);
  const zeminAgi = ins.accG.ag(zeminMalzemesi);

  const pencereGeo = new THREE.BoxGeometry(1, 1, 0.12);
  const pencereAgi = new THREE.InstancedMesh(pencereGeo, pencereMalzemesi, Math.max(1, ins.pencereler.length));
  pencereAgi.count = ins.pencereler.length;
  const birimPencereleri = new Map<string, number[]>();
  const pencereler: PencereBilgisi[] = [];
  ins.pencereler.forEach((w, i) => {
    _e.set(0, w.ry, 0);
    _q.setFromEuler(_e);
    _m.compose(_p.set(w.x, w.y, w.z), _q, _s.set(w.w, w.h, 1));
    pencereAgi.setMatrixAt(i, _m);
    pencereler.push({ birim: w.birim, bina: w.bina, blok: w.blok, idx: w.idx, durum: w.durum });
    if (w.birim) birimPencereleri.set(w.birim, [...(birimPencereleri.get(w.birim) ?? []), i]);
  });
  pencereAgi.computeBoundingSphere();

  // Soluklaştırma dokusu: genişlik = bina sayısı (en az 1)
  const N = Math.max(1, binalar.length);
  const solukDoku = new THREE.DataTexture(new Uint8Array(N * 4), N, 1, THREE.RGBAFormat);
  solukDoku.needsUpdate = true;

  ins.sablonlariBirak();

  return {
    binaAgi,
    zeminAgi,
    pencereAgi,
    tabelalar: ins.tabelalar,
    pencereler,
    birimPencereleri,
    binalar: ins.binalar,
    vuruslar: ins.vuruslar,
    ...yer,
    binaSayisi: binalar.length,
    solukDoku,
    temizle: () => {
      binaAgi.geometry.dispose();
      zeminAgi.geometry.dispose();
      pencereGeo.dispose();
      pencereAgi.dispose();
      for (const t of ins.tabelalar) {
        t.mesh.geometry.dispose();
        const m = t.mesh.material as THREE.MeshBasicMaterial;
        m.map?.dispose();
        m.dispose();
      }
      solukDoku.dispose();
    },
  };
}
