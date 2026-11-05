// Çerez bildirimi tercihi ve Google Analytics'in çalışabileceği sayfalar.
// GA yalnız ziyaretçi "Kabul Et" dediyse ve yalnız herkese açık sayfalarda
// çalışır (Gizlilik ve Çerez Politikası bu davranışı anlatır). Panel, yönetim,
// giriş/kayıt ve adresinde jeton taşıyabilen sayfalar (şifre sıfırlama, e-posta
// onayı, davet, oturum dönüşü) hiçbir zaman ölçülmez.

export type CerezOnayi = "accepted" | "rejected" | null;

const ANAHTAR = "mizan_cookie_consent";
const OLAY = "mizan-cerez-onayi";

const GA_SAYFALARI = ["/gizlilik-politikasi", "/aydinlatma-metni", "/acik-riza-metni", "/kullanim-kosullari", "/cerez-politikasi"];

/** Ana sayfa, blog ve yasal metinler; başka hiçbir yol. */
export function gaIzinliYol(yol: string): boolean {
  if (yol === "/" || yol === "/blog" || yol.startsWith("/blog/")) return true;
  return GA_SAYFALARI.includes(yol);
}

export function cerezOnayiOku(): CerezOnayi {
  try {
    const v = window.localStorage.getItem(ANAHTAR);
    return v === "accepted" || v === "rejected" ? v : null;
  } catch {
    return null;
  }
}

export function cerezOnayiYaz(deger: "accepted" | "rejected") {
  try {
    window.localStorage.setItem(ANAHTAR, deger);
  } catch {
    // gizli pencere vb.: tercih yalnız bu sayfa için geçerli olur
  }
  window.dispatchEvent(new Event(OLAY));
}

export function cerezOnayiAbone(dinle: () => void) {
  window.addEventListener(OLAY, dinle);
  window.addEventListener("storage", dinle);
  return () => {
    window.removeEventListener(OLAY, dinle);
    window.removeEventListener("storage", dinle);
  };
}
