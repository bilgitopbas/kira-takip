import { NextRequest } from "next/server";
import { sorguMetni } from "@/lib/mobilBicim";
import { jsonYanit, panelKapisi, sunucuHatasi } from "@/lib/mobilKapi";
import { sehirDuzeniGetir } from "@/lib/mobilPanel";
import { DUZEN_SINIRI } from "@/lib/sehirDuzeni";
import { binalariKur } from "@/lib/yeniPanelBina";
import { panelBirimleriGetir } from "@/lib/yeniPanelBirimleri";

// 3D Mülk Şehrim verisi: binalar, sehirBinasi(bina) girdisinin kendisi (web'deki
// binalariKur(ilBirimleri)). duzen, il başına kayıtlı yerleşim; "*" = tüm iller.
export async function GET(req: NextRequest) {
  try {
    const k = await panelKapisi();
    if ("yanit" in k) return k.yanit;
    const ownerId = k.session.userId;
    const il = sorguMetni(req.nextUrl.searchParams, "il", DUZEN_SINIRI.il);
    const [{ birimler }, duzen] = await Promise.all([panelBirimleriGetir(ownerId), sehirDuzeniGetir(ownerId, il ?? "*")]);
    return jsonYanit({
      il: il ?? "*",
      binalar: binalariKur(il ? birimler.filter((b) => b.il === il) : birimler),
      duzen,
    });
  } catch (err) {
    return sunucuHatasi(err);
  }
}
