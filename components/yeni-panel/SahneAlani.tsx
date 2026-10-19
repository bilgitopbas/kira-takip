"use client";

// Sol sahne alanı: "Mülk Şehrim (3D)" ve "Konum (harita)" sekmeleri.
// Ağır kütüphaneler (three, maplibre-gl) yalnız ilgili sekme açıkken ve
// tarayıcıda yüklenir; WebGL yoksa/zayıfsa hafif görünüm gösterilir.
import dynamic from "next/dynamic";
import { useState, useSyncExternalStore } from "react";
import { cihazDurumu, type CihazDurumu } from "@/lib/webglDestek";
import HafifGorunum from "@/components/yeni-panel/HafifGorunum";
import type { Bina } from "@/lib/yeniPanelBina";
import type { Nokta } from "@/lib/haritaModeli";
import type { Sehir3DSecim } from "@/components/yeni-panel/Sehir3D";

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
let olculen: CihazDurumu | null = null;
const cihazAl = () => (olculen ??= cihazDurumu());
const SUNUCU: CihazDurumu = { webgl: false, zayif: true, dokunmatik: false };
const abone = () => () => {};

export default function SahneAlani({
  sekme,
  binalar,
  haritaBinalari,
  il,
  seciliAnahtar,
  duzeltmeler,
  secim3d,
  yalnizGecikmis,
  onSec,
  onSec3d,
  onKonumDuzelt,
  onKonumKaydet,
}: {
  sekme: SahneSekmesi;
  /** Seçili ildeki binalar */
  binalar: Bina[];
  /** Konum kartı çiplerinden geçen binalar */
  haritaBinalari: Bina[];
  il: string;
  seciliAnahtar: string | null;
  duzeltmeler: Record<string, Nokta>;
  onSec: (anahtar: string) => void;
  secim3d: Sehir3DSecim;
  yalnizGecikmis: boolean;
  onSec3d: (bina: string | null, birim: string | null, blok: string | null) => void;
  onKonumDuzelt: (anahtar: string, nokta: Nokta) => void;
  onKonumKaydet: (anahtar: string) => Promise<string | null>;
}) {
  const cihaz = useSyncExternalStore(abone, cihazAl, () => SUNUCU);
  const istemcide = useSyncExternalStore(abone, () => true, () => false);
  const [yineDeAc, setYineDeAc] = useState(false);

  if (!istemcide) return <Yukleniyor metin="Yükleniyor…" />;

  // WebGL yok: 3D de harita da açılamaz → bina listesi
  if (!cihaz.webgl) {
    return (
      <HafifGorunum
        binalar={sekme === "konum" ? haritaBinalari : binalar}
        seciliAnahtar={seciliAnahtar}
        neden="Bu cihazda 3D sahne ve harita desteklenmiyor; binalar liste olarak gösteriliyor."
        onSec={onSec}
      />
    );
  }
  // Zayıf cihaz: harita açık (hafif), 3D yerine liste (istenirse açılabilir)
  if (sekme === "sehir" && cihaz.zayif && !yineDeAc) {
    return (
      <HafifGorunum
        binalar={binalar}
        seciliAnahtar={seciliAnahtar}
        neden="Bu cihazda pil ve hız için 3D sahne yerine liste gösteriliyor."
        onSec={onSec}
        onYineDeAc={() => setYineDeAc(true)}
      />
    );
  }

  return sekme === "sehir" ? (
    <Sehir3D binalar={binalar} secim={secim3d} yalnizGecikmis={yalnizGecikmis} onSec={onSec3d} />
  ) : (
    <Harita binalar={haritaBinalari} il={il} seciliAnahtar={seciliAnahtar} duzeltmeler={duzeltmeler} onSec={onSec} onKonumDuzelt={onKonumDuzelt} onKonumKaydet={onKonumKaydet} />
  );
}
