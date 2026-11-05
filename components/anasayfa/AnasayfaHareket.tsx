"use client";

import { useEffect } from "react";
import { trSayi, yavaslayan } from "@/lib/anasayfaGrafik";
import { azHareketMi, HAREKET_OLAYI } from "./hareket";

// Sunucuda çizilen bölümlerin hareketleri: görünce belirme, sayaçlar, kıvılcım
// grafiklerindeki noktalar, cihaz eğimi. Hiçbir şey çizmez.
// İçerik varsayılan olarak görünür; yalnız ilk anda ekran dışında kalanlar
// ".bekle" ile gizlenip ekrana girince belirir (ilk boyamada yanıp sönme olmaz).
export default function AnasayfaHareket() {
  useEffect(() => {
    const kok = document.querySelector<HTMLElement>(".anasayfa");
    if (!kok) return;
    const temizle: (() => void)[] = [];
    const az = azHareketMi();
    const dokunmatik = window.matchMedia("(pointer: coarse)").matches;

    // SVG içindeki dolaşan noktalar (animateMotion) hareket anahtarına uyar.
    const svgler = [...kok.querySelectorAll<SVGSVGElement>(".kivilcim")];
    if (az) svgler.forEach((s) => s.querySelectorAll("animateMotion").forEach((a) => a.remove()));
    const svgAnahtar = (e: Event) => {
      const durdu = (e as CustomEvent<{ durdu: boolean }>).detail.durdu;
      svgler.forEach((s) => (durdu ? s.pauseAnimations() : s.unpauseAnimations()));
    };
    window.addEventListener(HAREKET_OLAYI, svgAnahtar);
    temizle.push(() => window.removeEventListener(HAREKET_OLAYI, svgAnahtar));

    const say = (el: HTMLElement) => {
      const hedef = Number(el.dataset.say);
      const son = el.dataset.son ?? "";
      const t0 = performance.now();
      const adim = (t: number) => {
        const p = Math.min(1, (t - t0) / 2000);
        el.textContent = trSayi(Math.round(hedef * yavaslayan(p))) + son;
        if (p < 1) requestAnimationFrame(adim);
      };
      requestAnimationFrame(adim);
    };

    if (!az) {
      const izle = new IntersectionObserver(
        (girdiler) => {
          for (const g of girdiler) {
            if (!g.isIntersecting) continue;
            const el = g.target as HTMLElement;
            el.classList.remove("bekle");
            el.querySelectorAll<HTMLElement>("[data-say]").forEach(say);
            izle.unobserve(el);
          }
        },
        { threshold: 0.18, rootMargin: "0px 0px -6% 0px" },
      );
      kok.querySelectorAll<HTMLElement>(".belir").forEach((el) => {
        if (el.closest(".kahraman")) return;
        const r = el.getBoundingClientRect();
        if (r.top < window.innerHeight && r.bottom > 0) return;
        el.classList.add("bekle");
        el.querySelectorAll<HTMLElement>("[data-say]").forEach((s) => (s.textContent = "0" + (s.dataset.son ?? "")));
        izle.observe(el);
      });
      temizle.push(() => izle.disconnect());
    }

    const sahne = kok.querySelector<HTMLElement>("[data-egim]");
    const grup = sahne?.querySelector<HTMLElement>(".cihaz-grup");
    if (sahne && grup && !dokunmatik && !az) {
      const egim = (e: PointerEvent) => {
        const r = sahne.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        grup.style.transform = `rotateY(${x * 8}deg) rotateX(${-y * 6}deg)`;
      };
      const birak = () => (grup.style.transform = "");
      sahne.addEventListener("pointermove", egim);
      sahne.addEventListener("pointerleave", birak);
      temizle.push(() => {
        sahne.removeEventListener("pointermove", egim);
        sahne.removeEventListener("pointerleave", birak);
      });
    }

    return () => temizle.forEach((f) => f());
  }, []);

  return null;
}
