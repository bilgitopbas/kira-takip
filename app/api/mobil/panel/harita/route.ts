import { NextRequest } from "next/server";
import { sorguMetni } from "@/lib/mobilBicim";
import { jsonYanit, panelKapisi, sunucuHatasi } from "@/lib/mobilKapi";
import { haritaVerisi } from "@/lib/mobilPanelModeli";
import { binalariKur } from "@/lib/yeniPanelBina";
import { panelBirimleriGetir } from "@/lib/yeniPanelBirimleri";

// Konum haritası. Kümeleme (kumele, haritaSeviyesi) istemcide.
export async function GET(req: NextRequest) {
  try {
    const k = await panelKapisi();
    if ("yanit" in k) return k.yanit;
    const il = sorguMetni(req.nextUrl.searchParams, "il");
    const { birimler } = await panelBirimleriGetir(k.session.userId);
    return jsonYanit(haritaVerisi(binalariKur(il ? birimler.filter((b) => b.il === il) : birimler)));
  } catch (err) {
    return sunucuHatasi(err);
  }
}
