import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { computeAccessState } from "@/lib/access";
import { abonelikBilgisi, kullaniciTuru, sozlesmeGerekli, yenilemeKarari, type YenilemeHatasi } from "@/lib/mobilBicim";
import { YENILEME_SURESI_MS, erisimJetonuUret, jetonOzeti, yenilemeJetonuUret } from "@/lib/mobilJeton";

// Mobil oturum kaydı: giriş, yenileme, çıkış. Cihaz başına tek satır.
const ONCEKI_JETON_SURESI_MS = 60 * 1000;
const TEMIZLIK_ARALIGI_MS = 60 * 60 * 1000;
const CIHAZ_ID_SINIRI = 128;
const JETON_SINIRI = 512;
const YENILEME_DENEMESI = 2;

const SAHIP_SECIMI = {
  id: true,
  email: true,
  fullName: true,
  role: true,
  city: true,
  sessionVersion: true,
  subscriptionStatus: true,
  trialEndsAt: true,
  emailVerifiedAt: true,
  termsAcceptedAt: true,
  marketingConsentAt: true,
} as const;

const UYE_SECIMI = { id: true, email: true, fullName: true } as const;

type Sahip = {
  id: string;
  email: string;
  fullName: string;
  role: "ADMIN" | "CUSTOMER";
  city: string | null;
  sessionVersion: number;
  subscriptionStatus: "TRIAL" | "ACTIVE" | "PASSIVE" | "DANISMAN";
  trialEndsAt: Date;
  emailVerifiedAt: Date | null;
  termsAcceptedAt: Date | null;
  marketingConsentAt: Date | null;
};

type Uye = { id: string; email: string; fullName: string };

// Şifre özeti ve onay tarihleri istemciye gitmez; yalnız türetilmiş bayraklar gider
async function oturumYaniti(
  sahip: Sahip,
  uye: Uye | null,
  oturumId: string,
  cihazId: string,
  yenilemeJetonu: string,
  yenilemeBitis: Date
) {
  // Üye oturumu web'deki gibi her zaman CUSTOMER rolüyle açılır
  const role = uye ? "CUSTOMER" : sahip.role;
  const erisim = await erisimJetonuUret({
    userId: sahip.id,
    role,
    sv: sahip.sessionVersion,
    oturumId,
    ...(uye ? { memberId: uye.id, memberEmail: uye.email, memberName: uye.fullName } : {}),
  });
  const tur = kullaniciTuru(role, uye?.id);
  return {
    erisimJetonu: erisim.jeton,
    erisimBitis: erisim.bitis,
    yenilemeJetonu,
    yenilemeBitis,
    cihazId,
    kullanici: {
      id: sahip.id,
      ad: uye?.fullName ?? sahip.fullName,
      email: uye?.email ?? sahip.email,
      tur,
      ...(uye ? { memberId: uye.id } : {}),
      hesapAdi: sahip.fullName,
    },
    abonelik: abonelikBilgisi(sahip, computeAccessState(sahip)),
    emailOnayli: Boolean(sahip.emailVerifiedAt),
    profilEksik: !sahip.city,
    sozlesmeGerekli: sozlesmeGerekli(tur, sahip),
  };
}

// Bir daha gelmeyen telefonların kayıtları; jetonlar Cascade ile gider. Saatte en
// çok bir kez çalışır, hata girişi engellemez.
let sonTemizlik = 0;
async function suresiGecenleriTemizle() {
  if (Date.now() - sonTemizlik < TEMIZLIK_ARALIGI_MS) return;
  sonTemizlik = Date.now();
  try {
    await prisma.mobilOturum.deleteMany({ where: { sonKullanma: { lte: new Date() } } });
  } catch (err) {
    console.error("Mobil oturum temizliği başarısız:", err);
  }
}

// Girişte (şifre doğrulandıktan sonra): aynı cihazın eski kaydı yeni jetonla değişir
export async function oturumAc(kimlik: { userId: string; memberId?: string }, istenenCihazId: unknown) {
  await suresiGecenleriTemizle();
  const [sahip, uye] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: kimlik.userId }, select: SAHIP_SECIMI }),
    kimlik.memberId
      ? prisma.accountMember.findUniqueOrThrow({ where: { id: kimlik.memberId }, select: UYE_SECIMI })
      : Promise.resolve(null),
  ]);
  const cihazId =
    typeof istenenCihazId === "string" && istenenCihazId.trim() && istenenCihazId.length <= CIHAZ_ID_SINIRI
      ? istenenCihazId.trim()
      : randomUUID();
  const yenilemeJetonu = yenilemeJetonuUret();
  const yenilemeBitis = new Date(Date.now() + YENILEME_SURESI_MS);
  const alanlar = {
    yenilemeOzeti: jetonOzeti(yenilemeJetonu),
    oncekiOzet: null,
    oncekiGecerlilik: null,
    sessionVersion: sahip.sessionVersion,
    memberId: kimlik.memberId ?? null,
    sonKullanma: yenilemeBitis,
    sonGorulme: new Date(),
  };
  const oturum = await prisma.mobilOturum.upsert({
    where: { userId_cihazId: { userId: kimlik.userId, cihazId } },
    create: { userId: kimlik.userId, cihazId, ...alanlar },
    update: alanlar,
    select: { id: true },
  });
  return oturumYaniti(sahip, uye, oturum.id, cihazId, yenilemeJetonu, yenilemeBitis);
}

