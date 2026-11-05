import { prisma } from "@/lib/prisma";
import { sendPushNotification } from "@/lib/onesignal";
import { sahibePush } from "@/lib/push";

async function createForAllAdmins(data: {
  type: "NEW_CUSTOMER" | "IYZICO_PAYMENT";
  title: string;
  message: string;
  link?: string;
  dedupeKey: string;
}) {
  const admins = await prisma.user.findMany({ where: { role: "ADMIN" }, select: { id: true } });
  await Promise.all(
    admins.map((admin) =>
      prisma.notification
        .create({
          data: {
            userId: admin.id,
            type: data.type,
            title: data.title,
            message: data.message,
            link: data.link,
            dedupeKey: data.dedupeKey,
          },
        })
        .then(() => sendPushNotification(admin.id, data.title, data.message, data.link))
        .then(() => sahibePush(admin.id, { baslik: data.title, govde: data.message, tur: data.type, yol: data.link }))
        .catch(() => {
          // unique constraint on [userId, dedupeKey] -> already exists, ignore
        })
    )
  );
}

export async function notifyAdminsNewCustomer(customer: { id: string; fullName: string; email: string }) {
  await createForAllAdmins({
    type: "NEW_CUSTOMER",
    title: "Yeni müşteri kaydı",
    message: `${customer.fullName} (${customer.email}) sisteme yeni kayıt oldu.`,
    link: "/admin/kullanicilar",
    dedupeKey: `new_customer:${customer.id}`,
  });
}

export async function notifyAdminsIyzicoPayment(payment: { id: string; customerName: string; amount: number }) {
  await createForAllAdmins({
    type: "IYZICO_PAYMENT",
    title: "Yeni ödeme alındı",
    message: `${payment.customerName} adlı müşteriden ${payment.amount.toLocaleString("tr-TR")} ₺ ödeme alındı.`,
    link: "/admin/gelirler",
    dedupeKey: `iyzico_payment:${payment.id}`,
  });
}

// Ana sayfadaki "Sizi Arayalım" formu. Ayrı bir tür şema değişikliği isteyeceği
// için potansiyel müşteri olarak NEW_CUSTOMER türü kullanılır. Telefon numarası
// bildirime (push sağlayıcılarına) konmaz; yönetici panelinde görünür.
export async function notifyAdminsContactRequest(talep: { id: string; name: string }) {
  await createForAllAdmins({
    type: "NEW_CUSTOMER",
    title: "Yeni arama talebi",
    message: `${talep.name} ana sayfadan geri arama talebi bıraktı.`,
    link: "/admin/destek",
    dedupeKey: `contact_request:${talep.id}`,
  });
}
