"use client";

// Mülk Şehrim — 3D sahne. Yalnız next/dynamic (ssr:false) ile yüklenir; three.js
// ayrı bir parçada gelir ve klasik panele hiç inmez.
//
// Kurallar (Lider onayı): kuş bakışı; sol sürükle = kaydır, sağ tık / iki parmak
// = döndür, tekerlek = yakınlaştır; +/− ve 45° döndürme düğmeleri. Izgara = bina
// sayısı (boş arsa yok). Pencere = birim, renk = durum (boş sönük). Bina
// etiketleri HTML (uzakta rozet, yakında ad). Seçim panel ve haritayla ortak.
// Performans: sürekli döngü YOK — yalnız etkileşim/animasyon sırasında çizilir;
// DPR ≤ 1.5, gölge kapalı; bileşen kalkınca her şey dispose edilir.
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { dumanBulutu, dumanEvresi, gecikmeVar, parlamaKatsayisi, sehirBinasi, type SehirBinasi } from "@/lib/sehir3dModeli";
import { canliSahneUygun } from "@/lib/webglDestek";
import type { Bina } from "@/lib/yeniPanelBina";
import type { BirimDurumu } from "@/lib/yeniPanelTipleri";
import { ARALIK, DUMAN_BULUTU, GY, sehirKur, type Kutu, type Sehir } from "@/components/yeni-panel/sehir3d/insa";
import { bosHedefler, hedefGecerli, tasi, yerlesimCoz, type Hucre } from "@/lib/sehirDuzeni";
import { useSehirDuzeni } from "@/components/yeni-panel/sehirDuzeniDeposu";

const VURGU = "#17B6AE";
const PENCERE_RENGI: Record<BirimDurumu | "suslu", string> = {
  odendi: "#4fb07f",
  bekliyor: "#e6b23c",
  gecikmis: "#d9503f",
  bos: "#59656b",
  suslu: "#7d98a4", // birime bağlı olmayan (lobi, merdiven) pencere
};
const ETIKET_NOKTASI: Record<BirimDurumu, string> = { odendi: "#1d9a60", bekliyor: "#cf900b", gecikmis: "#d23f3f", bos: "#8c9a97" };
const SOLUK = new THREE.Color("#d7dfdb");
const BEYAZ = new THREE.Color("#ffffff");
const SIRA: BirimDurumu[] = ["gecikmis", "bekliyor", "odendi", "bos"];

export type Sehir3DSecim = { bina: string | null; blok: string | null; birim: string | null };
/** Etiket tercihi: rozet = yalnız nokta + birim sayısı; ad = uzakta rozet, yakında kısa ad; kapalı */
export type EtiketKipi = "acik" | "kapali";
/** Etiket içeriği hep "Bina adı · N birim"; düzey yalnız boyutu belirler */
type EtiketDuzeyi = "" | "gizli" | "uzak" | "yakin" | "tam";
type Etiket = { el: HTMLButtonElement; duzey: EtiketDuzeyi; sinif: string; w: number; h: number };

type Motor = {
  /** hucreler: kullanıcı düzeni (null = varsayılan); kameraKoru: yalnız düzen değiştiyse kamera yerinde kalır */
  sehriKur: (binalar: SehirBinasi[], hucreler: Hucre[] | null, kameraKoru?: boolean) => void;
  etiketKipi: (k: EtiketKipi) => void;
  sec: (s: Sehir3DSecim) => void;
  yalnizGecikmis: (v: boolean) => void;
  yakinlas: (f: number) => void;
  dondur: (a: number) => void;
  kusBakisi: () => void;
  birak: () => void;
};

