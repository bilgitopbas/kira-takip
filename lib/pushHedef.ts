import { prisma } from "@/lib/prisma";

/**
 * Push bildirimlerinde her KİŞİ ayrı bir kimlikle kaydolur:
 *  - hesap sahibi  -> kullanıcı id'si
 *  - davetli üye   -> "member:<üyeId>"
 *
 * Önceden üyenin telefonu da hesap sahibinin kimliğiyle kaydoluyordu; iki
 * cihazın aynı kimliği paylaşması OneSignal tarafında güvenilir çalışmıyor
 * (bildirim çoğu zaman yalnızca tek cihaza düşüyor). Ayrı kimlik verip
 * gönderimde hepsini birden hedefleyerek bu belirsizlik ortadan kalkıyor.
 */
export function uyePushKimligi(memberId: string) {
  return `member:${memberId}`;
}

/**
 * Bir hesabın bildirimlerinin ulaşması gereken TÜM kimlikler:
 * hesap sahibi + daveti kabul etmiş üyeler.
 */
export async function hesapPushHedefleri(ownerId: string): Promise<string[]> {
  try {
    const uyeler = await prisma.accountMember.findMany({
      where: { ownerId, acceptedAt: { not: null } },
      select: { id: true },
    });
    return [ownerId, ...uyeler.map((u) => uyePushKimligi(u.id))];
  } catch (hata) {
    // Üye listesi alınamazsa en azından hesap sahibine gitsin
    console.error("Push hedefleri alinamadi:", hata);
    return [ownerId];
  }
}
