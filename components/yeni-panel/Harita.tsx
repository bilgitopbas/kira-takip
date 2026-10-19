"use client";

// Konum — gerçek harita (MapLibre GL + OpenFreeMap, API anahtarı gerektirmez).
// Bu dosya yalnız next/dynamic (ssr:false) ile yüklenir; maplibre ayrı bir
// parçada gelir.
//
// Gizlilik: harita karoları tarayıcıdan tiles.openfreemap.org'dan istenir
// (IP + görülen bölge). Adres ya da kişisel veri hiçbir dış servise
// gönderilmez; dış geocoding YOK. Bina konumları ilçe/il merkezinden türetilir
// (lib/haritaModeli.ts) ve "konum doğrulanmadı" diye kesik çizgiyle gösterilir.
//
// Seviyeler: zoom < 11 il kümeleri, 11–13 ilçe kümeleri, sonrası tek tek pin.
// Seçili binanın pini sürüklenebilir; sonuç yalnız bu oturumda tutulur
// (kalıcı kayıt F aşamasındaki şema ekiyle).
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { Map as HaritaGL, Marker, NavigationControl, AttributionControl, getVersion, setWorkerUrl } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { binaKonumlari, haritaSeviyesi, kumele, sinirKutusu, type HaritaSeviyesi, type Nokta } from "@/lib/haritaModeli";
import { tipAilesi, type Bina, type TipAilesi } from "@/lib/yeniPanelBina";
import type { BirimDurumu } from "@/lib/yeniPanelTipleri";

// İşçi dosyası build öncesi public/ altına kopyalanır (scripts/maplibre-worker-kopyala.mjs).
setWorkerUrl(`/vendor/maplibre/maplibre-gl-worker-${getVersion()}.mjs`);

const STIL = { acik: "https://tiles.openfreemap.org/styles/liberty", koyu: "https://tiles.openfreemap.org/styles/dark" };

// Panel koyu temadaysa (<html class="dark">) haritanın koyu stili kullanılır
function koyuTemaAbone(cb: () => void) {
  const gozlem = new MutationObserver(cb);
  gozlem.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => gozlem.disconnect();
}
const koyuMu = () => document.documentElement.classList.contains("dark");
const TURKIYE_MERKEZ: [number, number] = [35.2, 39.0];
const YUKLEME_SURESI_MS = 12000;
// Pin 56 px boyunda; üstte daha geniş pay bırak ki pin kesilmesin
const SIGDIRMA_PAYI = { top: 90, bottom: 40, left: 50, right: 60 };

const DURUM_RENGI: Record<BirimDurumu, string> = {
  odendi: "#1d9a60",
  bekliyor: "#cf900b",
  gecikmis: "#d23f3f",
  bos: "#8c9a97",
};

// Önizleme v6'daki pin biçimi ve tip ikonları (yalnız sabit SVG; kullanıcı
// metni içermez).
const PIN_D = "M0 0C-4 -8 -15 -13 -15 -27A15 15 0 1 1 15 -27C15 -13 4 -8 0 0Z";
const IKON: Record<TipAilesi, string> = {
  ofis: '<polygon fill="#fff" fill-opacity=".82" points="7,5.5 12,8 12,22 7,19.5"/><polygon fill="#fff" fill-opacity=".6" points="12,8 17,5.5 17,19.5 12,22"/><polygon fill="#fff" points="7,5.5 12,3 17,5.5 12,8"/>',
  konut: '<polygon fill="#fff" fill-opacity=".82" points="6,19 6,12 9,8.5 12,15 12,22"/><polygon fill="#fff" fill-opacity=".6" points="12,15 18,12 18,19 12,22"/><polygon fill="#fff" points="12,15 9,8.5 15,5.5 18,12"/>',
  fabrika: '<polygon fill="#fff" points="4,13 14,8 20,11 10,16"/><polygon fill="#fff" fill-opacity=".82" points="5.4,4.2 7.4,5.2 7.4,13.4 5.4,12.4"/><polygon fill="#fff" fill-opacity=".82" points="4,13 10,16 10,22 4,19"/><polygon fill="#fff" fill-opacity=".6" points="10,22 10,13 13.3,14.4 13.3,11.4 16.7,12.7 16.7,9.7 20,11 20,17"/>',
  avm: '<polygon fill="#fff" points="2,12.5 13,7 22,11.5 11,17"/><polygon fill="#fff" fill-opacity=".82" points="2,12.5 11,17 11,22 2,17.5"/><polygon fill="#fff" fill-opacity=".6" points="11,17 22,11.5 22,16.5 11,22"/>',
};

