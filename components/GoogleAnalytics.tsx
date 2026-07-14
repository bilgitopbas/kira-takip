"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

// /oturum-callback URL'sinde native Google girişini tamamlayan tek kullanımlık
// bir oturum jetonu bulunuyor (bkz. lib/googleOAuthState.ts). GA'nın varsayılan
// otomatik page_view izlemesi tam URL'yi (jeton dahil) Google'a gönderirdi -
// bu sayfada analytics'i hiç çalıştırmıyoruz.
const EXCLUDED_PATHS = ["/oturum-callback"];

export default function GoogleAnalytics() {
  const pathname = usePathname();
  if (!GA_ID || EXCLUDED_PATHS.includes(pathname)) return null;

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