type YenilemeSonucu = { tamam: Awaited<ReturnType<typeof oturumYaniti>> } | { hata: YenilemeHatasi };

export async function oturumYenile(yenilemeJetonu: unknown): Promise<YenilemeSonucu> {
  if (typeof yenilemeJetonu !== "string" || !yenilemeJetonu || yenilemeJetonu.length > JETON_SINIRI) {
    return { hata: "GECERSIZ" };
  }
  const ozet = jetonOzeti(yenilemeJetonu);
  // Paralel yenilemede yazmayı kaybeden, güncel satırla bir kez daha karar verir
  for (let deneme = 0; deneme < YENILEME_DENEMESI; deneme++) {
    const sonuc = await yenilemeDene(ozet);
    if (sonuc) return sonuc;
  }
  return { hata: "GECERSIZ" };
}

async function yenilemeDene(ozet: string): Promise<YenilemeSonucu | null> {
  const kayit = await prisma.mobilOturum.findFirst({
    where: { OR: [{ yenilemeOzeti: ozet }, { oncekiOzet: ozet }] },
    include: { user: { select: SAHIP_SECIMI }, member: { select: UYE_SECIMI } },
  });
  if (!kayit) return { hata: "GECERSIZ" };

  const simdi = new Date();
  const hata = yenilemeKarari(kayit, ozet, kayit.user.sessionVersion, simdi);
  if (hata) {
    // Jetonlar Cascade ile gider: çıkmış telefon bildirim almaz
    await prisma.mobilOturum.deleteMany({ where: { id: kayit.id } });
    return { hata };
  }

  const eskiJeton = kayit.yenilemeOzeti !== ozet;
  const yeniJeton = yenilemeJetonuUret();
  const yenilemeBitis = new Date(simdi.getTime() + YENILEME_SURESI_MS);
  const yazilan = await prisma.mobilOturum.updateMany({
    where: { id: kayit.id, yenilemeOzeti: kayit.yenilemeOzeti },
    data: {
      yenilemeOzeti: jetonOzeti(yeniJeton),
      // Her dönüşte o anki güncel jeton "önceki" olur. Yanıtı kaybolan istemci eski jetonla
      // tekrar gelirse süre uzamaz: iki kopyadan pencere dışında kalanı gelince çalınma
      // sayılır ve oturum düşer; saldırganın kopyası sessizce yaşamaz.
      oncekiOzet: kayit.yenilemeOzeti,
      ...(eskiJeton ? {} : { oncekiGecerlilik: new Date(simdi.getTime() + ONCEKI_JETON_SURESI_MS) }),
      sonKullanma: yenilemeBitis,
      sonGorulme: simdi,
    },
  });
  if (yazilan.count === 0) return null;
  return { tamam: await oturumYaniti(kayit.user, kayit.member, kayit.id, kayit.cihazId, yeniJeton, yenilemeBitis) };
}

// Çıkış: jeton geçersizse de sonuç aynı (idempotent); cihaz jetonu verilirse o da silinir
export async function oturumKapat(yenilemeJetonu: unknown, cihazJetonu: unknown) {
  if (typeof yenilemeJetonu !== "string" || !yenilemeJetonu || yenilemeJetonu.length > JETON_SINIRI) return;
  const ozet = jetonOzeti(yenilemeJetonu);
  const kayit = await prisma.mobilOturum.findFirst({
    where: { OR: [{ yenilemeOzeti: ozet }, { oncekiOzet: ozet }] },
    select: { id: true, userId: true },
  });
  if (!kayit) return;
  await prisma.mobilOturum.deleteMany({ where: { id: kayit.id } });
  if (typeof cihazJetonu === "string" && cihazJetonu) {
    await prisma.cihazJetonu.deleteMany({ where: { jeton: cihazJetonu, userId: kayit.userId } });
  }
}
