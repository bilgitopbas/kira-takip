import { NextRequest } from "next/server";
import { sayfalama, sorguMetni, sorguTarihi } from "@/lib/mobilBicim";
import { jsonYanit, panelKapisi, sunucuHatasi } from "@/lib/mobilKapi";
import { masraflariGetir } from "@/lib/mobilPanel";

export async function GET(req: NextRequest) {
  try {
    const k = await panelKapisi();
    if ("yanit" in k) return k.yanit;
    const arama = req.nextUrl.searchParams;
    const sayfa = sayfalama(arama);
    const { kayitlar, toplam, toplamTutar } = await masraflariGetir(
      k.session.userId,
      {
        bas: sorguTarihi(arama, "bas"),
        bit: sorguTarihi(arama, "bit"),
        propertyId: sorguMetni(arama, "propertyId"),
        tenantId: sorguMetni(arama, "tenantId"),
      },
      sayfa
    );
    return jsonYanit({ ...sayfa.sar(kayitlar, toplam), toplamTutar });
  } catch (err) {
    return sunucuHatasi(err);
  }
}