function pinSvg(tip: string | null, birimSayisi: number, durum: BirimDurumu, dogrulanmadi: boolean, secili: boolean) {
  const cizgi = secili ? 'stroke="#17B6AE" stroke-width="3"' : 'stroke="#fff" stroke-width="2"';
  const kesik = dogrulanmadi ? ' stroke-dasharray="4 3"' : "";
  const rozet =
    birimSayisi > 1
      ? `<circle cx="13" cy="-41" r="10" fill="#06211f" stroke="#fff" stroke-width="2"/><text x="13" y="-37.3" text-anchor="middle" fill="#fff" font-size="10.5" font-weight="700" font-family="system-ui,sans-serif">${Math.min(Math.trunc(birimSayisi), 999)}</text>`
      : "";
  return `<svg viewBox="-25 -53 50 56" width="50" height="56" aria-hidden="true" style="overflow:visible;transform:scale(${secili ? 1.18 : 1});transform-origin:50% 100%;transition:transform .16s"><ellipse cx="0" cy="1" rx="8" ry="3" fill="rgba(10,40,36,.17)"/><path d="${PIN_D}" fill="${DURUM_RENGI[durum]}" ${cizgi}${kesik}/><svg x="-11" y="-38" width="22" height="22" viewBox="0 0 24 24">${IKON[tipAilesi(tip)]}</svg>${rozet}</svg>`;
}

/** Harita etiketlerini Türkçe ada çevir (name:tr yoksa Latin adı, o da yoksa yerel ad) */
function turkceEtiketler(harita: HaritaGL) {
  for (const katman of harita.getStyle().layers ?? []) {
    if (katman.type !== "symbol") continue;
    if (!harita.getLayoutProperty(katman.id, "text-field")) continue;
    harita.setLayoutProperty(katman.id, "text-field", ["coalesce", ["get", "name:tr"], ["get", "name:latin"], ["get", "name"]]);
  }
}

type Durum = "yukleniyor" | "hazir" | "hata";

