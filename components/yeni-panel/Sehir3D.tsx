"use client";

// Mülk Şehrim — 3D sahne. Bu dosya yalnız next/dynamic (ssr:false) ile
// yüklenir; three.js ayrı bir parçada (chunk) gelir ve klasik panele hiç inmez.
//
// A aşaması: kütüphanenin derlendiğini ve sahnenin kurulup söküldüğünü
// doğrulayan iskelet (yer tutucu bloklar). Prosedürel binalar ve pencere =
// birim renklendirmesi E aşamasında eklenecek.
//
// Performans kuralları (mobil dahil): DPR 1, gölge kapalı, sürekli döngü yok —
// yalnız kamera hareket edince çizilir; bileşen kalkınca her şey dispose edilir.
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { MapControls } from "three/addons/controls/MapControls.js";

export default function Sehir3D({ binaSayisi }: { binaSayisi: number }) {
  const kapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const kap = kapRef.current;
    if (!kap) return;

    const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: "low-power" });
    renderer.setPixelRatio(1);
    renderer.shadowMap.enabled = false;
    renderer.setClearColor(0xeef1ea);
    kap.appendChild(renderer.domElement);

    const sahne = new THREE.Scene();
    const kamera = new THREE.PerspectiveCamera(40, 1, 1, 2000);
    kamera.position.set(60, 70, 60);

    sahne.add(new THREE.HemisphereLight(0xffffff, 0xb9c7c1, 2.2));
    const gunes = new THREE.DirectionalLight(0xffffff, 1.2);
    gunes.position.set(40, 80, 20);
    sahne.add(gunes);

    const zeminGeo = new THREE.PlaneGeometry(400, 400);
    const zeminMat = new THREE.MeshLambertMaterial({ color: 0xe5ebe4 });
    const zemin = new THREE.Mesh(zeminGeo, zeminMat);
    zemin.rotation.x = -Math.PI / 2;
    sahne.add(zemin);

    // Yer tutucu: kayıtlı bina sayısı kadar blok (ızgara; boş arsa yok).
    const adet = Math.max(0, Math.min(binaSayisi, 400));
    const kenar = Math.max(1, Math.ceil(Math.sqrt(adet)));
    const kutuGeo = new THREE.BoxGeometry(8, 1, 8);
    const kutuMat = new THREE.MeshLambertMaterial({ color: 0x17b6ae });
    const bloklar = new THREE.InstancedMesh(kutuGeo, kutuMat, Math.max(1, adet));
    bloklar.count = adet;
    const m = new THREE.Matrix4();
    for (let i = 0; i < adet; i++) {
      const x = (i % kenar) - (kenar - 1) / 2;
      const z = Math.floor(i / kenar) - (kenar - 1) / 2;
      const h = 6 + ((i * 7) % 5) * 4;
      m.compose(
        new THREE.Vector3(x * 14, h / 2, z * 14),
        new THREE.Quaternion(),
        new THREE.Vector3(1, h, 1)
      );
      bloklar.setMatrixAt(i, m);
    }
    sahne.add(bloklar);

    const kontrol = new MapControls(kamera, renderer.domElement);
    kontrol.enableDamping = false;
    kontrol.maxPolarAngle = Math.PI / 2.4;
    kontrol.minDistance = 30;
    kontrol.maxDistance = 400;

    const ciz = () => renderer.render(sahne, kamera);
    kontrol.addEventListener("change", ciz);

    const boyutla = () => {
      const w = kap.clientWidth || 1;
      const h = kap.clientHeight || 1;
      renderer.setSize(w, h, false);
      renderer.domElement.style.width = "100%";
      renderer.domElement.style.height = "100%";
      kamera.aspect = w / h;
      kamera.updateProjectionMatrix();
      ciz();
    };
    const gozlem = new ResizeObserver(boyutla);
    gozlem.observe(kap);
    boyutla();

    return () => {
      gozlem.disconnect();
      kontrol.removeEventListener("change", ciz);
      kontrol.dispose();
      zeminGeo.dispose();
      zeminMat.dispose();
      kutuGeo.dispose();
      kutuMat.dispose();
      bloklar.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    };
  }, [binaSayisi]);

  return <div ref={kapRef} className="absolute inset-0 touch-none" aria-label="Mülk Şehrim 3D sahnesi" />;
}
