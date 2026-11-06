import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rateLimit";
import { cihazJetonuGecerli } from "@/lib/pushBicim";
import { hataYaniti, jsonGovde, jsonYanit, kendiHesabiKapisi, sunucuHatasi } from "@/lib/mobilKapi";

// Push jetonu kaydı: uygulama her açılışta çağırabilir (jeton değişmişse güncellenir).
// Aynı jeton başka hesapta kayıtlıysa bu hesaba geçer: cihazda oturum değişmiştir.
// Jeton erişim jetonundaki mobil oturuma bağlanır; oturum düşünce silinir.
export async function POST(req: Request) {
  try {
    const k = await kendiHesabiKapisi();
    if ("yanit" in k) return k.yanit;
    const { userId, mobilOturumId } = k.session;
    if (!checkRateLimit(`mobil-cihaz:${mobilOturumId}`, 60, 15 * 60 * 1000)) {
      return hataYaniti("Çok fazla istek. Lütfen daha sonra tekrar deneyin.", 429, "RATE_LIMIT");
    }
    const g = await jsonGovde(req);
    if ("yanit" in g) return g.yanit;
    const { platform, jeton } = g.govde;
    if (platform !== "ios" && platform !== "android") return hataYaniti("Geçersiz platform.", 400, "GECERSIZ_PLATFORM");
    if (!cihazJetonuGecerli(platform, jeton)) return hataYaniti("Geçersiz cihaz jetonu.", 400, "GECERSIZ_JETON");
    // Erişim jetonu çıkıştan birkaç dakika uzun yaşayabilir: düşmüş oturuma push kaydı açılmaz
    const oturum = await prisma.mobilOturum.findFirst({ where: { id: mobilOturumId, userId }, select: { id: true } });
    if (!oturum) return hataYaniti("Oturum geçersiz. Lütfen yeniden giriş yapın.", 401, "OTURUM_YOK");
    await prisma.cihazJetonu.upsert({
      where: { jeton },
      create: { jeton, platform, userId, mobilOturumId },
      update: { platform, userId, mobilOturumId, sonGorulme: new Date() },
    });
    return jsonYanit({ mesaj: "Cihaz kaydedildi." });
  } catch (err) {
    return sunucuHatasi(err);
  }
}

// Yalnız kendi hesabının jetonu silinir; jeton yoksa da sonuç aynı
export async function DELETE(req: Request) {
  try {
    const k = await kendiHesabiKapisi();
    if ("yanit" in k) return k.yanit;
    const g = await jsonGovde(req);
    if ("yanit" in g) return g.yanit;
    const { jeton } = g.govde;
    if (typeof jeton !== "string" || !jeton) return hataYaniti("Geçersiz cihaz jetonu.", 400, "GECERSIZ_JETON");
    await prisma.cihazJetonu.deleteMany({ where: { jeton, userId: k.session.userId } });
    return jsonYanit({ mesaj: "Cihaz silindi." });
  } catch (err) {
    return sunucuHatasi(err);
  }
}
