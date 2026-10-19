// Ana sayfa paneli: YENI_PANEL=1 iken herkes için yeni panel açılır.
//
//  1) Sunucu izni (acil kapatma): YENI_PANEL=1 tanımlı değilse yeni panel
//     hiçbir koşulda açılmaz; tanımı kaldırıp `pm2 restart --update-env`
//     herkesi klasik panele döndürür.
//  2) Gizli tek seferlik görünüm: /dashboard?panel=klasik o istekte klasik
//     paneli gösterir; tercih saklanmaz (çerez yok), sonraki girişte yine
//     yeni panel açılır.

export function yeniPanelIzinli(): boolean {
  return process.env.YENI_PANEL === "1";
}

/** Bu istekte klasik panel mi istendi (?panel=klasik) */
export function klasikIstendi(deger: unknown): boolean {
  return deger === "klasik" || (Array.isArray(deger) && deger.includes("klasik"));
}
