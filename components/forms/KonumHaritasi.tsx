"use client";

// Mülk formundaki küçük konum haritası: pin il/ilçe merkezinde (ya da kayıtlı
// bina konumunda) başlar; mülk sahibi pini sürükler ya da haritaya dokunur.
// Yalnız next/dynamic (ssr:false) ile yüklenir. Dış servise adres
// GÖNDERİLMEZ (yalnız harita karoları indirilir).
import { useEffect, useRef, useState } from "react";
import { Map as HaritaGL, Marker, NavigationControl } from "maplibre-gl";
import { HARITA_STILI, HARITA_YERELI, dokunmatik, turkceEtiketler } from "@/components/yeni-panel/maplibreKurulum";

export default function KonumHaritasi({
  nokta,
  yakinlik,
  onDegis,
}: {
  /** [boylam, enlem] */
  nokta: [number, number];
  /** Başlangıç yakınlığı: ilçe merkezi 13, il merkezi 10, Türkiye 5 */
  yakinlik: number;
  onDegis: (lat: number, lng: number) => void;
}) {
  const kapRef = useRef<HTMLDivElement>(null);
  const haritaRef = useRef<HaritaGL | null>(null);
  const isaretRef = useRef<Marker | null>(null);
  const onDegisRef = useRef(onDegis);
  const [hata, setHata] = useState(false);
  useEffect(() => {
    onDegisRef.current = onDegis;
  });

  useEffect(() => {
    const kap = kapRef.current;
    if (!kap) return;
    const harita = new HaritaGL({
      container: kap,
      style: document.documentElement.classList.contains("dark") ? HARITA_STILI.koyu : HARITA_STILI.acik,
      center: nokta,
      zoom: yakinlik,
      pixelRatio: 1,
      dragRotate: false,
      pitchWithRotate: false,
      cooperativeGestures: dokunmatik(),
      locale: HARITA_YERELI,
    });
    harita.addControl(new NavigationControl({ showCompass: false }), "top-right");
    harita.on("style.load", () => turkceEtiketler(harita));
    harita.on("error", () => {
      if (!harita.loaded()) setHata(true);
    });
    const isaret = new Marker({ draggable: true, color: "#17B6AE" }).setLngLat(nokta).addTo(harita);
    isaret.on("dragend", () => {
      const p = isaret.getLngLat();
      onDegisRef.current(Number(p.lat.toFixed(6)), Number(p.lng.toFixed(6)));
    });
    harita.on("click", (e) => {
      isaret.setLngLat(e.lngLat);
      onDegisRef.current(Number(e.lngLat.lat.toFixed(6)), Number(e.lngLat.lng.toFixed(6)));
    });
    haritaRef.current = harita;
    isaretRef.current = isaret;
    return () => {
      harita.remove();
      haritaRef.current = null;
      isaretRef.current = null;
    };
    // Yalnız ilk açılışta kur; sonraki nokta değişiklikleri aşağıda
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Dışarıdan nokta değişince (il/ilçe ya da bina seçimi) pini ve görünümü taşı
  useEffect(() => {
    const harita = haritaRef.current;
    const isaret = isaretRef.current;
    if (!harita || !isaret) return;
    const p = isaret.getLngLat();
    if (Math.abs(p.lng - nokta[0]) < 1e-7 && Math.abs(p.lat - nokta[1]) < 1e-7) return;
    isaret.setLngLat(nokta);
    harita.jumpTo({ center: nokta, zoom: yakinlik });
  }, [nokta, yakinlik]);

  return (
    <div className="relative h-48 rounded-xl border border-gray-200 overflow-hidden bg-[#eef1ea]">
      <div ref={kapRef} className="h-full w-full" />
      {hata && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#eef1ea] text-sm text-slate-600 p-4 text-center">
          Harita yüklenemedi. Konumu daha sonra Binalarım ekranından seçebilirsiniz.
        </div>
      )}
    </div>
  );
}
