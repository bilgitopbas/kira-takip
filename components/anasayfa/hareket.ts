// Ana sayfadaki tüm hareketlerin ortak durdurma anahtarı. "Hareketi azalt"
// açık cihazlarda kökteki .anasayfa öğesine data-durdu yazılır; döngüler bunu
// okur, CSS animasyonları da aynı öznitelikle bekler.

export const HAREKET_OLAYI = "mz-hareket";

export function azHareketMi(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function hareketDurdu(): boolean {
  return document.querySelector(".anasayfa")?.hasAttribute("data-durdu") ?? true;
}

export function hareketiAyarla(durdu: boolean) {
  const kok = document.querySelector(".anasayfa");
  if (!kok) return;
  kok.toggleAttribute("data-durdu", durdu);
  window.dispatchEvent(new CustomEvent(HAREKET_OLAYI, { detail: { durdu } }));
}

/** Sekme görünür, hareket açık: döngü bu karede çalışmalı mı? */
export function dongudeCalis(): boolean {
  return !document.hidden && !hareketDurdu();
}