function gokDokusu() {
  const c = document.createElement("canvas");
  c.width = 4;
  c.height = 256;
  const g = c.getContext("2d")!;
  const gr = g.createLinearGradient(0, 0, 0, 256);
  gr.addColorStop(0, "#8fbcd6");
  gr.addColorStop(0.62, "#cfe2e6");
  gr.addColorStop(1, "#e9ece2");
  g.fillStyle = gr;
  g.fillRect(0, 0, 4, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function motorKur(
  kap: HTMLDivElement,
  etiketKabi: HTMLDivElement,
  geri: {
    onSec: (bina: string | null, birim: string | null, blok: string | null) => void;
    /** Kullanıcı binayı başka hücreye bıraktı */
    onTasi: (anahtar: string, hedef: Hucre) => void;
  }
): Motor {
  const azHareket = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  // Telefon/tablet: DPR 1 (pil ve ısı), tek parmak sayfayı kaydırır
  const dokunmatik = window.matchMedia("(pointer: coarse)").matches;
  // Canlılık (baca dumanı, seçili birim pencere nabzı): yalnız güçlü masaüstünde
  // sahne görünürken sürekli çizilir; aksi hâlde sabit ve boşta hiç çizim yok.
  const nav = navigator as Navigator & { deviceMemory?: number };
  let canli = canliSahneUygun({ dokunmatik, azHareket, cekirdek: nav.hardwareConcurrency, bellek: nav.deviceMemory });
  const R = new THREE.WebGLRenderer({ antialias: !dokunmatik, powerPreference: "default" });
  R.setPixelRatio(dokunmatik ? 1 : Math.min(window.devicePixelRatio || 1, 1.5));
  R.outputColorSpace = THREE.SRGBColorSpace;
  R.toneMapping = THREE.ACESFilmicToneMapping;
  R.toneMappingExposure = 1.05;
  // Gölge: masaüstünde açık (önizleme v6 ile aynı), telefonda kapalı
  const golge = !dokunmatik;
  R.shadowMap.enabled = golge;
  R.shadowMap.type = THREE.PCFSoftShadowMap;
  // Gölge düşüren her şey durağan (güneş, binalar): gölge haritası her karede
  // değil, yalnız şehir kurulunca yeniden çizilir.
  R.shadowMap.autoUpdate = false;
  R.domElement.style.width = "100%";
  R.domElement.style.height = "100%";
  R.domElement.style.display = "block";
  R.domElement.setAttribute("role", "img");
  R.domElement.setAttribute("aria-label", "3D portföy şehri: binalar ve birim pencereleri");
  kap.insertBefore(R.domElement, kap.firstChild);

  const sahne = new THREE.Scene();
  const gok = gokDokusu();
  sahne.background = gok;
  const kamera = new THREE.PerspectiveCamera(34, 1, 1, 1600);
  const kontrol = new OrbitControls(kamera, R.domElement);
  // Dokunmatikte dikey tek parmak kaydırma tarayıcıya bırakılır (sayfa kayar);
  // iki parmak jesti (yakınlaştır + kaydır) aşağıda dokunma olaylarıyla
  // ELLE işlenir: OrbitControls'ün işaretçi tabanlı iki parmak jesti, ilk
  // parmak sayfayı kaydırmaya başlayınca tarayıcının pointercancel'ıyla
  // kopuyordu (iPhone'da "iki parmakla yaklaşamıyorum"). (OrbitControls
  // kurulurken touch-action:none yazdığı için bu satır ondan SONRA gelmeli.)
  R.domElement.style.touchAction = dokunmatik ? "pan-y" : "none";
  kontrol.enableDamping = false;
  kontrol.minDistance = 10;
  kontrol.maxPolarAngle = 1.25;
  kontrol.rotateSpeed = 0.7;
  kontrol.zoomSpeed = 0.9;
  kontrol.panSpeed = 1.1;
  kontrol.screenSpacePanning = false;
  kontrol.mouseButtons = { LEFT: THREE.MOUSE.PAN, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.ROTATE };
  kontrol.touches = dokunmatik ? { ONE: null, TWO: null } : { ONE: THREE.TOUCH.PAN, TWO: THREE.TOUCH.DOLLY_ROTATE };

  const yari = new THREE.HemisphereLight("#e6f0f3", "#a89a7c", 1.25);
  const gunes = new THREE.DirectionalLight("#fff2dc", 2.7);
  gunes.position.set(95, 150, 80);
  gunes.castShadow = golge;
  gunes.shadow.mapSize.set(2048, 2048);
  gunes.shadow.bias = -0.0004;
  gunes.shadow.normalBias = 0.04;
  sahne.add(yari, gunes, gunes.target);

  // Soluklaştırma: bina sırası köşe özniteliğinde, düzey bir veri dokusunda
  // (bina sayısından bağımsız; tek çizim çağrısı kalır).
  const solukU = { value: null as THREE.Texture | null };
  const sayiU = { value: 1 };
  const binaMal = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.86, metalness: 0 });
  binaMal.onBeforeCompile = (sh) => {
    sh.uniforms.uSoluk = solukU;
    sh.uniforms.uN = sayiU;
    sh.vertexShader =
      `attribute float aBid;\nuniform sampler2D uSoluk;\nuniform float uN;\nvarying float vSoluk;\n` +
      sh.vertexShader.replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>\n  vSoluk = aBid < -0.5 ? 0.0 : texture2D(uSoluk, vec2((aBid + 0.5) / uN, 0.5)).r;`
      );
    sh.fragmentShader =
      `varying float vSoluk;\n` +
      sh.fragmentShader.replace("#include <dithering_fragment>", `#include <dithering_fragment>\n  gl_FragColor.rgb = mix(gl_FragColor.rgb, vec3(0.86, 0.9, 0.88), vSoluk);`);
  };
  const zeminMal = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, metalness: 0 });
  const pencereMal = new THREE.MeshStandardMaterial({ roughness: 0.32, metalness: 0.08 });

  const kenarGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1));
  const seciliKenar = new THREE.LineSegments(kenarGeo, new THREE.LineBasicMaterial({ color: VURGU, toneMapped: false }));
  const ustKenar = new THREE.LineSegments(kenarGeo, new THREE.LineBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0.75, toneMapped: false }));
  const plakaGeo = new THREE.PlaneGeometry(1, 1);
  const plaka = new THREE.Mesh(plakaGeo, new THREE.MeshBasicMaterial({ color: VURGU, transparent: true, opacity: 0.32, depthWrite: false, toneMapped: false }));
  plaka.rotation.x = -Math.PI / 2;
  seciliKenar.visible = ustKenar.visible = plaka.visible = false;
  sahne.add(seciliKenar, ustKenar, plaka);

  let sehir: Sehir | null = null;
  let modeller: SehirBinasi[] = [];
  let vurusAglari: THREE.Mesh[] = [];
  const vurusGeo: THREE.BufferGeometry[] = [];
  const vurusMal = new THREE.MeshBasicMaterial();
  let etiketler = new Map<string, Etiket>();
  let etiketKipi: EtiketKipi = "acik";
  let secim: Sehir3DSecim = { bina: null, blok: null, birim: null };
  let gecikmisFiltre = false;
  const solukHedef: number[] = [];
  const solukSimdi: number[] = [];
  let solukAnim = false;
  let parlama = parlamaKatsayisi(null);
  let canlandirildi = false;
  let oncekiKare = 0;
  let yavasKare = 0;

  type Ucus = { t0: number; ms: number; ft: THREE.Vector3; fc: THREE.Vector3; tt: THREE.Vector3; tc: THREE.Vector3 };
  let ucus: Ucus | null = null;
  let donus: { t0: number; ms: number; a: number; yapilan: number } | null = null;
  let raf = 0;
  let bekleyenUzerinde: [number, number] | null = null;
  let uzerindeAnahtar: string | null = null;

  const _col = new THREE.Color();
  const _tv = new THREE.Vector3();
  const _cv = new THREE.Vector3();
  const _dv = new THREE.Vector3();
  const Y = new THREE.Vector3(0, 1, 0);

  const iste = () => {
    if (!raf) raf = requestAnimationFrame(kare);
  };
  kontrol.addEventListener("change", iste);
  kontrol.addEventListener("start", () => {
    ucus = null;
    donus = null;
  });

  function boyutla() {
    const w = kap.clientWidth;
    const h = kap.clientHeight;
    if (!w || !h) return;
    R.setSize(w, h, false);
    kamera.aspect = w / h;
    kamera.updateProjectionMatrix();
    iste();
  }
  const gozlem = new ResizeObserver(boyutla);
  gozlem.observe(kap);

  // Sürekli çizim yalnız sahne görünürken: sekme gizli ya da sahne ekran dışındaysa durur
  let sekmeAcik = document.visibilityState === "visible";
  let ekranda = true;
  const gorunurlukDegisti = () => {
    sekmeAcik = document.visibilityState === "visible";
    iste();
  };
  document.addEventListener("visibilitychange", gorunurlukDegisti);
  const ekranGozlem = new IntersectionObserver(([g]) => {
    ekranda = g ? g.isIntersecting : true;
    iste();
  });
  ekranGozlem.observe(kap);

  function pencereRengi(i: number, out: THREE.Color) {
    if (!sehir) return out;
    const p = sehir.pencereler[i];
    out.set(PENCERE_RENGI[p.durum ?? "suslu"]);
    const d = p.idx >= 0 ? solukSimdi[p.idx] ?? 0 : 0;
    if (d > 0) out.lerp(SOLUK, Math.min(0.85, d * 1.1));
    if (secim.birim && p.birim === secim.birim) out.lerp(BEYAZ, parlama);
    return out;
  }
  function pencereleriBoya() {
    if (!sehir) return;
    for (let i = 0; i < sehir.pencereler.length; i++) sehir.pencereAgi.setColorAt(i, pencereRengi(i, _col));
    if (sehir.pencereAgi.instanceColor) sehir.pencereAgi.instanceColor.needsUpdate = true;
  }
  function solukDokuyuYaz() {
    if (!sehir) return;
    const veri = sehir.solukDoku.image.data as Uint8Array;
    for (let i = 0; i < modeller.length; i++) veri[i * 4] = Math.round((solukSimdi[i] ?? 0) * 255);
    sehir.solukDoku.needsUpdate = true;
    for (const t of sehir.tabelalar) {
      const d = t.idx >= 0 ? solukSimdi[t.idx] ?? 0 : 0;
      (t.mesh.material as THREE.MeshBasicMaterial).opacity = 1 - d * 0.75;
    }
  }
  function soluklariGuncelle(aninda: boolean) {
    modeller.forEach((b, i) => {
      let d = 0;
      if (secim.bina && b.anahtar !== secim.bina) d = 0.6;
      if (gecikmisFiltre && !gecikmeVar(b) && b.anahtar !== secim.bina) d = Math.max(d, 0.68);
      solukHedef[i] = d;
      if (aninda || azHareket) solukSimdi[i] = d;
    });
    solukAnim = true;
    etiketleriBoya();
    iste();
  }
  function solukAdimi() {
    let hareket = false;
    for (let i = 0; i < modeller.length; i++) {
      const c = solukSimdi[i] ?? 0;
      const t = solukHedef[i] ?? 0;
      if (Math.abs(t - c) > 0.004) {
        solukSimdi[i] = c + (t - c) * 0.2;
        hareket = true;
      } else solukSimdi[i] = t;
    }
    solukDokuyuYaz();
    pencereleriBoya();
    if (!hareket) solukAnim = false;
    return hareket;
  }

  function etiketleriBoya() {
    modeller.forEach((b, i) => {
      const e = etiketler.get(b.anahtar);
      if (!e) return;
      const sayac: Record<BirimDurumu, number> = { odendi: 0, bekliyor: 0, gecikmis: 0, bos: 0 };
      for (const u of b.birimler) sayac[u.durum]++;
      const enKotu = SIRA.find((s) => sayac[s] > 0) ?? "bos";
      const secili = secim.bina === b.anahtar;
      const soluk = (solukHedef[i] ?? 0) > 0;
      e.sinif = `${secili ? "ring-2 ring-[#17B6AE] border-[#17B6AE] z-[1000]" : "border-gray-200"} ${soluk ? "opacity-40 hover:opacity-100" : ""}`;
      e.el.dataset.durum = enKotu;
      (e.el.firstChild as HTMLElement).style.background = ETIKET_NOKTASI[enKotu];
      const d = e.duzey;
      e.duzey = "";
      if (d) etiketGorunumu(e, b, d);
      e.el.setAttribute("aria-label", `${b.ad}, ${b.birimler.length} birim, ${sayac.gecikmis} gecikmiş`);
    });
  }
  /** Etiketin görünüm düzeyi değiştiyse sınıf/metin yenilenir ve boyutu ölçülür */
  // Boyut uzaklığa göre: uzak küçük ve yarı saydam, yakın normal, seçili vurgulu;
  // telefonda bir kademe küçük. Uzun ad uzak/yakında kısaltılır (…), seçilince tam.
  const ETIKET_BOYU: Record<Exclude<EtiketDuzeyi, "" | "gizli">, string> = dokunmatik
    ? {
        uzak: "gap-1 bg-white/75 backdrop-blur-[2px] border-white/80 text-[9.5px] py-px pl-1 pr-1.5 [&_.ad]:max-w-[6.5rem]",
        yakin: "gap-1 bg-white/90 border-gray-200 text-[10.5px] py-[2px] pl-1.5 pr-2 [&_.ad]:max-w-[8.5rem]",
        tam: "gap-1.5 bg-white border-[#17B6AE] text-[11.5px] font-bold py-[3px] pl-1.5 pr-2",
      }
    : {
        uzak: "gap-1 bg-white/75 backdrop-blur-[2px] border-white/80 text-[10.5px] py-px pl-[5px] pr-1.5 [&_.ad]:max-w-[8rem]",
        yakin: "gap-1.5 bg-white/90 border-gray-200 text-[12px] py-[2px] pl-1.5 pr-2 [&_.ad]:max-w-[11rem]",
        tam: "gap-1.5 bg-white border-[#17B6AE] text-[13px] font-bold py-[3px] pl-2 pr-2.5",
      };
  function etiketGorunumu(e: Etiket, _b: SehirBinasi, duzey: EtiketDuzeyi) {
    if (e.duzey === duzey) return;
    e.duzey = duzey;
    if (duzey === "" || duzey === "gizli") return;
    e.el.className = `absolute left-0 top-0 pointer-events-auto flex items-center rounded-full border shadow-sm whitespace-nowrap font-semibold text-slate-800 hover:border-[#17B6AE] will-change-transform ${ETIKET_BOYU[duzey]} ${e.sinif}`;
    e.w = e.h = 0;
  }

  // Yerleşim: seçili/üzerine gelinen tam ad binanın üstünde; diğerleri binanın
  // ekranda en sağdaki tepe köşesinin hemen yanında (bina örtülmesin). Üst üste
  // binen etiketlerden uzaktaki gizlenir (seçili her zaman görünür).
  const _etiketKutulari: [number, number, number, number][] = [];
  function etiketleriYerlestir() {
    if (!sehir) return;
    const W2 = kap.clientWidth;
    const H2 = kap.clientHeight;
    const alcak = kamera.position.y < 16;
    const YAKIN = (W2 < 680 ? 95 : 150) * Math.max(1, sehir.olcek * 0.9);
    const adaylar: { e: Etiket; b: SehirBinasi; duzey: EtiketDuzeyi; x: number; y: number; z: number; odak: boolean }[] = [];
    for (const b of modeller) {
      const bi = sehir.binalar.get(b.anahtar);
      const e = etiketler.get(b.anahtar);
      if (!bi || !e) continue;
      const odak = b.anahtar === secim.bina || (!!uzerindeAnahtar && uzerindeAnahtar.startsWith(`${b.anahtar}|`));
      let duzey: EtiketDuzeyi;
      if (surukleme) duzey = "gizli";
      else if (odak) duzey = "tam";
      else if (etiketKipi === "kapali") duzey = "gizli";
      else duzey = _cv.set(bi.x, GY + bi.ust * 0.5, bi.z).distanceTo(kamera.position) < YAKIN ? "yakin" : "uzak";
      let x: number, y: number, z: number;
      if (duzey === "tam") {
        _tv.set(bi.x, GY + bi.ust + 1.6, bi.z).project(kamera);
        [x, y, z] = [_tv.x, _tv.y, _tv.z];
      } else {
        x = -Infinity;
        y = z = 0;
        for (const [sx, sz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
          _tv.set(bi.x + (sx * bi.w) / 2, GY + bi.ust * 0.82, bi.z + (sz * bi.d) / 2).project(kamera);
          if (_tv.x > x) [x, y, z] = [_tv.x, _tv.y, _tv.z];
        }
      }
      const gorunur = duzey !== "gizli" && (!alcak || b.anahtar === secim.bina) && z < 1 && x > -1.15 && x < 1.15 && y > -1.1 && y < 1.25;
      if (!gorunur) {
        e.el.hidden = true;
        continue;
      }
      adaylar.push({ e, b, duzey, x, y, z, odak });
    }
    adaylar.sort((a, b) => Number(b.odak) - Number(a.odak) || a.z - b.z);
    _etiketKutulari.length = 0;
    for (const a of adaylar) {
      etiketGorunumu(a.e, a.b, a.duzey);
      a.e.el.hidden = false;
      if (!a.e.w) {
        a.e.w = a.e.el.offsetWidth;
        a.e.h = a.e.el.offsetHeight;
      }
      const px = (a.x * 0.5 + 0.5) * W2;
      const py = (-a.y * 0.5 + 0.5) * H2;
      const sol = a.duzey === "tam" ? px - a.e.w / 2 : px + 4;
      const ust = a.duzey === "tam" ? py - a.e.h : py - a.e.h / 2;
      const kutu: [number, number, number, number] = [sol - 2, ust - 2, sol + a.e.w + 2, ust + a.e.h + 2];
      const carpisir = _etiketKutulari.some((k) => kutu[0] < k[2] && kutu[2] > k[0] && kutu[1] < k[3] && kutu[3] > k[1]);
      if (carpisir && !a.odak) {
        a.e.el.style.visibility = "hidden";
        continue;
      }
      a.e.el.style.visibility = "";
      _etiketKutulari.push(kutu);
      a.e.el.style.zIndex = a.odak ? "1000" : String(Math.round((1 - a.z) * 400));
      a.e.el.style.transform = `translate(${sol.toFixed(1)}px,${ust.toFixed(1)}px)`;
    }
  }

  function kutuOf(anahtar: string, blok: string | null): (Kutu & { ust: number }) | null {
    const bi = sehir?.binalar.get(anahtar);
    if (!bi) return null;
    return blok && bi.bloklar[blok] ? bi.bloklar[blok] : bi;
  }
  function kutuyaOturt(nesne: THREE.Object3D, k: Kutu, pay: number) {
    nesne.scale.set(k.w + pay, k.ust + pay * 0.5, k.d + pay);
    nesne.position.set(k.x, GY + (k.ust + pay * 0.5) / 2 - 0.02, k.z);
  }
  function ucusBaslat(tt: THREE.Vector3, tc: THREE.Vector3, ms: number) {
    donus = null;
    ucus = { t0: performance.now(), ms: azHareket ? 1 : ms, ft: kontrol.target.clone(), fc: kamera.position.clone(), tt, tc };
    iste();
  }
  function binayaOdaklan(anahtar: string, blok: string | null) {
    const k = kutuOf(anahtar, blok);
    if (!k) return;
    const tp = new THREE.Vector3(k.x, Math.min(k.ust * 0.42, 15), k.z);
    const off = kamera.position.clone().sub(kontrol.target);
    if (off.y / off.length() < 0.45) off.set(0.48, 0.58, 0.66);
    const uzak = THREE.MathUtils.clamp(off.length() * 0.7, blok ? 55 : 48, 110);
    ucusBaslat(tp, tp.clone().add(off.setLength(uzak)), 850);
  }
  const _sigKamera = new THREE.PerspectiveCamera();
  function binalaraSigdir(tp: THREE.Vector3, cp: THREE.Vector3) {
    if (!sehir) return;
    let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity, ust = 0;
    for (const bi of sehir.binalar.values()) {
      x0 = Math.min(x0, bi.x - bi.w / 2);
      x1 = Math.max(x1, bi.x + bi.w / 2);
      z0 = Math.min(z0, bi.z - bi.d / 2);
      z1 = Math.max(z1, bi.z + bi.d / 2);
      ust = Math.max(ust, bi.ust);
    }
    if (!Number.isFinite(x0)) return;
    tp.set((x0 + x1) / 2, Math.min(ust * 0.3, 8), (z0 + z1) / 2);
    const yon = cp.clone().sub(tp).normalize();
    const koseler = [x0, x1].flatMap((x) => [z0, z1].flatMap((z) => [GY, GY + ust].map((y) => new THREE.Vector3(x, y, z))));
    _sigKamera.copy(kamera);
    let uz = cp.distanceTo(tp);
    for (let n = 0; n < 6; n++) {
      _sigKamera.position.copy(tp).addScaledVector(yon, uz);
      _sigKamera.lookAt(tp);
      _sigKamera.updateMatrixWorld();
      let m = 0;
      for (const c of koseler) {
        _tv.copy(c).project(_sigKamera);
        m = Math.max(m, Math.abs(_tv.x), Math.abs(_tv.y));
      }
      if (m <= 0) break;
      uz = THREE.MathUtils.clamp(uz * (m / 0.92), kontrol.minDistance, kontrol.maxDistance);
    }
    cp.copy(tp).addScaledVector(yon, uz);
  }
  function kusBakisi(aninda = false) {
    if (!sehir) return;
    const k = Math.max(1, 1.45 / Math.max(0.5, kamera.aspect || 1.4)) * sehir.olcek * (sehir.gx > 3 ? 1.24 : 1);
    const [mx, mz] = sehir.merkez;
    const tp = new THREE.Vector3(mx, 2, mz + 8 * sehir.olcek);
    const cp = new THREE.Vector3(mx + 96 * k, 104 * k, mz + 142 * k);
    // Telefon / dik ekran: kadraj binaların kendisine sığdırılır (yollar ve
    // kenar boşlukları değil); böylece ilk açılışta binalar seçilebilir büyüklükte.
    if (dokunmatik || kamera.aspect < 1) binalaraSigdir(tp, cp);
    if (aninda) {
      kontrol.target.copy(tp);
      kamera.position.copy(cp);
      kontrol.update();
      iste();
    } else ucusBaslat(tp, cp, 900);
  }

  // İşaretçi ile seçim
  const isin = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  function sec(cx: number, cy: number): { bina: string; birim: string | null; blok: string | null } | null {
    if (!sehir) return null;
    const r = R.domElement.getBoundingClientRect();
    ndc.set(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1);
    isin.setFromCamera(ndc, kamera);
    const govde = isin.intersectObjects(vurusAglari, false).sort((a, b) => a.distance - b.distance)[0];
    const pencere = isin.intersectObject(sehir.pencereAgi, false).sort((a, b) => a.distance - b.distance)[0];
    if (pencere && pencere.instanceId !== undefined && (!govde || pencere.distance <= govde.distance + 0.6)) {
      const p = sehir.pencereler[pencere.instanceId];
      return { bina: p.bina, birim: p.birim, blok: p.blok };
    }
    if (govde) return { bina: govde.object.userData.bina, birim: null, blok: govde.object.userData.blok ?? null };
    return null;
  }
  let basili: { x: number; y: number; dugme: number; t: number } | null = null;
  // İki parmak jesti (dokunmatik): başlangıç durumuna göre birikimli hesap
  let jest: { d0: number; mx: number; my: number; hedef: THREE.Vector3; yon: THREE.Vector3; uzunluk: number } | null = null;
  let sonJest = 0;
  let sonDokunma: { x: number; y: number; t: number } | null = null;
  const onDown = (e: PointerEvent) => {
    basili = { x: e.clientX, y: e.clientY, dugme: e.button, t: performance.now() };
    if (e.pointerType !== "mouse" || e.button !== 0) return;
    const h = sec(e.clientX, e.clientY);
    if (!h) return;
    if (e.shiftKey) suruklemeBasla(h.bina);
    else {
      // 250 ms kıpırdamadan basılı tutulursa taşıma başlar (kıpırdarsa kaydırma)
      const basladiT = basili.t;
      clearTimeout(tutmaZamani);
      tutmaZamani = window.setTimeout(() => {
        if (basili && basili.t === basladiT) suruklemeBasla(h.bina);
      }, 250);
    }
  };
  const onUp = (e: PointerEvent) => {
    clearTimeout(tutmaZamani);
    if (surukleme && e.pointerType === "mouse") {
      basili = null;
      suruklemeBitir(true);
      return;
    }
    if (!basili) return;
    const oynadi = Math.abs(e.clientX - basili.x) + Math.abs(e.clientY - basili.y);
    const dugme = basili.dugme;
    const basladi = basili.t;
    basili = null;
    if (oynadi > 6 || dugme !== 0) return;
    // İki parmak jestinin ya da bina taşımanın ardından kalkan parmak seçim sayılmaz
    if (jest || sonJest > basladi || sonSurukleme > basladi) return;
    if (e.pointerType === "touch") {
      const simdi = performance.now();
      const onceki = sonDokunma;
      sonDokunma = { x: e.clientX, y: e.clientY, t: simdi };
      // Çift dokunma: binaya (ya da dokunulan yere) yaklaş
      if (onceki && simdi - onceki.t < 320 && Math.abs(e.clientX - onceki.x) + Math.abs(e.clientY - onceki.y) < 30) {
        sonDokunma = null;
        const h2 = sec(e.clientX, e.clientY);
        if (h2 && (h2.bina !== secim.bina || (h2.blok ?? null) !== secim.blok)) geri.onSec(h2.bina, h2.birim, h2.blok);
        else motor.yakinlas(0.55);
        return;
      }
    }
    const h = sec(e.clientX, e.clientY);
    if (!h) {
      if (secim.bina) geri.onSec(null, null, null);
      return;
    }
    geri.onSec(h.bina, h.birim, h.blok);
  };
  const onMove = (e: PointerEvent) => {
    if (surukleme && e.pointerType === "mouse") {
      suruklemeGuncelle(e.clientX, e.clientY);
      return;
    }
    if (basili && Math.abs(e.clientX - basili.x) + Math.abs(e.clientY - basili.y) > 6) clearTimeout(tutmaZamani);
    if (e.pointerType === "mouse" && !basili) {
      bekleyenUzerinde = [e.clientX, e.clientY];
      iste();
    }
  };
  const onLeave = () => {
    bekleyenUzerinde = null;
    uzerindeAyarla(null);
  };
  R.domElement.addEventListener("pointerdown", onDown);
  R.domElement.addEventListener("pointerup", onUp);
  R.domElement.addEventListener("pointermove", onMove);
  R.domElement.addEventListener("pointerleave", onLeave);

  // Dokunmatik iki parmak: kıstır = yakınlaştır/uzaklaştır, birlikte sürükle =
  // kaydır. Etiketlerin üstünde başlayan jest de sayılsın diye sahne yüzeyine
  // (tuval + etiket katmanı) bağlanır. Tek parmak sayfayı kaydırır (pan-y).
  const yuzey = kap.parentElement ?? kap;
  const parmakArasi = (t: TouchList) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
  const _sag = new THREE.Vector3();
  const _ileri = new THREE.Vector3();
  const onJestBasla = (e: TouchEvent) => {
    clearTimeout(tutmaZamani);
    uzunBasis = null;
    if (e.touches.length === 1) {
      // Uzun basış (parmak kıpırdamadan 450 ms) binayı taşımaya başlatır;
      // parmak önce kıpırdarsa tarayıcı sayfayı kaydırır (dokunulmaz).
      const t = e.touches[0];
      uzunBasis = { x: t.clientX, y: t.clientY };
      tutmaZamani = window.setTimeout(() => {
        const u = uzunBasis;
        if (!u) return;
        const h = sec(u.x, u.y);
        if (h) suruklemeBasla(h.bina);
      }, 450);
      return;
    }
    if (surukleme) suruklemeBitir(false);
    if (e.touches.length < 2) return;
    e.preventDefault();
    ucus = null;
    donus = null;
    const yon = kamera.position.clone().sub(kontrol.target);
    jest = {
      d0: Math.max(1, parmakArasi(e.touches)),
      mx: (e.touches[0].clientX + e.touches[1].clientX) / 2,
      my: (e.touches[0].clientY + e.touches[1].clientY) / 2,
      hedef: kontrol.target.clone(),
      uzunluk: yon.length(),
      yon: yon.normalize(),
    };
  };
  const onJest = (e: TouchEvent) => {
    if (surukleme && e.touches.length === 1) {
      e.preventDefault();
      suruklemeGuncelle(e.touches[0].clientX, e.touches[0].clientY);
      return;
    }
    if (uzunBasis && e.touches.length === 1 && Math.abs(e.touches[0].clientX - uzunBasis.x) + Math.abs(e.touches[0].clientY - uzunBasis.y) > 8) {
      clearTimeout(tutmaZamani);
      uzunBasis = null;
    }
    if (!jest || e.touches.length < 2) return;
    e.preventDefault();
    const uz = THREE.MathUtils.clamp((jest.uzunluk * jest.d0) / Math.max(1, parmakArasi(e.touches)), kontrol.minDistance, kontrol.maxDistance);
    const dx = (e.touches[0].clientX + e.touches[1].clientX) / 2 - jest.mx;
    const dy = (e.touches[0].clientY + e.touches[1].clientY) / 2 - jest.my;
    // Piksel başına zemin mesafesi (OrbitControls kaydırmasıyla aynı yaklaşım)
    const pp = (2 * uz * Math.tan(THREE.MathUtils.degToRad(kamera.fov) / 2)) / Math.max(1, R.domElement.clientHeight);
    _sag.setFromMatrixColumn(kamera.matrixWorld, 0).setY(0).normalize();
    _ileri.crossVectors(Y, _sag);
    kontrol.target.copy(jest.hedef).addScaledVector(_sag, -dx * pp).addScaledVector(_ileri, dy * pp);
    kamera.position.copy(kontrol.target).addScaledVector(jest.yon, uz);
    kontrol.update();
    iste();
  };
  const onJestBitti = (e: TouchEvent) => {
    clearTimeout(tutmaZamani);
    uzunBasis = null;
    if (surukleme && e.touches.length === 0) suruklemeBitir(e.type === "touchend");
    if (!jest || e.touches.length >= 2) return;
    jest = null;
    sonJest = performance.now();
  };
  const sagTikEngeli = (e: Event) => e.preventDefault();
  const tusla = (e: KeyboardEvent) => {
    if (e.key === "Escape" && surukleme) suruklemeBitir(false);
  };
  window.addEventListener("keydown", tusla);
  if (dokunmatik) {
    // Uzun basışta iOS büyüteç/menüsü ve Android bağlam menüsü çıkmasın
    yuzey.style.setProperty("-webkit-touch-callout", "none");
    yuzey.style.userSelect = "none";
    yuzey.style.setProperty("-webkit-user-select", "none");
    yuzey.addEventListener("contextmenu", sagTikEngeli);
    yuzey.style.touchAction = "pan-y";
    yuzey.addEventListener("touchstart", onJestBasla, { passive: false });
    yuzey.addEventListener("touchmove", onJest, { passive: false });
    yuzey.addEventListener("touchend", onJestBitti);
    yuzey.addEventListener("touchcancel", onJestBitti);
  }
  // ---- Bina taşıma: hedef hücreler, hayalet kutu, bırakınca ızgaraya oturma ----
  type Surukleme = { anahtar: string; idx: number; hedef: Hucre | null; gecerli: boolean };
  let surukleme: Surukleme | null = null;
  let tutmaZamani = 0;
  let sonSurukleme = 0;
  let uzunBasis: { x: number; y: number } | null = null;
  let oturma: { t0: number; ax: number; az: number; bx: number; bz: number; anahtar: string; hedef: Hucre } | null = null;
  const HEDEF_KENAR = ARALIK - 14;
  const hedefMal = new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0.3, depthWrite: false, toneMapped: false });
  const hedefVurguMal = new THREE.MeshBasicMaterial({ color: VURGU, transparent: true, opacity: 0.5, depthWrite: false, toneMapped: false });
  const hedefVurgu = new THREE.Mesh(plakaGeo, hedefVurguMal);
  hedefVurgu.rotation.x = -Math.PI / 2;
  hedefVurgu.scale.set(HEDEF_KENAR, HEDEF_KENAR, 1);
  const hayaletMal = new THREE.LineBasicMaterial({ color: VURGU, toneMapped: false });
  const hayalet = new THREE.LineSegments(kenarGeo, hayaletMal);
  hedefVurgu.visible = hayalet.visible = false;
  sahne.add(hedefVurgu, hayalet);
  let hedefAgi: THREE.InstancedMesh | null = null;
  const _yatay = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2);
  const _hm = new THREE.Matrix4();
  const _hp = new THREE.Vector3();
  const _hs = new THREE.Vector3();
  const zemin = new THREE.Plane(new THREE.Vector3(0, 1, 0), -GY);
  const _zp = new THREE.Vector3();
  const hucreMerkezi = (h: Hucre): [number, number] => (sehir ? [(h[0] - sehir.izgara.cx) * ARALIK, (h[1] - sehir.izgara.cz) * ARALIK] : [0, 0]);

  function suruklemeBasla(anahtar: string) {
    if (!sehir || surukleme) return;
    const idx = modeller.findIndex((b) => b.anahtar === anahtar);
    const k = kutuOf(anahtar, null);
    if (idx < 0 || !k) return;
    ucus = null;
    donus = null;
    kontrol.enabled = false;
    surukleme = { anahtar, idx, hedef: null, gecerli: false };
    const bos = bosHedefler(sehir.izgara.hucreler, idx);
    hedefAgi = new THREE.InstancedMesh(plakaGeo, hedefMal, Math.max(1, bos.length));
    bos.forEach((h, n) => {
      const [x, z] = hucreMerkezi(h);
      _hm.compose(_hp.set(x, GY + 0.06, z), _yatay, _hs.set(HEDEF_KENAR, HEDEF_KENAR, 1));
      hedefAgi!.setMatrixAt(n, _hm);
    });
    hedefAgi.count = bos.length;
    sahne.add(hedefAgi);
    kutuyaOturt(hayalet, k, 1.2);
    hayalet.visible = true;
    R.domElement.style.cursor = "grabbing";
    try {
      navigator.vibrate?.(12);
    } catch {}
    iste();
  }
  function suruklemeGuncelle(cx: number, cy: number) {
    const s = surukleme;
    if (!s || !sehir) return;
    const r = R.domElement.getBoundingClientRect();
    ndc.set(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1);
    isin.setFromCamera(ndc, kamera);
    if (!isin.ray.intersectPlane(zemin, _zp)) return;
    const h: Hucre = [Math.round(_zp.x / ARALIK + sehir.izgara.cx), Math.round(_zp.z / ARALIK + sehir.izgara.cz)];
    const simdiki = sehir.izgara.hucreler[s.idx];
    s.hedef = h;
    s.gecerli = !(h[0] === simdiki[0] && h[1] === simdiki[1]) && hedefGecerli(sehir.izgara.hucreler, s.idx, h);
    hayalet.position.x = _zp.x;
    hayalet.position.z = _zp.z;
    if (s.gecerli) {
      const [x, z] = hucreMerkezi(h);
      const dolu = sehir.izgara.hucreler.some((c, i) => i !== s.idx && c[0] === h[0] && c[1] === h[1]);
      hedefVurguMal.color.set(dolu ? "#e6b23c" : VURGU);
      hedefVurgu.position.set(x, GY + 0.08, z);
      hedefVurgu.visible = true;
    } else hedefVurgu.visible = false;
    iste();
  }
  function suruklemeBitir(birak: boolean) {
    const s = surukleme;
    if (!s) return;
    surukleme = null;
    sonSurukleme = performance.now();
    kontrol.enabled = true;
    R.domElement.style.cursor = "";
    if (hedefAgi) {
      sahne.remove(hedefAgi);
      hedefAgi.dispose();
      hedefAgi = null;
    }
    hedefVurgu.visible = false;
    if (birak && s.gecerli && s.hedef) {
      const [bx, bz] = hucreMerkezi(s.hedef);
      oturma = { t0: performance.now(), ax: hayalet.position.x, az: hayalet.position.z, bx, bz, anahtar: s.anahtar, hedef: s.hedef };
    } else hayalet.visible = false;
    iste();
  }

  function uzerindeAyarla(h: { bina: string; blok: string | null } | null) {
    const id = h ? `${h.bina}|${h.blok ?? ""}` : null;
    if (id === uzerindeAnahtar) return;
    uzerindeAnahtar = id;
    R.domElement.style.cursor = h ? "pointer" : "";
    const k = h && (h.bina !== secim.bina || (h.blok ?? null) !== secim.blok) ? kutuOf(h.bina, h.blok) : null;
    if (k) {
      kutuyaOturt(ustKenar, k, 0.6);
      ustKenar.visible = true;
    } else ustKenar.visible = false;
    iste();
  }

  const _dp = new THREE.Vector3();
  const _dq = new THREE.Quaternion();
  const _ds = new THREE.Vector3();
  const _dm = new THREE.Matrix4();
  function dumaniYerlestir(evre: (i: number) => number) {
    const ag = sehir?.dumanAgi;
    if (!sehir || !ag) return;
    let k = 0;
    for (const [x, y, z] of sehir.dumanKaynaklari) {
      for (let i = 0; i < DUMAN_BULUTU; i++) {
        const c = dumanBulutu(evre(i));
        _dm.compose(_dp.set(x + c.dx, y + c.dy, z + c.dz), _dq, _ds.setScalar(c.olcek));
        ag.setMatrixAt(k++, _dm);
      }
    }
    ag.instanceMatrix.needsUpdate = true;
  }
  /** Bu karede canlılık öğesi oynatılmalı mı (cihaz + görünürlük + sahnede öğe var mı) */
  function canliOge() {
    if (!canli || !sekmeAcik || !ekranda || !sehir) return false;
    return sehir.dumanKaynaklari.length > 0 || !!(secim.birim && sehir.birimPencereleri.has(secim.birim));
  }
  function canlandir(t: number) {
    if (!sehir) return;
    dumaniYerlestir((i) => dumanEvresi(t, i, DUMAN_BULUTU));
    const pl = secim.birim ? sehir.birimPencereleri.get(secim.birim) : undefined;
    if (pl) {
      parlama = parlamaKatsayisi(t);
      for (const i of pl) sehir.pencereAgi.setColorAt(i, pencereRengi(i, _col));
      if (sehir.pencereAgi.instanceColor) sehir.pencereAgi.instanceColor.needsUpdate = true;
    }
    canlandirildi = true;
    // Güvenlik: kareler sürekli yavaşsa (>28 ms) canlılık kapanır, sahne sabit kalır
    const dt = oncekiKare ? t - oncekiKare : 0;
    oncekiKare = t;
    if (dt > 0 && dt < 200) {
      yavasKare = dt > 28 ? yavasKare + 1 : Math.max(0, yavasKare - 1);
      if (yavasKare > 90) canli = false;
    }
  }
  /** Canlılık durunca öğeleri sabit hâline döndür (duman yerleşimi, sabit parlama) */
  function sabitle() {
    canlandirildi = false;
    oncekiKare = 0;
    parlama = parlamaKatsayisi(null);
    dumaniYerlestir((i) => (i + 0.5) / DUMAN_BULUTU);
    pencereleriBoya();
  }

  function kare(t: number) {
    raf = 0;
    let devam = false;
    if (ucus) {
      const u = Math.min(1, (t - ucus.t0) / ucus.ms);
      const e = u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
      kontrol.target.lerpVectors(ucus.ft, ucus.tt, e);
      kamera.position.lerpVectors(ucus.fc, ucus.tc, e);
      if (u >= 1) ucus = null;
      else devam = true;
    }
    if (donus) {
      const u = Math.min(1, (t - donus.t0) / donus.ms);
      const e = 1 - Math.pow(1 - u, 3);
      const da = donus.a * e - donus.yapilan;
      donus.yapilan += da;
      _dv.copy(kamera.position).sub(kontrol.target).applyAxisAngle(Y, da);
      kamera.position.copy(kontrol.target).add(_dv);
      if (u >= 1) donus = null;
      else devam = true;
    }
    kontrol.update();
    // kaydırma sınırı: hedef şehir dışına çıkmasın
    if (sehir) {
      const tx = THREE.MathUtils.clamp(kontrol.target.x, -sehir.sinirX, sehir.sinirX);
      const tz = THREE.MathUtils.clamp(kontrol.target.z, -sehir.sinirZ, sehir.sinirZ);
      const ty = THREE.MathUtils.clamp(kontrol.target.y, 0, 40);
      if (tx !== kontrol.target.x || ty !== kontrol.target.y || tz !== kontrol.target.z) {
        _dv.set(tx - kontrol.target.x, ty - kontrol.target.y, tz - kontrol.target.z);
        kontrol.target.add(_dv);
        kamera.position.add(_dv);
      }
    }
    if (kamera.position.y < GY + 1.3) kamera.position.y = GY + 1.3;
    if (bekleyenUzerinde) {
      const h = sec(bekleyenUzerinde[0], bekleyenUzerinde[1]);
      bekleyenUzerinde = null;
      uzerindeAyarla(h);
    }
    if (solukAnim && solukAdimi()) devam = true;
    if (oturma) {
      const u = azHareket ? 1 : Math.min(1, (t - oturma.t0) / 180);
      const e = 1 - Math.pow(1 - u, 3);
      hayalet.position.x = oturma.ax + (oturma.bx - oturma.ax) * e;
      hayalet.position.z = oturma.az + (oturma.bz - oturma.az) * e;
      if (u >= 1) {
        const o = oturma;
        oturma = null;
        hayalet.visible = false;
        geri.onTasi(o.anahtar, o.hedef);
      } else devam = true;
    }
    if (canliOge()) {
      canlandir(t);
      devam = true;
    } else if (canlandirildi) sabitle();
    R.render(sahne, kamera);
    etiketleriYerlestir();
    if (devam) iste();
  }

  function sehriSok() {
    if (!sehir) return;
    sahne.remove(sehir.binaAgi, sehir.zeminAgi, sehir.pencereAgi);
    if (sehir.dumanAgi) sahne.remove(sehir.dumanAgi);
    for (const t of sehir.tabelalar) sahne.remove(t.mesh);
    sehir.temizle();
    sehir = null;
    vurusGeo.forEach((g) => g.dispose());
    vurusGeo.length = 0;
    vurusAglari = [];
    etiketler.forEach((e) => e.el.remove());
    etiketler = new Map();
  }

  const motor: Motor = {
    sehriKur(binalar, hucreler, kameraKoru) {
      const ilkKurulum = !sehir;
      if (surukleme) suruklemeBitir(false);
      sehriSok();
      modeller = binalar;
      solukHedef.length = solukSimdi.length = 0;
      if (binalar.length === 0) {
        seciliKenar.visible = plaka.visible = ustKenar.visible = false;
        iste();
        return;
      }
      sehir = sehirKur(binalar, binaMal, zeminMal, pencereMal, hucreler ?? undefined);
      solukU.value = sehir.solukDoku;
      sayiU.value = Math.max(1, binalar.length);
      sehir.binaAgi.castShadow = sehir.binaAgi.receiveShadow = golge;
      sehir.zeminAgi.receiveShadow = golge;
      sehir.pencereAgi.receiveShadow = golge;
      // Gölge kamerası şehrin boyutuna göre
      const sb = Math.max(sehir.sinirX, sehir.sinirZ) + 31;
      Object.assign(gunes.shadow.camera, { left: -sb, right: sb, top: sb, bottom: -sb, near: 20, far: 420 * sehir.olcek });
      gunes.shadow.camera.updateProjectionMatrix();
      gunes.position.set(95, 150, 80).multiplyScalar(Math.max(1, sehir.olcek));
      sahne.add(sehir.binaAgi, sehir.zeminAgi, sehir.pencereAgi);
      if (sehir.dumanAgi) sahne.add(sehir.dumanAgi);
      for (const t of sehir.tabelalar) sahne.add(t.mesh);
      R.shadowMap.needsUpdate = true;
      sahne.fog = new THREE.Fog("#dfe6e1", 300 * sehir.olcek, 760 * sehir.olcek);
      kontrol.maxDistance = 380 * sehir.olcek;
      for (const h of sehir.vuruslar) {
        const g = new THREE.BoxGeometry(h.w, h.h, h.d);
        vurusGeo.push(g);
        const m = new THREE.Mesh(g, vurusMal);
        m.position.set(h.x, h.y + h.h / 2, h.z);
        m.visible = false;
        m.userData = { bina: h.bina, blok: h.blok };
        m.updateMatrixWorld();
        vurusAglari.push(m);
      }
      // HTML etiketler: metin yalnız textContent ile (kullanıcı verisi)
      for (const b of binalar) {
        const el = document.createElement("button");
        el.type = "button";
        // İçerik: durum noktası + "Bina adı · N birim" (il plakası yok)
        const nokta = document.createElement("span");
        nokta.className = "w-[7px] h-[7px] rounded-full flex-none";
        const ad = document.createElement("span");
        ad.className = "ad truncate";
        ad.textContent = b.ad;
        const sayi = document.createElement("span");
        sayi.className = "flex-none font-medium text-slate-500";
        sayi.textContent = `· ${b.birimler.length} birim`;
        el.append(nokta, ad, sayi);
        el.title = `${b.ad} · ${b.birimler.length} birim`;
        el.addEventListener("click", () => geri.onSec(b.anahtar, null, null));
        el.hidden = true;
        etiketKabi.appendChild(el);
        etiketler.set(b.anahtar, { el, duzey: "", sinif: "", w: 0, h: 0 });
      }
      boyutla();
      if (ilkKurulum) kusBakisi(true);
      else if (!kameraKoru) kusBakisi(false);
      soluklariGuncelle(true);
      solukDokuyuYaz();
      pencereleriBoya();
      motor.sec(secim);
    },
    sec(s) {
      const onceki = secim;
      secim = s;
      if (!sehir) return;
      pencereleriBoya();
      soluklariGuncelle(false);
      const k = s.bina ? kutuOf(s.bina, s.blok) : null;
      if (!k) {
        seciliKenar.visible = plaka.visible = false;
        // Odaktan çıkınca (panel kapatıldı) tüm şehre geri uç
        if (onceki.bina && !s.bina) kusBakisi(false);
        iste();
        return;
      }
      kutuyaOturt(seciliKenar, k, 0.8);
      seciliKenar.visible = true;
      plaka.scale.set(k.w + 6, k.d + 6, 1);
      plaka.position.set(k.x, GY + 0.03, k.z);
      plaka.visible = true;
      if (s.bina !== onceki.bina || s.blok !== onceki.blok) binayaOdaklan(s.bina!, s.blok);
      iste();
    },
    yalnizGecikmis(v) {
      gecikmisFiltre = v;
      soluklariGuncelle(false);
    },
    etiketKipi(k) {
      etiketKipi = k;
      iste();
    },
    yakinlas(f) {
      const off = kamera.position.clone().sub(kontrol.target);
      const uz = THREE.MathUtils.clamp(off.length() * f, kontrol.minDistance, kontrol.maxDistance);
      ucusBaslat(kontrol.target.clone(), kontrol.target.clone().add(off.setLength(uz)), 320);
    },
    dondur(a) {
      ucus = null;
      if (azHareket) {
        const off = kamera.position.clone().sub(kontrol.target).applyAxisAngle(Y, a);
        kamera.position.copy(kontrol.target).add(off);
        iste();
        return;
      }
      donus = { t0: performance.now(), ms: 480, a, yapilan: 0 };
      iste();
    },
    kusBakisi: () => kusBakisi(false),
    birak() {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      gozlem.disconnect();
      ekranGozlem.disconnect();
      document.removeEventListener("visibilitychange", gorunurlukDegisti);
      R.domElement.removeEventListener("pointerdown", onDown);
      R.domElement.removeEventListener("pointerup", onUp);
      R.domElement.removeEventListener("pointermove", onMove);
      R.domElement.removeEventListener("pointerleave", onLeave);
      yuzey.removeEventListener("touchstart", onJestBasla);
      yuzey.removeEventListener("touchmove", onJest);
      yuzey.removeEventListener("touchend", onJestBitti);
      yuzey.removeEventListener("touchcancel", onJestBitti);
      yuzey.removeEventListener("contextmenu", sagTikEngeli);
      window.removeEventListener("keydown", tusla);
      clearTimeout(tutmaZamani);
      hedefAgi?.dispose();
      hedefMal.dispose();
      hedefVurguMal.dispose();
      hayaletMal.dispose();
      kontrol.dispose();
      sehriSok();
      binaMal.dispose();
      zeminMal.dispose();
      pencereMal.dispose();
      vurusMal.dispose();
      kenarGeo.dispose();
      (seciliKenar.material as THREE.Material).dispose();
      (ustKenar.material as THREE.Material).dispose();
      plakaGeo.dispose();
      (plaka.material as THREE.Material).dispose();
      gok.dispose();
      R.dispose();
      R.forceContextLoss();
      R.domElement.remove();
    },
  };
  return motor;
}

