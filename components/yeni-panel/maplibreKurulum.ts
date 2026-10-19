// maplibre-gl ortak kurulumu (yalnız istemci; harita parçalarında içe aktarılır).
// maplibre 6 işçi dosyasını kendi paket adresinden yükler; paketleyici bu dosyayı
// kopyalamadığı için build öncesi public/ altına kopyalanır
// (scripts/maplibre-worker-kopyala.mjs) ve buradan gösterilir.
import { getVersion, setWorkerUrl, type Map as HaritaGL } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

setWorkerUrl(`/vendor/maplibre/maplibre-gl-worker-${getVersion()}.mjs`);

export const HARITA_STILI = {
  acik: "https://tiles.openfreemap.org/styles/liberty",
  koyu: "https://tiles.openfreemap.org/styles/dark",
};

/** Harita etiketlerini Türkçe ada çevir (name:tr yoksa Latin adı, o da yoksa yerel ad) */
export function turkceEtiketler(harita: HaritaGL) {
  for (const katman of harita.getStyle().layers ?? []) {
    if (katman.type !== "symbol") continue;
    if (!harita.getLayoutProperty(katman.id, "text-field")) continue;
    harita.setLayoutProperty(katman.id, "text-field", ["coalesce", ["get", "name:tr"], ["get", "name:latin"], ["get", "name"]]);
  }
}

/** Dokunmatik cihazda tek parmak sayfayı kaydırsın, harita iki parmakla oynasın */
export const dokunmatik = () => typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;

/** Harita denetimlerinin Türkçe metinleri */
export const HARITA_YERELI: Record<string, string> = {
  "NavigationControl.ZoomIn": "Yakınlaştır",
  "NavigationControl.ZoomOut": "Uzaklaştır",
  "NavigationControl.ResetBearing": "Kuzeye çevir",
  "AttributionControl.ToggleAttribution": "Kaynakları göster",
  "AttributionControl.MapFeedback": "Harita geri bildirimi",
  "CooperativeGesturesHandler.MobileHelpText": "Haritayı oynatmak için iki parmak kullanın",
  "CooperativeGesturesHandler.WindowsHelpText": "Yakınlaştırmak için Ctrl + kaydırma kullanın",
  "CooperativeGesturesHandler.MacHelpText": "Yakınlaştırmak için ⌘ + kaydırma kullanın",
};
