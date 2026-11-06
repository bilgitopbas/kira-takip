import { prisma } from "@/lib/prisma";
import { kullaniciTuru } from "@/lib/mobilBicim";
import { jsonYanit, kendiHesabiKapisi, sunucuHatasi } from "@/lib/mobilKapi";

// Kullanım koşulları + açık rıza onayı. Yalnız hesap sahibinin kaydına yazılır;
// önceki onay tarihi korunur. Üye ve adminde etkisiz.
export async function POST() {
  try {
    const k = await kendiHesabiKapisi();
    if ("yanit" in k) return k.yanit;
    if (kullaniciTuru(k.session.mobilRol ?? "CUSTOMER", k.session.memberId) === "SAHIP") {
      const simdi = new Date();
      const id = k.session.userId;
      await prisma.$transaction([
        prisma.user.updateMany({ where: { id, termsAcceptedAt: null }, data: { termsAcceptedAt: simdi } }),
        prisma.user.updateMany({ where: { id, marketingConsentAt: null }, data: { marketingConsentAt: simdi } }),
      ]);
    }
    return jsonYanit({ mesaj: "Onay kaydedildi." });
  } catch (err) {
    return sunucuHatasi(err);
  }
}
