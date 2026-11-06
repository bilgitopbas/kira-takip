import { getSession } from "@/lib/auth";
import { mobilVekaletMi, VEKALET_YASAK_MESAJI } from "@/lib/mobilBicim";
import { oturumKapat } from "@/lib/mobilOturum";
import { hataYaniti, jsonGovde, jsonYanit, sunucuHatasi } from "@/lib/mobilKapi";

// Yetki yenileme jetonunun kendisi: erişim jetonu bitmiş olsa da çıkış yapılabilir
export async function POST(req: Request) {
  try {
    // Müşteri panelindeki yönetici çıkışı uygulamada vekalet jetonunu bırakarak yapar
    const session = await getSession();
    if (session && mobilVekaletMi(session)) return hataYaniti(VEKALET_YASAK_MESAJI, 403, "VEKALET_YASAK");
    const g = await jsonGovde(req);
    if ("yanit" in g) return g.yanit;
    await oturumKapat(g.govde.yenilemeJetonu, g.govde.cihazJetonu);
    return jsonYanit({ mesaj: "Çıkış yapıldı." });
  } catch (err) {
    return sunucuHatasi(err);
  }
}
