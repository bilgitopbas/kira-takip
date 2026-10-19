"use client";

// Binalarım: bina konumunu haritada pin sürükleyerek seçme. Yalnız
// next/dynamic (ssr:false) ile yüklenir. Dış servise adres GÖNDERİLMEZ;
// başlangıç noktası kayıtlı konum ya da ilçe/il merkezidir.
import { useEffect, useRef, useState } from "react";
import { Map as HaritaGL, Marker, NavigationControl } from "maplibre-gl";
import { HARITA_STILI, HARITA_YERELI, dokunmatik, turkceEtiketler } from "@/components/yeni-panel/maplibreKurulum";

export default function KonumSecici({
  baslangic,
  onOnayla,
  onVazgec,
}: {
  /** [boylam, enlem] */
  baslangic: [number, number];
  onOnayla: (lat: number, lng: number) => void;
  onVazgec: () => void;
}) {
  const kapRef = useRef<HTMLDivElement>(null);
  const [nokta, setNokta] = useState<[number, number]>(baslangic);
  const [hata, setHata] = useState(false);

  useEffect(() => {
    const kap = kapRef.current;
    if (!kap) return;
    const harita = new HaritaGL({
      container: kap,
      style: document.documentElement.classList.contains("dark") ? HARITA_STILI.koyu : HARITA_STILI.acik,
      center: baslangic,
      zoom: 14,
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
    const isaret = new Marker({ draggable: true, color: "#17B6AE" }).setLngLat(baslangic).addTo(harita);
    isaret.on("dragend", () => {
      const p = isaret.getLngLat();
      setNokta([p.lng, p.lat]);
    });
    // Haritaya dokununca pin oraya gelsin (telefonda sürüklemekten kolay)
    harita.on("click", (e) => {
      isaret.setLngLat(e.lngLat);
      setNokta([e.lngLat.lng, e.lngLat.lat]);
    });
    return () => harita.remove();
    // Yalnız ilk açılışta kur
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden bg-white">
      <div className="relative h-64">
        <div ref={kapRef} className="h-full w-full" />
        {hata && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#eef1ea] text-sm text-slate-600 p-4 text-center">
            Harita yüklenemedi. Bağlantınızı kontrol edip tekrar deneyin.
          </div>
        )}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 border-t border-gray-100">
        <span className="text-[11px] text-slate-500">Pini sürükleyin ya da haritaya dokunun.</span>
        <span className="flex gap-1.5">
          <button type="button" onClick={onVazgec} className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-200 text-slate-600 hover:bg-gray-50">
            Vazgeç
          </button>
          <button
            type="button"
            onClick={() => onOnayla(Number(nokta[1].toFixed(6)), Number(nokta[0].toFixed(6)))}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#17B6AE] text-white hover:bg-[#149891]"
          >
            Bu konumu onayla
          </button>
        </span>
      </div>
    </div>
  );
}
