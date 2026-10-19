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
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { gecikmeVar, sehirBinasi, type SehirBinasi } from "@/lib/sehir3dModeli";
import type { Bina } from "@/lib/yeniPanelBina";
import type { BirimDurumu } from "@/lib/yeniPanelTipleri";
import { GY, sehirKur, type Kutu, type Sehir } from "@/components/yeni-panel/sehir3d/insa";

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

type Motor = {
  sehriKur: (binalar: SehirBinasi[]) => void;
  sec: (s: Sehir3DSecim) => void;
  yalnizGecikmis: (v: boolean) => void;
  /** "Tüm iller" görünümünde etiketlerde il plaka kodu gösterilir */
  plakalar: (v: boolean) => void;
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
  geri: { onSec: (bina: string | null, birim: string | null, blok: string | null) => void }
): Motor {
  const azHareket = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  // Telefon/tablet: DPR 1 (pil ve ısı), tek parmak sayfayı kaydırır
  const dokunmatik = window.matchMedia("(pointer: coarse)").matches;
  const R = new THREE.WebGLRenderer({ antialias: !dokunmatik, powerPreference: "default" });
  R.setPixelRatio(dokunmatik ? 1 : Math.min(window.devicePixelRatio || 1, 1.5));
  R.outputColorSpace = THREE.SRGBColorSpace;
  R.toneMapping = THREE.ACESFilmicToneMapping;
  R.toneMappingExposure = 1.05;
  // Gölge: masaüstünde açık (önizleme v6 ile aynı), telefonda kapalı
  const golge = !dokunmatik;
  R.shadowMap.enabled = golge;
  R.shadowMap.type = THREE.PCFSoftShadowMap;
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
  // sahne iki parmakla kaydırılır/yakınlaştırılır, dokunma seçer. (OrbitControls
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
  kontrol.touches = dokunmatik
    ? { ONE: null, TWO: THREE.TOUCH.DOLLY_PAN }
    : { ONE: THREE.TOUCH.PAN, TWO: THREE.TOUCH.DOLLY_ROTATE };

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
  let etiketler = new Map<string, { el: HTMLButtonElement; yakin: boolean; sinif: string }>();
  let secim: Sehir3DSecim = { bina: null, blok: null, birim: null };
  let gecikmisFiltre = false;
  let plakaGoster = true;
  const solukHedef: number[] = [];
  const solukSimdi: number[] = [];
  let solukAnim = false;

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

  function pencereRengi(i: number, out: THREE.Color) {
    if (!sehir) return out;
    const p = sehir.pencereler[i];
    out.set(PENCERE_RENGI[p.durum ?? "suslu"]);
    const d = p.idx >= 0 ? solukSimdi[p.idx] ?? 0 : 0;
    if (d > 0) out.lerp(SOLUK, Math.min(0.85, d * 1.1));
    if (secim.birim && p.birim === secim.birim) out.lerp(BEYAZ, 0.45);
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
      etiketSinifi(e, secili);
      e.el.setAttribute("aria-label", `${b.ad}, ${b.birimler.length} birim, ${sayac.gecikmis} gecikmiş`);
    });
  }
  function etiketSinifi(e: { el: HTMLButtonElement; yakin: boolean; sinif: string }, secili: boolean) {
    e.el.className = `absolute left-0 top-0 pointer-events-auto flex items-center gap-1.5 rounded-full bg-white border shadow-sm text-xs font-semibold text-slate-800 whitespace-nowrap py-[3px] pl-1.5 pr-1 hover:border-[#17B6AE] will-change-transform ${e.sinif}`;
    const ad = e.el.children[2] as HTMLElement;
    ad.style.display = e.yakin || secili ? "inline" : "none";
  }

  function etiketleriYerlestir() {
    if (!sehir) return;
    const W2 = kap.clientWidth;
    const H2 = kap.clientHeight;
    const alcak = kamera.position.y < 16;
    const YAKIN = (W2 < 680 ? 95 : 150) * Math.max(1, sehir.olcek * 0.9);
    for (const b of modeller) {
      const bi = sehir.binalar.get(b.anahtar);
      const e = etiketler.get(b.anahtar);
      if (!bi || !e) continue;
      _tv.set(bi.x, GY + bi.ust + 1.6, bi.z).project(kamera);
      const gorunur = (!alcak || b.anahtar === secim.bina) && _tv.z < 1 && _tv.x > -1.15 && _tv.x < 1.15 && _tv.y > -1.1 && _tv.y < 1.25;
      if (!gorunur) {
        e.el.hidden = true;
        continue;
      }
      e.el.hidden = false;
      const yakin = _cv.set(bi.x, GY + bi.ust * 0.5, bi.z).distanceTo(kamera.position) < YAKIN;
      if (yakin !== e.yakin) {
        e.yakin = yakin;
        etiketSinifi(e, secim.bina === b.anahtar);
      }
      e.el.style.zIndex = b.anahtar === secim.bina ? "1000" : String(Math.round((1 - _tv.z) * 400));
      e.el.style.transform = `translate(${((_tv.x * 0.5 + 0.5) * W2).toFixed(1)}px,${((-_tv.y * 0.5 + 0.5) * H2).toFixed(1)}px) translate(-50%,-100%)`;
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
  function kusBakisi(aninda = false) {
    if (!sehir) return;
    const k = Math.max(1, 1.45 / Math.max(0.5, kamera.aspect || 1.4)) * sehir.olcek * (sehir.gx > 3 ? 1.24 : 1);
    const [mx, mz] = sehir.merkez;
    const tp = new THREE.Vector3(mx, 2, mz + 8 * sehir.olcek);
    const cp = new THREE.Vector3(mx + 96 * k, 104 * k, mz + 142 * k);
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
  let basili: { x: number; y: number; dugme: number } | null = null;
  const onDown = (e: PointerEvent) => {
    basili = { x: e.clientX, y: e.clientY, dugme: e.button };
  };
  const onUp = (e: PointerEvent) => {
    if (!basili) return;
    const oynadi = Math.abs(e.clientX - basili.x) + Math.abs(e.clientY - basili.y);
    const dugme = basili.dugme;
    basili = null;
    if (oynadi > 6 || dugme !== 0) return;
    const h = sec(e.clientX, e.clientY);
    if (!h) {
      if (secim.bina) geri.onSec(null, null, null);
      return;
    }
    geri.onSec(h.bina, h.birim, h.blok);
  };
  const onMove = (e: PointerEvent) => {
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
    sehriKur(binalar) {
      const ilkKurulum = !sehir;
      sehriSok();
      modeller = binalar;
      solukHedef.length = solukSimdi.length = 0;
      if (binalar.length === 0) {
        seciliKenar.visible = plaka.visible = ustKenar.visible = false;
        iste();
        return;
      }
      sehir = sehirKur(binalar, binaMal, zeminMal, pencereMal);
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
        const nokta = document.createElement("span");
        nokta.className = "w-2 h-2 rounded-full flex-none";
        const plaka = document.createElement("span");
        plaka.className = "text-[10px] font-extrabold px-1.5 rounded-lg bg-[#f5f2ea] text-slate-500 border border-[#dbe3df] tracking-wide";
        plaka.textContent = b.plaka ?? "";
        plaka.title = "İl plaka kodu";
        const ad = document.createElement("span");
        ad.textContent = b.kuleler.length > 1 ? `${b.ad} · ${b.kuleler.map((k) => `${k.ad} ${k.izgara.flat().filter(Boolean).length}`).join(" / ")}` : b.ad;
        plaka.hidden = !plakaGoster || !b.plaka;
        el.append(nokta, plaka, ad);
        if (b.birimler.length > 1) {
          const c = document.createElement("span");
          c.className = "text-[10.5px] font-bold px-1.5 rounded-full bg-[#06211f] text-white";
          c.textContent = String(b.birimler.length);
          el.append(c);
        }
        el.title = b.ad;
        el.addEventListener("click", () => geri.onSec(b.anahtar, null, null));
        etiketKabi.appendChild(el);
        etiketler.set(b.anahtar, { el, yakin: false, sinif: "" });
      }
      boyutla();
      if (ilkKurulum) kusBakisi(true);
      else kusBakisi(false);
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
    plakalar(v) {
      plakaGoster = v;
      etiketler.forEach((e, anahtar) => {
        const p = e.el.children[1] as HTMLElement;
        p.hidden = !v || !modeller.find((m) => m.anahtar === anahtar)?.plaka;
      });
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
      R.domElement.removeEventListener("pointerdown", onDown);
      R.domElement.removeEventListener("pointerup", onUp);
      R.domElement.removeEventListener("pointermove", onMove);
      R.domElement.removeEventListener("pointerleave", onLeave);
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
  tumIller,
  onSec,
}: {
  binalar: Bina[];
  secim: Sehir3DSecim;
  yalnizGecikmis: boolean;
  tumIller: boolean;
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

  useEffect(() => {
    const kap = kapRef.current;
    const etiket = etiketRef.current;
    if (!kap || !etiket) return;
    const motor = motorKur(kap, etiket, { onSec: (b, u, k) => onSecRef.current(b, u, k) });
    motorRef.current = motor;
    return () => {
      motor.birak();
      motorRef.current = null;
    };
  }, []);

  useEffect(() => {
    motorRef.current?.sehriKur(modeller);
    // imza değişmedikçe yeniden kurma
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imza]);

  useEffect(() => {
    motorRef.current?.sec(secim);
  }, [secim]);

  useEffect(() => {
    motorRef.current?.yalnizGecikmis(yalnizGecikmis);
  }, [yalnizGecikmis]);

  useEffect(() => {
    motorRef.current?.plakalar(tumIller);
  }, [tumIller, imza]);

  const seciliAd = secim.bina ? modeller.find((b) => b.anahtar === secim.bina)?.ad : null;
  const dugme = "w-9 h-9 rounded-xl border border-gray-200 bg-white shadow-sm grid place-items-center text-lg font-semibold text-slate-700 hover:bg-gray-50";

  return (
    <div className="absolute inset-0">
      <div ref={kapRef} className="absolute inset-0" />
      <div ref={etiketRef} className="absolute inset-0 pointer-events-none overflow-hidden z-[2]" />

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
          <span className="hidden [@media(pointer:fine)]:inline">Sürükle: kaydır · Sağ tık: döndür · Tekerlek: yakınlaştır · Binaya dokun</span>
          <span className="[@media(pointer:fine)]:hidden">İki parmak: kaydır/yakınlaştır · Binaya dokun</span>
        </div>
      )}
    </div>
  );
}
