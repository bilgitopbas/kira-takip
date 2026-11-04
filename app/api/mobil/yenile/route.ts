import { NextRequest } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { oturumYenile } from "@/lib/mobilOturum";
import { hataYaniti, jsonGovde, jsonYanit, sunucuHatasi } from "@/lib/mobilKapi";

// Yenileme jetonu → yeni erişim + yeni yenileme jetonu (eskisi 60 sn daha geçerli,
// sonra çalınma sayılır). Her hata 401 + kod: uygulama girişe döner.
export async function POST(req: NextRequest) {
  try {
    if (!checkRateLimit(`mobil-yenile:${getClientIp(req)}`, 120, 15 * 60 * 1000)) {
      return hataYaniti("Çok fazla istek. Lütfen daha sonra tekrar deneyin.", 429, "RATE_LIMIT");
    }
    const g = await jsonGovde(req);
    if ("yanit" in g) return g.yanit;
    const sonuc = await oturumYenile(g.govde.yenilemeJetonu);
    if ("hata" in sonuc) return hataYaniti("Oturum geçersiz. Lütfen yeniden giriş yapın.", 401, sonuc.hata);
    return jsonYanit(sonuc.tamam);
  } catch (err) {
    return sunucuHatasi(err);
  }
}
