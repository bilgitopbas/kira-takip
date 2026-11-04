import { NextRequest } from "next/server";
import { sorguMetni } from "@/lib/mobilBicim";
import { jsonYanit, panelKapisi, sunucuHatasi } from "@/lib/mobilKapi";
import { ilSayilari } from "@/lib/mobilPanelModeli";
import { binalariKur, ozetle } from "@/lib/yeniPanelBina";
import { panelBirimleriGetir } from "@/lib/yeniPanelBirimleri";

// Binalarım gruplaması. iller süzgeçten önceki tüm birimlerden sayılır (il seçici için).
export async function GET(req: NextRequest) {
  try {
    const k = await panelKapisi();
    if ("yanit" in k) return k.yanit;
    const il = sorguMetni(req.nextUrl.searchParams, "il");
    const { birimler } = await panelBirimleriGetir(k.session.userId);
    const secili = il ? birimler.filter((b) => b.il === il) : birimler;
    return jsonYanit({
      binalar: binalariKur(secili).map((b) => ({ ...b, ozet: ozetle(b.birimler) })),
      toplamOzet: ozetle(secili),
      ...ilSayilari(birimler),
    });
  } catch (err) {
    return sunucuHatasi(err);
  }
}
