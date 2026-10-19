// WebGL yetenek testi: yeni paneldeki 3D sahne ve harita WebGL ister.
// Desteklenmiyorsa ya da cihaz zayıfsa "hafif görünüm" gösterilir.

export type GrafikSeviyesi = "tam" | "hafif";

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
 * görünüm açılır); kullanıcı yine de tam görünüme geçebilir.
 */
export function grafikSeviyesi(): GrafikSeviyesi {
  if (!webglVarMi()) return "hafif";
  const nav = navigator as Navigator & { deviceMemory?: number };
  if (typeof nav.deviceMemory === "number" && nav.deviceMemory < 2) return "hafif";
  if (typeof nav.hardwareConcurrency === "number" && nav.hardwareConcurrency < 4) return "hafif";
  return "tam";
}
