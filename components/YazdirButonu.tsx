"use client";

import { useEffect, useState } from "react";
import { isNativeApp } from "@/lib/native";

// iOS WKWebView `window.print()` fonksiyonunu uygulamıyor (Safari'de çalışır,
// uygulama içindeki web görünümünde sessizce hiçbir şey yapmaz). Bu yüzden
// mobil uygulamada tıklanabilir ama işe yaramayan bir buton göstermek yerine
// durumu açıkça belirtiyoruz.
export default function YazdirButonu({
  label = "PDF Olarak Yazdır",
  className = "bg-white hover:bg-gray-50 text-slate-700 font-semibold px-4 py-2.5 rounded-xl transition text-sm border border-gray-200",
}: {
  label?: string;
  className?: string;
}) {
  const [nativeApp, setNativeApp] = useState(false);

  useEffect(() => {
    setNativeApp(isNativeApp());
  }, []);

  if (nativeApp) {
    return (
      <span className="text-xs text-slate-400 px-2 py-2 leading-snug max-w-[220px]">
        Yazdırma uygulama içinden desteklenmiyor. Aynı sayfayı tarayıcıdan
        açarak yazdırabilirsiniz.
      </span>
    );
  }

  return (
    <button type="button" onClick={() => window.print()} className={className}>
      {label}
    </button>
  );
}
