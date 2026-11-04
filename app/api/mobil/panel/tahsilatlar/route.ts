import { NextRequest } from "next/server";
import { sayfalama, sorguMetni, sorguTarihi } from "@/lib/mobilBicim";
import { jsonYanit, panelKapisi, sunucuHatasi } from "@/lib/mobilKapi";
import { tahsilatlariGetir } from "@/lib/mobilPanel";

export async function GET(req: NextRequest) {
  try {
    const k = await panelKapisi();
    if ("yanit" in k) return k.yanit;
    const arama = req.nextUrl.searchParams;
    const sayfa = sayfalama(arama);
    const { kayitlar, toplam, toplamTutar } = await tahsilatlariGetir(
      k.session.userId,
      {
        bas: sorguTarihi(arama, "bas"),
        bit: sorguTarihi(arama, "bit"),
        tenantId: sorguMetni(arama, "tenantId"),
        q: sorguMetni(arama, "q"),
      },
      sayfa
    );
    return jsonYanit({ ...sayfa.sar(kayitlar, toplam), toplamTutar });
  } catch (err) {
    return sunucuHatasi(err);
  }
}
