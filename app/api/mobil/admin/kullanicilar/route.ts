import { NextRequest } from "next/server";
import { sayfalama, sorguMetni } from "@/lib/mobilBicim";
import { adminKapisi, hataYaniti, jsonYanit, sunucuHatasi } from "@/lib/mobilKapi";
import { kullanicilariGetir } from "@/lib/mobilAdmin";
import { paketMi } from "@/lib/paketler";

// Yalnız müşteriler (CUSTOMER); yeni → eski
export async function GET(req: NextRequest) {
  try {
    const k = await adminKapisi();
    if ("yanit" in k) return k.yanit;
    const arama = req.nextUrl.searchParams;
    const paket = sorguMetni(arama, "paket");
    if (paket !== null && !paketMi(paket)) return hataYaniti("Geçersiz paket.", 400, "GECERSIZ_ALAN");
    const sayfa = sayfalama(arama);
    const { kayitlar, toplam, sayac } = await kullanicilariGetir({ q: sorguMetni(arama, "q"), paket }, sayfa);
    return jsonYanit({ ...sayfa.sar(kayitlar, toplam), sayac });
  } catch (err) {
    return sunucuHatasi(err);
  }
}
