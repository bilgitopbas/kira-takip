"use client";

import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { isNativeApp } from "@/lib/native";

type Metrics = {
  innerW: number;
  innerH: number;
  docClientW: number;
  docScrollW: number;
  bodyScrollW: number;
  safeTop: string;
  safeBottom: string;
  platform: string;
  ts: number;
};

function readMetrics(startedAt: number): Metrics {
  const probe = document.createElement("div");
  probe.style.paddingTop = "env(safe-area-inset-top)";
  probe.style.paddingBottom = "env(safe-area-inset-bottom)";
  probe.style.position = "absolute";
  probe.style.visibility = "hidden";
  document.body.appendChild(probe);
  const computed = getComputedStyle(probe);
  const safeTop = computed.paddingTop;
  const safeBottom = computed.paddingBottom;
  document.body.removeChild(probe);

  return {
    innerW: window.innerWidth,
    innerH: window.innerHeight,
    docClientW: document.documentElement.clientWidth,
    docScrollW: document.documentElement.scrollWidth,
    bodyScrollW: document.body.scrollWidth,
    safeTop,
    safeBottom,
    platform: Capacitor.getPlatform(),
    ts: Date.now() - startedAt,
  };
}

// GEÇİCİ TANI ARACI — ilk açılıştaki taşma/boşluk sorununu build beklemeden
// canlı incelemek için. Sorun teşhis edilince kaldırılacak.
export default function NativeDebugOverlay() {
  const [visible, setVisible] = useState(true);
  const [metrics, setMetrics] = useState<Metrics | null>(null);

  useEffect(() => {
    if (!isNativeApp()) return;
    const startedAt = Date.now();
    setMetrics(readMetrics(startedAt));
    const interval = setInterval(() => setMetrics(readMetrics(startedAt)), 300);
    return () => clearInterval(interval);
  }, []);

  if (!isNativeApp() || !metrics || !visible) return null;

  const overflowing = metrics.docScrollW > metrics.docClientW + 2;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 8,
        left: 8,
        right: 8,
        zIndex: 999999,
        fontFamily: "monospace",
        fontSize: 10,
        lineHeight: 1.5,
        color: "#fff",
        background: overflowing ? "rgba(180,0,0,0.85)" : "rgba(0,0,0,0.75)",
        borderRadius: 8,
        padding: "6px 8px",
        pointerEvents: "auto",
      }}
      onClick={() => setVisible(false)}
    >
      <div>
        W:{metrics.innerW} docClientW:{metrics.docClientW} docScrollW:{metrics.docScrollW}{" "}
        {overflowing ? "⚠ TAŞMA VAR" : "OK"}
      </div>
      <div>
        H:{metrics.innerH} bodyScrollW:{metrics.bodyScrollW} safeTop:{metrics.safeTop} safeBottom:
        {metrics.safeBottom}
      </div>
      <div>
        platform:{metrics.platform} t+{metrics.ts}ms (kapatmak için dokun)
      </div>
    </div>
  );
}
