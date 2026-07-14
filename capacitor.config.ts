import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.mizanmulkyonetimi.app",
  appName: "Mizan Mülk Yönetimi",
  webDir: "capacitor-www",
  server: {
    url: "https://mizanmulkyonetimi.com",
    cleartext: false,
  },
  ios: {
    contentInset: "automatic",
  },
  android: {
    allowMixedContent: false,
  },
};

export default config;
