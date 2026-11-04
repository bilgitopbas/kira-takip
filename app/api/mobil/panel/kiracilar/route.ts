import { NextRequest } from "next/server";
import { sayfalama, sorguMetni } from "@/lib/mobilBicim";
import { jsonYanit, panelKapisi, sunucuHatasi } from "@/lib/mobilKapi";
import { kiracilariGetir } from "@/lib/mobilPanel";

export async function GET(req: NextRequest) {
  try {
    const k = await panelKapisi();
    if ("yanit" in k) return k.yanit;
    const arama = req.nextUrl.searchParams;
    const sayfa = sayfalama(arama);
    const { kayitlar, toplam } = await kiracilariGetir(
      k.session.userId,
      {
        q: sorguMetni(arama, "q"),
        propertyId: sorguMetni(arama, "propertyId"),
        il: sorguMetni(arama, "il"),
        oturma: sorguMetni(arama, "oturma"),
        siralama: sorguMetni(arama, "siralama"),
      },
      sayfa
    );
    return jsonYanit(sayfa.sar(kayitlar, toplam));
  } catch (err) {
    return sunucuHatasi(err);
  }
}
