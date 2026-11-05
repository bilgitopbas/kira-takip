"use client";

import { useEffect, useSyncExternalStore } from "react";
import Script from "next/script";
import { usePathname } from "next/navigation";
import { cerezOnayiAbone, cerezOnayiOku, gaIzinliYol } from "@/lib/cerezOnayi";

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

// GA yalnız çerez bildiriminde "Kabul Et" denildiyse ve yalnız herkese açık
// sayfalarda yüklenir (bkz. lib/cerezOnayi.ts). Panel adreslerinde kiracı adı
// gibi veriler (ör. arama ?q=) bulunabildiği için oralarda hiç çalışmaz.
// Betik bir kez yüklendikten sonra izin dışı bir sayfaya geçilirse Google'ın
// resmî "ga-disable-<kimlik>" anahtarıyla gönderim durdurulur.
export default function GoogleAnalytics() {
  const pathname = usePathname();
  const onay = useSyncExternalStore(cerezOnayiAbone, cerezOnayiOku, () => null);
  const izinli = !!GA_ID && onay === "accepted" && gaIzinliYol(pathname);

  useEffect(() => {
    if (GA_ID) (window as unknown as Record<string, boolean>)[`ga-disable-${GA_ID}`] = !izinli;
  }, [izinli]);

  if (!izinli) return null;

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}');
        `}
      </Script>
    </>
  );
}
