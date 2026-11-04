import { oturumKapat } from "@/lib/mobilOturum";
import { jsonGovde, jsonYanit, sunucuHatasi } from "@/lib/mobilKapi";

// Yetki yenileme jetonunun kendisi: erişim jetonu bitmiş olsa da çıkış yapılabilir
export async function POST(req: Request) {
  try {
    const g = await jsonGovde(req);
    if ("yanit" in g) return g.yanit;
    await oturumKapat(g.govde.yenilemeJetonu, g.govde.cihazJetonu);
    return jsonYanit({ mesaj: "Çıkış yapıldı." });
  } catch (err) {
    return sunucuHatasi(err);
  }
}
