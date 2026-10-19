// maplibre-gl 6 harita işçisini (web worker) ayrı bir dosyadan yükler ve
// yerini kendi paketinin adresinden hesaplar; paketleyici (Turbopack) bu
// dosyayı çıktıya kopyalamaz. Bu yüzden işçi dosyası, build öncesinde
// public/ altına sürüm adıyla kopyalanır ve Harita.tsx onu setWorkerUrl ile
// gösterir. `npm run build` bunu "prebuild" adımı olarak kendiliğinden çalıştırır.
//
// Dosya bulunamazsa build DURDURULMAZ (yalnız uyarı): yalnız yeni paneldeki
// harita açılmaz, sitenin geri kalanı etkilenmez.
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

try {
  const surum = require("maplibre-gl/package.json").version;
  const kaynak = path.join(path.dirname(require.resolve("maplibre-gl/package.json")), "dist", "maplibre-gl-worker.mjs");
  const hedefKlasor = path.join(process.cwd(), "public", "vendor", "maplibre");
  const hedef = path.join(hedefKlasor, `maplibre-gl-worker-${surum}.mjs`);

  fs.mkdirSync(hedefKlasor, { recursive: true });
  // Eski sürümlerin işçilerini temizle
  for (const f of fs.readdirSync(hedefKlasor)) {
    if (f.startsWith("maplibre-gl-worker-") && f !== path.basename(hedef)) fs.rmSync(path.join(hedefKlasor, f));
  }
  fs.copyFileSync(kaynak, hedef);
  console.log(`maplibre işçisi kopyalandı: public/vendor/maplibre/${path.basename(hedef)}`);
} catch (err) {
  console.warn("UYARI: maplibre işçisi kopyalanamadı; yeni paneldeki harita açılmayabilir.", err?.message ?? err);
}
