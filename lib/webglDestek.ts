// Cihaz grafik yeteneği: yeni paneldeki 3D sahne ve harita WebGL ister.
//  - WebGL yok → hafif görünüm (bina listesi), harita da kapalı
//  - WebGL var ama cihaz zayıf → 3D yerine bina listesi; harita açık
//    (harita 3D'den çok daha hafiftir)

export type GrafikSeviyesi = "tam" | "hafif";
export type CihazDurumu = { webgl: boolean; zayif: boolean; dokunmatik: boolean };

export function webglVarMi(): boolean {
  if (typeof document === "undefined") return false;
  try {
    const tuval = document.createElement("canvas");
    const gl = tuval.getContext("webgl2") || tuval.getContext("webgl");
    if (!gl) return false;
    // Testte açılan bağlamı hemen bırak; mobilde bağlam sayısı sınırlıdır.
    (gl as WebGLRenderingContext).getExtension("WEBGL_lose_context")?.loseContext();
    return true;
  } catch {
    return false;
  }
}

/**
 * Kaba cihaz değerlendirmesi. Yanlış pozitif zararsızdır (yalnız hafif
 * görünüm açılır); kullanıcı "3D'yi yine de aç" diyebilir.
 */
export function cihazDurumu(): CihazDurumu {
  const webgl = webglVarMi();
  const nav = (typeof navigator !== "undefined" ? navigator : {}) as Navigator & { deviceMemory?: number };
  const zayif =
    (typeof nav.deviceMemory === "number" && nav.deviceMemory < 2) ||
    (typeof nav.hardwareConcurrency === "number" && nav.hardwareConcurrency < 4);
  const dokunmatik = typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;
  return { webgl, zayif, dokunmatik };
}

/** Geriye uyum: tek seviyeli değerlendirme */
export function grafikSeviyesi(): GrafikSeviyesi {
  const c = cihazDurumu();
  return c.webgl && !c.zayif ? "tam" : "hafif";
}

/**
 * Sahnedeki küçük canlılık öğeleri (baca dumanı, seçili birimin pencere
 * parlaması) yalnız güçlü masaüstünde ve hareketi azalt kapalıyken sürekli
 * çizilir. Telefon/tablet (kaba işaretçi), zayıf cihaz ya da çekirdek sayısı
 * bilinmeyen tarayıcıda öğeler sabit kalır ve sahne boştayken hiç çizmez.
 */
export function canliSahneUygun(o: { dokunmatik: boolean; azHareket: boolean; cekirdek?: number; bellek?: number }): boolean {
  if (o.dokunmatik || o.azHareket) return false;
  if (typeof o.cekirdek !== "number" || o.cekirdek < 4) return false;
  if (typeof o.bellek === "number" && o.bellek < 2) return false;
  return true;
}
