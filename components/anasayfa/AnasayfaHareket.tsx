"use client";

import { useEffect } from "react";
import { trSayi, yavaslayan } from "@/lib/anasayfaGrafik";
import { azHareketMi, dongudeCalis, HAREKET_OLAYI } from "./hareket";

// Sunucuda çizilen bölümlerin hareketleri: görünce belirme, sayaçlar, nefes alan
// çubuklar, canlı kiracı durumu, kart ışığı, cihaz eğimi. Hiçbir şey çizmez.
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

    if (!az) {
      // Finansal raporlama çubukları nefes alır; Burak Şahin'in durumu ödenir/gecikir.
      const cubuklar = [...kok.querySelectorAll<HTMLElement>("[data-nefes]")];
      const durum = kok.querySelector<HTMLElement>("[data-canli-durum]");
      let odendi = false;
      const nefes = window.setInterval(() => {
        if (!dongudeCalis()) return;
        cubuklar.forEach((c) => (c.style.height = `${Math.min(100, Number(c.dataset.nefes) * (0.86 + Math.random() * 0.26))}%`));
      }, 2600);
      const durumId = window.setInterval(() => {
        if (!durum || !dongudeCalis()) return;
        odendi = !odendi;
        durum.className = `durum ${odendi ? "d-odendi" : "d-gec"}`;
        durum.textContent = odendi ? "Ödendi" : "2 gün geç";
      }, 3200);
      temizle.push(() => window.clearInterval(nefes), () => window.clearInterval(durumId));
    }

    if (!dokunmatik) {
      const kartlar = [...kok.querySelectorAll<HTMLElement>(".kart")];
      const isik = (e: PointerEvent) => {
        const k = e.currentTarget as HTMLElement;
        const r = k.getBoundingClientRect();
        k.style.setProperty("--mx", `${e.clientX - r.left}px`);
        k.style.setProperty("--my", `${e.clientY - r.top}px`);
      };
      kartlar.forEach((k) => k.addEventListener("pointermove", isik));
      temizle.push(() => kartlar.forEach((k) => k.removeEventListener("pointermove", isik)));
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
