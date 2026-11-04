import { NextRequest } from "next/server";
import { sayfalama, sorguMetni } from "@/lib/mobilBicim";
import { jsonYanit, panelKapisi, sunucuHatasi } from "@/lib/mobilKapi";
import { birimleriSuz, durumOku, durumSayaci } from "@/lib/mobilPanelModeli";
import { birimleriSirala, type BirimSiralama } from "@/lib/yeniPanelBina";
import { panelBirimleriGetir } from "@/lib/yeniPanelBirimleri";

const SIRALAMALAR: BirimSiralama[] = ["no", "gec", "kira"];

export async function GET(req: NextRequest) {
  try {
    const k = await panelKapisi();
    if ("yanit" in k) return k.yanit;
    const arama = req.nextUrl.searchParams;
    const sayfa = sayfalama(arama);
    const siralama = SIRALAMALAR.find((s) => s === arama.get("siralama")) ?? "no";

    // Durum ve bina hesabı web'le aynı işlevden; süzme ve sayfalama bellekte
    const { birimler } = await panelBirimleriGetir(k.session.userId);
    const suzulen = birimleriSirala(
      birimleriSuz(birimler, {
        q: sorguMetni(arama, "q"),
        il: sorguMetni(arama, "il"),
        durum: durumOku(arama.get("durum")),
        tip: sorguMetni(arama, "tip"),
      }),
      siralama
    );
    return jsonYanit({
      ...sayfa.sar(suzulen.slice(sayfa.skip, sayfa.skip + sayfa.take), suzulen.length),
      sayac: durumSayaci(birimler),
    });
  } catch (err) {
    return sunucuHatasi(err);
  }
}
