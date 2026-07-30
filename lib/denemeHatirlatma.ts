import { prisma } from "@/lib/prisma";
import { calculatePlanPrice } from "@/lib/fiyat";
import {
  sendTrialEndingEmail,
  sendTrialGraceEmail,
  sendTrialLockedEmail,
} from "@/lib/mail";
import { sendPushNotification } from "@/lib/onesignal";

const GRACE_DAYS = 7;
const UYARI_GUNU = 7; // deneme bitimine kaç gün kala ilk uyarı

type Asama = "UYARI" | "EK_SURE" | "KILIT";

const ASAMA_BILGI: Record<Asama, { dedupe: string; baslik: string }> = {
  UYARI: { dedupe: "trial-uyari", baslik: "Deneme süreniz bitiyor" },
  EK_SURE: { dedupe: "trial-ek-sure", baslik: "SON FIRSAT — hesabınız kilitleniyor" },
  KILIT: { dedupe: "trial-kilit", baslik: "Hesabınız görüntüleme moduna geçti" },
};

/**
 * İki tarih arasındaki TAKVİM günü farkı. Saatler sıfırlanır; aksi hâlde
 * cron'un günün hangi saatinde çalıştığına göre "7 gün kaldı" bir gün kayıyor.
 */
function gunFarki(hedef: Date, simdi: Date) {
  const a = new Date(hedef);
  a.setHours(0, 0, 0, 0);
  const b = new Date(simdi);
  b.setHours(0, 0, 0, 0);
  return Math.round((a.getTime() - b.getTime()) / 86400000);
}

/**
 * Bir kullanıcının hangi aşamada olduğunu ve kalan gün sayısını döner.
 * Saf fonksiyon — sınır durumları test edilebilsin diye ayrı tutuldu.
 */
export function asamaBelirle(
  trialEndsAt: Date,
  simdi: Date
): { asama: Asama | null; kalanGun: number } {
  const denemeBitis = new Date(trialEndsAt);
  const ekSureBitis = new Date(denemeBitis);
  ekSureBitis.setDate(ekSureBitis.getDate() + GRACE_DAYS);

  const kalanGun = gunFarki(denemeBitis, simdi);

  if (simdi > ekSureBitis) return { asama: "KILIT", kalanGun: 0 };
  if (simdi > denemeBitis) return { asama: "EK_SURE", kalanGun: 0 };
  if (kalanGun <= UYARI_GUNU) return { asama: "UYARI", kalanGun: Math.max(1, kalanGun) };
  return { asama: null, kalanGun };
}

/**
 * Deneme süresi biten/bitmek üzere olan müşterilere e-posta gönderir.
 * Sunucudaki zamanlanmış görev (cron) tarafından günde bir çağrılır —
 * müşterinin panele girmesini beklemez, asıl mesele o.
 *
 * Tekrar göndermeyi Notification tablosundaki [userId, dedupeKey] benzersizlik
 * kısıtı engeller: kayıt oluşturulabildiyse ilk kezdir, e-posta gönderilir.
 */
export async function denemeHatirlatmalariniGonder() {
  const simdi = new Date();

  // Yalnızca deneme durumundaki gerçek müşteriler
  const kullanicilar = await prisma.user.findMany({
    where: { role: "CUSTOMER", subscriptionStatus: "TRIAL" },
    select: { id: true, email: true, fullName: true, trialEndsAt: true },
  });

  const sonuc = { incelenen: kullanicilar.length, gonderilen: 0, hata: 0 };

  for (const k of kullanicilar) {
    const { asama, kalanGun } = asamaBelirle(k.trialEndsAt, simdi);
    if (!asama) continue;

    try {
      const gonderildi = await asamayiIsle(k, asama, kalanGun);
      if (gonderildi) sonuc.gonderilen++;
    } catch (hata) {
      sonuc.hata++;
      console.error(`Deneme hatirlatmasi basarisiz (${k.email}):`, hata);
    }
  }

  return sonuc;
}

async function asamayiIsle(
  kullanici: { id: string; email: string; fullName: string },
  asama: Asama,
  kalanGun: number
) {
  const { dedupe, baslik } = ASAMA_BILGI[asama];

  // Bu aşama için daha önce gönderildiyse Notification kaydı zaten vardır
  const mevcut = await prisma.notification.findFirst({
    where: { userId: kullanici.id, dedupeKey: dedupe },
    select: { id: true },
  });
  if (mevcut) return false;

  const [mulk, kiraci, tahsilat] = await Promise.all([
    prisma.property.count({ where: { ownerId: kullanici.id } }),
    prisma.tenant.count({ where: { property: { ownerId: kullanici.id } } }),
    prisma.payment.count({ where: { tenant: { property: { ownerId: kullanici.id } } } }),
  ]);

  const veri = {
    mulk,
    kiraci,
    tahsilat,
    aylikTutar: calculatePlanPrice(Math.max(mulk, 1)),
  };

  // Önce kaydı oluştur: yarış durumunda benzersizlik kısıtı ikinci gönderimi
  // engeller (aynı anda iki cron çalışsa bile mükerrer e-posta gitmez).
  try {
    await prisma.notification.create({
      data: {
        userId: kullanici.id,
        type: "TRIAL_REMINDER",
        title: baslik,
        message:
          asama === "UYARI"
            ? `Deneme sürenizin bitmesine ${kalanGun} gün kaldı. Mizan Pro'ya geçerek kaldığınız yerden devam edin.`
            : asama === "EK_SURE"
              ? "Deneme süreniz doldu. 7 günlük ek süreniz başladı, sonrasında panel görüntüleme moduna geçecek."
              : "Deneme ve ek süreniz sona erdi. Verileriniz duruyor; abonelik başlatarak devam edebilirsiniz.",
        link: "/dashboard/mizan-pro",
        dedupeKey: dedupe,
      },
    });
  } catch {
    // Benzersizlik çakışması — başka bir çalıştırma bu aşamayı zaten işledi
    return false;
  }

  if (asama === "UYARI") {
    await sendTrialEndingEmail(kullanici.email, kullanici.fullName, kalanGun, veri);
  } else if (asama === "EK_SURE") {
    await sendTrialGraceEmail(kullanici.email, kullanici.fullName, veri);
  } else {
    await sendTrialLockedEmail(kullanici.email, kullanici.fullName, veri);
  }

  // Mobil uygulamaya push (başarısız olursa akış kesilmez)
  try {
    await sendPushNotification(kullanici.id, baslik, "Detaylar için panele girin.", "/dashboard/mizan-pro");
  } catch {
    // yoksay
  }

  return true;
}
