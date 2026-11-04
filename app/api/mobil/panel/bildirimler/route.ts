import { NextRequest } from "next/server";
import { sayfalama } from "@/lib/mobilBicim";
import { jsonYanit, panelKapisi, sunucuHatasi } from "@/lib/mobilKapi";
import { bildirimleriGetir } from "@/lib/mobilPanel";

// Okundu ve sil için web uçları (/api/dashboard/notifications/*) Bearer ile çalışır.
export async function GET(req: NextRequest) {
  try {
    const k = await panelKapisi();
    if ("yanit" in k) return k.yanit;
    const arama = req.nextUrl.searchParams;
    const sayfa = sayfalama(arama);
    const { kayitlar, toplam, okunmamis } = await bildirimleriGetir(
      k.session.userId,
      arama.get("okunmamis") === "1",
      sayfa
    );
    return jsonYanit({ ...sayfa.sar(kayitlar, toplam), okunmamis });
  } catch (err) {
    return sunucuHatasi(err);
  }
}