export default function Sehir3D({
  binalar,
  secim,
  yalnizGecikmis,
  il,
  onSec,
}: {
  binalar: Bina[];
  secim: Sehir3DSecim;
  yalnizGecikmis: boolean;
  /** Seçili il ("" = tüm iller); bina düzeni il başına saklanır */
  il: string;
  onSec: (bina: string | null, birim: string | null, blok: string | null) => void;
}) {
  const kapRef = useRef<HTMLDivElement>(null);
  const etiketRef = useRef<HTMLDivElement>(null);
  const motorRef = useRef<Motor | null>(null);
  const onSecRef = useRef(onSec);
  useEffect(() => {
    onSecRef.current = onSec;
  });

  const modeller = useMemo(() => binalar.map(sehirBinasi), [binalar]);
  // Yalnız görünümü etkileyen değişiklikte sahneyi yeniden kur
  const imza = useMemo(
    () => modeller.map((b) => `${b.anahtar}:${b.aile}:${b.birimler.map((u) => u.id + u.durum).join(",")}`).join("|"),
    [modeller]
  );

  // Bina düzeni (kullanıcı taşıdıysa) — il başına, hesap düzeyinde
  const { duzen, yuklendi, kaydet } = useSehirDuzeni(il);
  const hucreler = useMemo(() => yerlesimCoz(modeller.map((b) => b.anahtar), duzen), [modeller, duzen]);
  const duzenImzasi = hucreler.map((h) => h.join(",")).join(";");
  const ozel = !!duzen && Object.keys(duzen).length > 0;
  const tasiRef = useRef<(anahtar: string, hedef: Hucre) => void>(() => {});
  useEffect(() => {
    tasiRef.current = (anahtar, hedef) => {
      const idx = modeller.findIndex((b) => b.anahtar === anahtar);
      const yeni = tasi(
        modeller.map((b) => b.anahtar),
        hucreler,
        idx,
        hedef
      );
      if (yeni) kaydet(yeni);
    };
  });

  // Etiket tercihi (cihazda): Açık / Kapalı (eski "rozet"/"ad" kayıtları = Açık)
  const [etiketKipi, setEtiketKipi] = useState<EtiketKipi>(() => {
    try {
      if (window.localStorage.getItem("mizan_etiket_kipi") === "kapali") return "kapali";
    } catch {}
    return "acik";
  });
  useEffect(() => {
    motorRef.current?.etiketKipi(etiketKipi);
    try {
      window.localStorage.setItem("mizan_etiket_kipi", etiketKipi);
    } catch {}
  }, [etiketKipi]);

  useEffect(() => {
    const kap = kapRef.current;
    const etiket = etiketRef.current;
    if (!kap || !etiket) return;
    const motor = motorKur(kap, etiket, {
      onSec: (b, u, k) => onSecRef.current(b, u, k),
      onTasi: (a, h) => tasiRef.current(a, h),
    });
    motorRef.current = motor;
    return () => {
      motor.birak();
      motorRef.current = null;
    };
  }, []);

  // Düzen yüklenince kur. Aynı binalar kaldıysa (düzen, görünüm ya da birim
  // durumu değişti) kamera yerinde kalır; bina listesi değiştiyse kuş bakışına döner.
  const sonAnahtarlar = useRef<string | null>(null);
  useEffect(() => {
    if (!yuklendi || !motorRef.current) return;
    const anahtarlar = modeller.map((b) => b.anahtar).join("|");
    const ayniBinalar = sonAnahtarlar.current === anahtarlar;
    sonAnahtarlar.current = anahtarlar;
    motorRef.current.etiketKipi(etiketKipi);
    motorRef.current.sehriKur(modeller, hucreler, ayniBinalar);
    // imza / düzen değişmedikçe yeniden kurma
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imza, duzenImzasi, yuklendi]);

  useEffect(() => {
    motorRef.current?.sec(secim);
  }, [secim]);

  useEffect(() => {
    motorRef.current?.yalnizGecikmis(yalnizGecikmis);
  }, [yalnizGecikmis]);


  const seciliAd = secim.bina ? modeller.find((b) => b.anahtar === secim.bina)?.ad : null;
  const dugme = "w-9 h-9 rounded-xl border border-gray-200 bg-white shadow-sm grid place-items-center text-lg font-semibold text-slate-700 hover:bg-gray-50";

  return (
    <div className="absolute inset-0">
      <div ref={kapRef} className="absolute inset-0" />
      <div ref={etiketRef} className="absolute inset-0 pointer-events-none overflow-hidden z-[2]" />

      <div className="absolute left-3 top-3 z-[3] flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          aria-pressed={etiketKipi === "acik"}
          onClick={() => setEtiketKipi(etiketKipi === "acik" ? "kapali" : "acik")}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white/90 px-2 py-1 text-[11px] font-semibold text-slate-600 shadow-sm hover:bg-gray-50"
        >
          Etiketler:
          <b className={etiketKipi === "acik" ? "text-[#0a7c76]" : "text-slate-400"}>{etiketKipi === "acik" ? "Açık" : "Kapalı"}</b>
        </button>
        {ozel && (
          <button
            type="button"
            onClick={() => kaydet(null)}
            title="Binaları varsayılan sıraya döndür (bu il)"
            className="rounded-lg border border-gray-200 bg-white/90 px-2 py-1 text-[11px] font-semibold text-slate-600 shadow-sm hover:bg-gray-50"
          >
            Düzeni sıfırla
          </button>
        )}
      </div>

      {modeller.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-slate-500 pointer-events-none">Bu ilde kayıtlı mülk yok.</div>
      )}

      <div className="absolute right-3 bottom-3 z-[3] flex flex-col gap-1.5">
        <button type="button" className={dugme} aria-label="Yakınlaştır" onClick={() => motorRef.current?.yakinlas(1 / 1.4)}>
          +
        </button>
        <button type="button" className={dugme} aria-label="Uzaklaştır" onClick={() => motorRef.current?.yakinlas(1.4)}>
          −
        </button>
        <button type="button" className={dugme} aria-label="Sola 45° döndür" title="Sola 45° döndür" onClick={() => motorRef.current?.dondur(Math.PI / 4)}>
          <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] fill-none stroke-current stroke-2" aria-hidden="true">
            <path d="M4.5 9.5A8 8 0 1 1 6 17.2" />
            <path d="M4 4.5v5h5" />
          </svg>
        </button>
        <button type="button" className={dugme} aria-label="Sağa 45° döndür" title="Sağa 45° döndür" onClick={() => motorRef.current?.dondur(-Math.PI / 4)}>
          <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] fill-none stroke-current stroke-2" aria-hidden="true">
            <path d="M19.5 9.5A8 8 0 1 0 18 17.2" />
            <path d="M20 4.5v5h-5" />
          </svg>
        </button>
      </div>

      {seciliAd ? (
        <div className="absolute left-1/2 -translate-x-1/2 bottom-3 z-[3] flex items-center gap-2 max-w-[calc(100%-120px)] rounded-full bg-[#06211f] text-white text-xs font-semibold pl-3 pr-1 py-1 shadow-lg">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#2fcfc6] flex-none">Odak</span>
          <b className="truncate min-w-0">{seciliAd}</b>
          <button
            type="button"
            aria-label="Odaktan çık, tüm şehri göster"
            onClick={() => {
              onSecRef.current(null, null, null);
              motorRef.current?.kusBakisi();
            }}
            className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-base leading-none flex-none"
          >
            ×
          </button>
        </div>
      ) : (
        <div className="absolute left-3 bottom-3 z-[3] max-w-[calc(100%-80px)] text-[11px] text-slate-500 bg-white/95 border border-gray-200 rounded-md px-2 py-1">
          <span className="hidden [@media(pointer:fine)]:inline">Sürükle: kaydır · Sağ tık: döndür · Tekerlek: yakınlaştır · Binayı basılı tut (ya da Shift) + sürükle: taşı</span>
          <span className="[@media(pointer:fine)]:hidden">İki parmak: yakınlaştır/kaydır · Çift dokun: yaklaş · Uzun bas + sürükle: taşı</span>
        </div>
      )}
    </div>
  );
}
