import bcrypt from "bcryptjs";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { oturumAc } from "@/lib/mobilOturum";
import { hataYaniti, jsonGovde, jsonYanit, sunucuHatasi } from "@/lib/mobilKapi";

const GECERSIZ_MESAJ =
  "E-posta veya şifre hatalı. Hesabınızı web'de Google ile açtıysanız önce Şifremi Unuttum ile şifre belirleyin.";
const EPOSTA_SINIRI = 254;
const SIFRE_SINIRI = 200;

// Hesabı olmayan e-postada da bcrypt çalışsın: yanıt süresi hesabın varlığını sızdırmasın
const sahteOzet = bcrypt.hashSync("mizan-mobil-sahte-sifre", 10);

// Web kayıt akışı e-postayı yazıldığı gibi, davet küçük harfle saklar
const adaylar = (email: string) => [...new Set([email, email.toLowerCase()])];

async function kullaniciBul(email: string) {
  for (const aday of adaylar(email)) {
    const user = await prisma.user.findUnique({ where: { email: aday }, select: { id: true, passwordHash: true } });
    if (user) return user;
  }
  return null;
}

async function uyeBul(email: string) {
  for (const aday of adaylar(email)) {
    const uye = await prisma.accountMember.findUnique({
      where: { email: aday },
      select: { id: true, ownerId: true, passwordHash: true },
    });
    if (uye) return uye;
  }
  return null;
}

// E-posta + şifre → erişim + yenileme jetonu. Sıra web girişiyle aynı: önce hesap
// sahibi, yoksa ekip üyesi. Şifresiz hesap ve kabul edilmemiş davet de aynı yanıtı verir.
export async function POST(req: NextRequest) {
  try {
    if (!checkRateLimit(`mobil-giris:${getClientIp(req)}`, 10, 15 * 60 * 1000)) {
      return hataYaniti("Çok fazla deneme yaptınız. Lütfen daha sonra tekrar deneyin.", 429, "RATE_LIMIT");
    }
    const g = await jsonGovde(req);
    if ("yanit" in g) return g.yanit;
    const { email: hamEposta, sifre, cihazId } = g.govde;
    const email = typeof hamEposta === "string" ? hamEposta.trim() : "";
    if (!email || email.length > EPOSTA_SINIRI || typeof sifre !== "string" || !sifre || sifre.length > SIFRE_SINIRI) {
      return hataYaniti("E-posta ve şifre zorunludur.", 400, "EKSIK_ALAN");
    }

    const user = await kullaniciBul(email);
    const uye = user ? null : await uyeBul(email);
    const ozet = user?.passwordHash ?? uye?.passwordHash ?? null;
    const dogru = await bcrypt.compare(sifre, ozet ?? sahteOzet);
    if (!ozet || !dogru) return hataYaniti(GECERSIZ_MESAJ, 401, "GECERSIZ");

    return jsonYanit(await oturumAc(user ? { userId: user.id } : { userId: uye!.ownerId, memberId: uye!.id }, cihazId));
  } catch (err) {
    return sunucuHatasi(err);
  }
}
