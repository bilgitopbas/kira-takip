"use client";

import { useSyncExternalStore } from "react";
import { isNativeApp } from "@/lib/native";

// Değişmeyen bir değer olduğu için abonelik boş; sunucu tarafında her zaman
// false döner, istemcide gerçek değer okunur. useEffect + setState yerine
// bunu kullanmak hidrasyon uyuşmazlığını da önler.
const aboneOl = () => () => {};

export function useNativeApp() {
  return useSyncExternalStore(
    aboneOl,
    () => isNativeApp(),
    () => false
  );
}
