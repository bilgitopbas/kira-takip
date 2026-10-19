"use client";

// Sol sahne alanı: "Mülk Şehrim (3D)" ve "Konum (harita)" sekmeleri.
// Ağır kütüphaneler (three, maplibre-gl) yalnız ilgili sekme açıkken ve
// tarayıcıda yüklenir; WebGL yoksa/zayıfsa hafif görünüm gösterilir.
import dynamic from "next/dynamic";
import { useSyncExternalStore } from "react";
import { grafikSeviyesi, type GrafikSeviyesi } from "@/lib/webglDestek";
import type { Bina } from "@/lib/yeniPanelBina";
import type { Nokta } from "@/lib/haritaModeli";

const Yukleniyor = ({ metin }: { metin: string }) => (
  <div className="absolute inset-0 flex items-center justify-center text-sm text-slate-400" role="status">
    {metin}
  </div>
);

const Sehir3D = dynamic(() => import("./Sehir3D"), {
  ssr: false,
  loading: () => <Yukleniyor metin="Mülk Şehrim hazırlanıyor…" />,
});

const Harita = dynamic(() => import("./Harita"), {
  ssr: false,
  loading: () => <Yukleniyor metin="Harita yükleniyor…" />,
});

export type SahneSekmesi = "sehir" | "konum";

// Cihaz yeteneği bir kez ölçülür; sunucuda "hafif" sayılır (sahne zaten
// yalnız istemcide çizilir).
let olculen: GrafikSeviyesi | null = null;
const seviyeAl = () => (olculen ??= grafikSeviyesi());
const abone = () => () => {};

export default function SahneAlani({
  sekme,
  binalar,
  il,
  seciliAnahtar,
  duzeltmeler,
  onSec,
  onKonumDuzelt,
}: {
  sekme: SahneSekmesi;
  /** Seçili ildeki binalar */
  binalar: Bina[];
  il: string;
  seciliAnahtar: string | null;
  duzeltmeler: Record<string, Nokta>;
  onSec: (anahtar: string) => void;
  onKonumDuzelt: (anahtar: string, nokta: Nokta) => void;
}) {
  const seviye = useSyncExternalStore(abone, seviyeAl, () => "hafif" as GrafikSeviyesi);
  const istemcide = useSyncExternalStore(abone, () => true, () => false);

  if (!istemcide) return <Yukleniyor metin="Yükleniyor…" />;

  if (seviye === "hafif") {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-6 text-center">
        <p className="text-sm font-semibold text-slate-700">Hafif görünüm</p>
        <p className="text-xs text-slate-500 max-w-xs">
          Bu cihazda 3D sahne ve harita kapalı. Binalar ve kiracılar sağdaki panelde listelenir.
        </p>
      </div>
    );
  }

  return sekme === "sehir" ? (
    <Sehir3D binaSayisi={binalar.length} />
  ) : (
    <Harita binalar={binalar} il={il} seciliAnahtar={seciliAnahtar} duzeltmeler={duzeltmeler} onSec={onSec} onKonumDuzelt={onKonumDuzelt} />
  );
}
