import { unlink } from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/prisma";
import { getUploadedFilePath } from "@/lib/uploads";

// Mobil "Hesabı sil" (Apple 5.1.1(v), Google Play): hesabın tüm verisi tek işlemde
// silinir. Sıra FK kısıtlarına göre; oturum, push jetonu, üye, bina ve şehir düzeni
// Cascade ile gider. Yüklenen dosyalar işlem bittikten sonra diskten kaldırılır.
const ISLEM_SURESI_MS = 60_000;

export async function sahipHesabiniSil(ownerId: string) {
  const dosyalar = await prisma.$transaction(
    async (tx) => {
      const mulkler = await tx.property.findMany({ where: { ownerId }, select: { id: true } });
      const propertyId = { in: mulkler.map((m) => m.id) };
      const kiracilar = await tx.tenant.findMany({
        where: { propertyId },
        select: { id: true, contractFileUrl: true },
      });
      const tenantId = { in: kiracilar.map((t) => t.id) };
      const odemeler = await tx.payment.findMany({
        where: { tenantId, receiptFileUrl: { not: null } },
        select: { receiptFileUrl: true },
      });

      await tx.payment.deleteMany({ where: { tenantId } });
      await tx.debt.deleteMany({ where: { tenantId } });
      await tx.tenantNote.deleteMany({ where: { tenantId } });
      await tx.expense.deleteMany({ where: { OR: [{ propertyId }, { tenantId }] } });
      await tx.tenantProperty.deleteMany({ where: { OR: [{ propertyId }, { tenantId }] } });
      await tx.tenant.deleteMany({ where: { id: tenantId } });
      await tx.property.deleteMany({ where: { ownerId } });
      await tx.notification.deleteMany({ where: { userId: ownerId } });
      await tx.supportTicket.deleteMany({ where: { userId: ownerId } });
      await tx.paymentNotice.deleteMany({ where: { userId: ownerId } });
      await tx.subscription.deleteMany({ where: { userId: ownerId } });
      // targetName kişinin adını taşır; senderId FK'si silmeyi engellemesin
      await tx.announcement.deleteMany({ where: { OR: [{ targetId: ownerId }, { senderId: ownerId }] } });
      await tx.user.delete({ where: { id: ownerId } });

      return {
        contracts: kiracilar.flatMap((t) => (t.contractFileUrl ? [t.contractFileUrl] : [])),
        receipts: odemeler.flatMap((o) => (o.receiptFileUrl ? [o.receiptFileUrl] : [])),
      };
    },
    { timeout: ISLEM_SURESI_MS }
  );

  // Dosya silinemezse hesap yine silinmiş sayılır; günlüğe yazılır
  await Promise.all(
    (["contracts", "receipts"] as const).flatMap((klasor) =>
      dosyalar[klasor].map((ad) =>
        unlink(getUploadedFilePath(klasor, path.basename(ad))).catch((err: NodeJS.ErrnoException) => {
          if (err.code !== "ENOENT") console.error("Yüklenen dosya silinemedi:", klasor, err.code);
        })
      )
    )
  );
}
