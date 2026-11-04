import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rateLimit";
import { kullaniciTuru } from "@/lib/mobilBicim";
import { sahipHesabiniSil } from "@/lib/hesapSilme";
import { canliOturumKapisi, hataYaniti, jsonGovde, jsonYanit, sunucuHatasi } from "@/lib/mobilKapi";

const ONAY_METNI = "hesabımı sil";

// GERİ ALINAMAZ. Sahip: tüm hesap. Üye: yalnız kendi üyeliği, sahibin verisine
// dokunulmaz. Admin: mobilden silinemez.
export async function POST(req: Request) {
  try {
    const k = await canliOturumKapisi();
    if ("yanit" in k) return k.yanit;
    const { userId, mobilRol, memberId, mobilOturumId } = k.session;
    if (!checkRateLimit(`mobil-hesap-sil:${mobilOturumId}`, 5, 15 * 60 * 1000)) {
      return hataYaniti("Çok fazla deneme yaptınız. Lütfen daha sonra tekrar deneyin.", 429, "RATE_LIMIT");
    }
    const tur = kullaniciTuru(mobilRol ?? "CUSTOMER", memberId);
    if (tur === "ADMIN") return hataYaniti("Yönetici hesabı uygulamadan silinemez.", 403, "YETKISIZ");

    const g = await jsonGovde(req);
    if ("yanit" in g) return g.yanit;
    const { onayMetni } = g.govde;
    if (typeof onayMetni !== "string" || onayMetni.trim().toLocaleLowerCase("tr-TR") !== ONAY_METNI) {
      return hataYaniti('Onaylamak için "Hesabımı sil" yazmanız gerekiyor.', 400, "ONAY_GEREKLI");
    }

    if (tur === "UYE") {
      await prisma.accountMember.deleteMany({ where: { id: memberId, ownerId: userId } });
      return jsonYanit({ mesaj: "Üyeliğiniz silindi." });
    }
    await sahipHesabiniSil(userId);
    return jsonYanit({ mesaj: "Hesabınız silindi." });
  } catch (err) {
    return sunucuHatasi(err);
  }
}
