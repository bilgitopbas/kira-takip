// "Yeni panel" geçişi. Klasik panel her zaman varsayılandır.
//
// Üç katman:
//  1) Sunucu izni: YENI_PANEL=1 tanımlı değilse yeni panel hiçbir koşulda
//     açılmaz (acil kapatma anahtarı budur; tanımı kaldırıp yeniden başlatmak
//     herkesi klasik panele döndürür).
//  2) Kullanıcı tercihi: cihaz başına çerez (şema gerektirmez).
//  3) Adres: /dashboard?panel=yeni | ?panel=klasik tercihi değiştirir.

export const PANEL_CEREZI = "mizan_panel";

export type PanelTercihi = "yeni" | "klasik";

export function yeniPanelIzinli(): boolean {
  return process.env.YENI_PANEL === "1";
}

export function panelTercihiCoz(deger: unknown): PanelTercihi | null {
  return deger === "yeni" || deger === "klasik" ? deger : null;
}

/** Tercihi değiştiren uç; çerezi yazıp panele geri yönlendirir. */
export function panelGecisAdresi(hedef: PanelTercihi) {
  return `/api/dashboard/panel-tercihi?panel=${hedef}`;
}