export default function Harita({
  binalar,
  il,
  seciliAnahtar,
  duzeltmeler,
  onSec,
  onKonumDuzelt,
}: {
  binalar: Bina[];
  /** Seçili il ("" = tümü); değişince harita o ilin binalarına sığdırılır */
  il: string;
  seciliAnahtar: string | null;
  duzeltmeler: Record<string, Nokta>;
  onSec: (anahtar: string) => void;
  onKonumDuzelt: (anahtar: string, nokta: Nokta) => void;
}) {
  const kapRef = useRef<HTMLDivElement>(null);
  const haritaRef = useRef<HaritaGL | null>(null);
  const isaretlerRef = useRef<Marker[]>([]);
  const [durum, setDurum] = useState<Durum>("yukleniyor");
  const [seviye, setSeviye] = useState<HaritaSeviyesi>("il");
  const [deneme, setDeneme] = useState(0);
  const koyu = useSyncExternalStore(koyuTemaAbone, koyuMu, () => false);
  const ilkStil = useRef(koyu ? STIL.koyu : STIL.acik);

  // Geri çağrılar her çizimde değişebilir; işaretçi olaylarında güncelini kullan
  const onSecRef = useRef(onSec);
  const onKonumRef = useRef(onKonumDuzelt);
  useEffect(() => {
    onSecRef.current = onSec;
    onKonumRef.current = onKonumDuzelt;
  });

  const { konumlar, konumsuz } = useMemo(() => binaKonumlari(binalar, duzeltmeler), [binalar, duzeltmeler]);
  const binaHaritasi = useMemo(() => new Map(binalar.map((b) => [b.anahtar, b])), [binalar]);

  // Haritayı kur / sök
  useEffect(() => {
    const kap = kapRef.current;
    if (!kap) return;
    let hazir = false;
    const harita = new HaritaGL({
      container: kap,
      style: ilkStil.current,
      center: TURKIYE_MERKEZ,
      zoom: 4.8,
      minZoom: 4,
      maxZoom: 18.5,
      pixelRatio: 1,
      attributionControl: false,
      dragRotate: false,
      pitchWithRotate: false,
      touchPitch: false,
      renderWorldCopies: false,
    });
    haritaRef.current = harita;
    harita.touchZoomRotate.disableRotation();
    harita.keyboard.disableRotation();
    harita.addControl(new NavigationControl({ showCompass: false }), "top-right");
    harita.addControl(new AttributionControl({ compact: true }), "bottom-left");

    const sure = setTimeout(() => {
      if (!hazir) setDurum("hata");
    }, YUKLEME_SURESI_MS);

    // Stil her yüklendiğinde (ilk açılış ve tema değişimi) etiketleri Türkçeleştir
    harita.on("style.load", () => turkceEtiketler(harita));
    harita.on("load", () => {
      hazir = true;
      clearTimeout(sure);
      setSeviye(haritaSeviyesi(harita.getZoom()));
      setDurum("hazir");
    });
    harita.on("error", () => {
      if (!hazir) {
        clearTimeout(sure);
        setDurum("hata");
      }
    });
    // Stilde adı geçen ama sprite'ta olmayan simge: boş görsel (konsol uyarısı çıkmasın)
    harita.on("styleimagemissing", (e) => {
      if (!harita.hasImage(e.id)) harita.addImage(e.id, { width: 1, height: 1, data: new Uint8Array(4) });
    });
    harita.on("zoomend", () => setSeviye(haritaSeviyesi(harita.getZoom())));

    return () => {
      clearTimeout(sure);
      isaretlerRef.current.forEach((m) => m.remove());
      isaretlerRef.current = [];
      haritaRef.current = null;
      harita.remove();
    };
  }, [deneme]);

  // Tema değişince stili değiştir (işaretçiler DOM öğesi; etkilenmez)
  useEffect(() => {
    const harita = haritaRef.current;
    const hedef = koyu ? STIL.koyu : STIL.acik;
    if (durum !== "hazir" || !harita || ilkStil.current === hedef) return;
    ilkStil.current = hedef;
    harita.setStyle(hedef);
  }, [durum, koyu]);

  // İl değişince (ve ilk yüklemede) binalara sığdır
  useEffect(() => {
    const harita = haritaRef.current;
    if (durum !== "hazir" || !harita) return;
    const kutu = sinirKutusu(konumlar.map((k) => k.nokta));
    if (kutu) harita.fitBounds(kutu, { padding: SIGDIRMA_PAYI, maxZoom: 14, duration: 0 });
    else harita.jumpTo({ center: TURKIYE_MERKEZ, zoom: 4.8 });
    // Yalnız il ya da hazır olma değişince; konum düzeltmesi haritayı oynatmasın.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [durum, il]);

  // Seçilen binaya git
  useEffect(() => {
    const harita = haritaRef.current;
    if (durum !== "hazir" || !harita || !seciliAnahtar) return;
    const k = konumlar.find((x) => x.anahtar === seciliAnahtar);
    if (!k) return;
    harita.easeTo({ center: k.nokta, zoom: Math.max(harita.getZoom(), 14), duration: 600 });
    // Yalnız seçim değişince uç; sürükleme sonrası haritayı yeniden ortalama.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [durum, seciliAnahtar]);

  // Pinler ve kümeler
  useEffect(() => {
    const harita = haritaRef.current;
    if (durum !== "hazir" || !harita) return;
    isaretlerRef.current.forEach((m) => m.remove());
    const yeni: Marker[] = [];
    const { kumeler, kumedekiler } = kumele(konumlar, seviye, seciliAnahtar);

    for (const k of konumlar) {
      if (kumedekiler.has(k.anahtar)) continue;
      const bina = binaHaritasi.get(k.anahtar);
      if (!bina) continue;
      const secili = k.anahtar === seciliAnahtar;
      const el = document.createElement("div");
      el.setAttribute("role", "button");
      el.tabIndex = 0;
      el.style.cursor = secili ? "grab" : "pointer";
      el.style.opacity = seciliAnahtar && !secili ? "0.45" : "1";
      el.setAttribute(
        "aria-label",
        `${bina.ad}, ${k.ozet.n} birim, ${k.ozet.sayac.gecikmis} gecikmiş${k.dogrulanmadi ? ", konum doğrulanmadı" : ""}${secili ? ", sürükleyerek konumu düzeltebilirsiniz" : ""}`
      );
      el.title = bina.ad;
      // Yalnız sabit SVG + sayı; kullanıcı metni innerHTML'e girmez
      el.innerHTML = pinSvg(bina.tip, k.ozet.n, k.ozet.enKotu, k.dogrulanmadi, secili);
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        onSecRef.current(k.anahtar);
      });
      el.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSecRef.current(k.anahtar);
        }
      });
      const isaret = new Marker({ element: el, anchor: "bottom", offset: [0, 3], draggable: secili }).setLngLat(k.nokta).addTo(harita);
      if (secili) {
        isaret.on("dragend", () => {
          const p = isaret.getLngLat();
          onKonumRef.current(k.anahtar, [Number(p.lng.toFixed(6)), Number(p.lat.toFixed(6))]);
        });
        el.style.zIndex = "2";
      }
      yeni.push(isaret);
    }

    for (const c of kumeler) {
      const el = document.createElement("button");
      el.type = "button";
      el.className =
        "flex items-center gap-2 rounded-full bg-white border border-gray-200 shadow-md pl-1 pr-3 py-1 text-xs font-bold text-slate-800 whitespace-nowrap hover:border-[#17B6AE]";
      el.style.opacity = seciliAnahtar ? "0.55" : "1";
      el.setAttribute("aria-label", `${c.ad}, ${c.binaSayisi} bina, ${c.birimSayisi} birim, ${c.gecikmis} gecikmiş; yakınlaştırmak için seçin`);
      const nokta = document.createElement("span");
      nokta.className = "w-6 h-6 rounded-full grid place-items-center text-white text-[11px] font-extrabold";
      nokta.style.background = DURUM_RENGI[c.enKotu];
      nokta.textContent = String(c.binaSayisi);
      const ad = document.createElement("span");
      ad.textContent = c.ad; // kullanıcı/kaynak metni: yalnız textContent
      const alt = document.createElement("span");
      alt.className = "font-semibold text-slate-500";
      alt.textContent = ` · ${c.binaSayisi} bina · ${c.birimSayisi} birim`;
      el.append(nokta, ad, alt);
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        const kutu = sinirKutusu(konumlar.filter((k) => c.binalar.includes(k.anahtar)).map((k) => k.nokta));
        const hedefZoom = seviye === "il" ? 11.2 : 13.2;
        if (!kutu) return;
        const kamera = harita.cameraForBounds(kutu, { padding: SIGDIRMA_PAYI });
        harita.easeTo({
          center: kamera?.center ?? c.nokta,
          zoom: Math.max(hedefZoom, Math.min(kamera?.zoom ?? hedefZoom, 15)),
          duration: 600,
        });
      });
      yeni.push(new Marker({ element: el, anchor: "center" }).setLngLat(c.nokta).addTo(harita));
    }

    isaretlerRef.current = yeni;
  }, [durum, konumlar, seviye, seciliAnahtar, binaHaritasi]);

  const seciliKonum = seciliAnahtar ? konumlar.find((k) => k.anahtar === seciliAnahtar) : undefined;

  return (
    <div className="absolute inset-0" aria-label="Portföy haritası">
      {/* maplibre CSS kapsayıcıya position:relative verdiği için harita
          kutusu ayrı bir iç eleman olarak tam boy yerleştirilir. */}
      <div key={deneme} ref={kapRef} className="h-full w-full" />

      {durum === "yukleniyor" && (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-slate-400 pointer-events-none" role="status">
          Harita yükleniyor…
        </div>
      )}

      {durum === "hata" && (
        <div className="absolute inset-0 flex items-center justify-center p-6 bg-[#eef1ea]">
          <div className="max-w-xs text-center bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="text-sm font-semibold text-slate-700">Harita yüklenemedi</p>
            <p className="text-xs text-slate-500 mt-1">
              Bağlantı yavaş ya da harita sunucusuna ulaşılamıyor. Binalar sağdaki panelde listelenmeye devam ediyor.
            </p>
            <button
              type="button"
              onClick={() => {
                setDurum("yukleniyor");
                setDeneme((d) => d + 1);
              }}
              className="mt-3 text-xs font-semibold px-3 py-2 rounded-lg bg-[#17B6AE] text-white hover:bg-[#149891]"
            >
              Tekrar dene
            </button>
          </div>
        </div>
      )}

      {durum === "hazir" && (seciliKonum || konumsuz.length > 0) && (
        <div className="absolute left-2 top-2 right-14 flex flex-wrap gap-1.5 pointer-events-none">
          {seciliKonum && (
            <span className="text-[11px] font-semibold px-2 py-1 rounded-lg bg-white/95 border border-amber-200 text-amber-800 shadow-sm">
              {seciliKonum.kaynak === "duzeltildi"
                ? "Konum bu oturumda düzeltildi · kalıcı kayıt Binalarım'da"
                : `Konum doğrulanmadı (${seciliKonum.kaynak === "ilce" ? "ilçe" : "il"} merkezi) · pini sürükleyerek düzeltin`}
            </span>
          )}
          {konumsuz.length > 0 && (
            <span className="text-[11px] font-semibold px-2 py-1 rounded-lg bg-white/95 border border-gray-200 text-slate-600 shadow-sm">
              İli girilmemiş {konumsuz.length} bina haritada gösterilemiyor
            </span>
          )}
        </div>
      )}
    </div>
  );
}
