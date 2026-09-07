"use client";

import { useCallback, useEffect, useState } from "react";
import { useNativeApp } from "@/lib/useNativeApp";

// iOS WKWebView `window.print()` fonksiyonunu uygulamıyor (Safari'de çalışır,
// uygulama içindeki web görünümünde sessizce hiçbir şey yapmaz); Android
// WebView'da da güvenilir değil. Bu yüzden uygulamada, aynı sayfayı cihazın
// GERÇEK tarayıcısında açan bir bağlantı gösteriyoruz — yazdırma orada
// sorunsuz çalışır.
//
// Tarayıcının çerez deposu uygulamanınkinden ayrı olduğu için bağlantı,
// tek kullanımlık ve kısa ömürlü bir oturum devretme jetonu taşır
// (bkz. lib/yazdirmaJetonu.ts).
export default function YazdirButonu({
  label = "PDF Olarak Yazdır",
  className = "bg-white hover:bg-gray-50 text-slate-700 font-semibold px-4 py-2.5 rounded-xl transition text-sm border border-gray-200",
}: {
  label?: string;
  className?: string;
}) {
  const nativeApp = useNativeApp();
  const [baglanti, setBaglanti] = useState<string | null>(null);
  const [hata, setHata] = useState(false);

  // Durum güncellemeleri yalnızca istek sonuçlandığında yapılır; efekt
  // içinde eşzamanlı setState çağrısı olmaz.
  const baglantiAl = useCallback(() => {
    fetch("/api/dashboard/yazdirma-baglantisi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ yol: window.location.pathname + window.location.search }),
    })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((v) => {
        setBaglanti(v.url);
        setHata(false);
      })
      .catch(() => setHata(true));
  }, []);

  useEffect(() => {
    if (!nativeApp) return;
    baglantiAl();
    // Jeton 10 dakikada geçersiz oluyor; kullanıcı uygulamaya geri döndüğünde
    // bağlantıyı tazele ki tıkladığında ölü bir bağlantıya düşmesin.
    const geriDonus = () => {
      if (document.visibilityState === "visible") baglantiAl();
    };
    document.addEventListener("visibilitychange", geriDonus);
    return () => document.removeEventListener("visibilitychange", geriDonus);
  }, [nativeApp, baglantiAl]);

  if (nativeApp) {
    if (hata) {
      return (
        <button type="button" onClick={baglantiAl} className={className}>
          Yazdırma bağlantısı alınamadı — tekrar dene
        </button>
      );
    }
    if (!baglanti) {
      return (
        <span className="text-xs text-slate-400 px-2 py-2">Yazdırma hazırlanıyor…</span>
      );
    }
    return (
      <a href={baglanti} target="_blank" rel="noopener noreferrer" className={className}>
        Tarayıcıda Aç ve Yazdır
      </a>
    );
  }

  return (
    <button type="button" onClick={() => window.print()} className={className}>
      {label}
    </button>
  );
}
