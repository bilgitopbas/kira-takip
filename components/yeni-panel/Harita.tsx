"use client";

// Konum — gerçek harita (MapLibre GL + OpenFreeMap, API anahtarı gerektirmez).
// Bu dosya yalnız next/dynamic (ssr:false) ile yüklenir; maplibre ayrı bir
// parçada gelir.
//
// Gizlilik: harita karoları tarayıcıdan tiles.openfreemap.org'dan istenir
// (IP + görülen bölge). Adres ya da kişisel veri hiçbir dış servise
// gönderilmez; dış geocoding YOK.
//
// A aşaması: haritanın kurulup söküldüğünü doğrulayan iskelet. Pinler,
// il/ilçe kümeleri ve "konum doğrulanmadı" rozeti D aşamasında eklenecek.
import { useEffect, useRef } from "react";
import { Map as HaritaGL, NavigationControl, getVersion, setWorkerUrl } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

// İşçi dosyası build öncesi public/ altına kopyalanır (scripts/maplibre-worker-kopyala.mjs).
setWorkerUrl(`/vendor/maplibre/maplibre-gl-worker-${getVersion()}.mjs`);

const STIL = "https://tiles.openfreemap.org/styles/liberty";
// Türkiye geneli başlangıç görünümü
const TURKIYE_MERKEZ: [number, number] = [35.2, 39.0];

export default function Harita() {
  const kapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const kap = kapRef.current;
    if (!kap) return;

    const harita = new HaritaGL({
      container: kap,
      style: STIL,
      center: TURKIYE_MERKEZ,
      zoom: 4.8,
      pixelRatio: 1,
      attributionControl: { compact: true },
      dragRotate: false,
      pitchWithRotate: false,
    });
    harita.touchZoomRotate.disableRotation();
    harita.addControl(new NavigationControl({ showCompass: false }), "top-right");

    return () => harita.remove();
  }, []);

  // maplibre CSS kapsayıcıya position:relative verdiği için harita kutusu
  // ayrı bir iç eleman olarak tam boy yerleştirilir.
  return (
    <div className="absolute inset-0" aria-label="Portföy haritası">
      <div ref={kapRef} className="h-full w-full" />
    </div>
  );
}
