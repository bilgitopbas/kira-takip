import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendPushNotification, sendPushToAll } from "@/lib/onesignal";

// Duyuru (sadece admin): targetId yoksa HERKESE, varsa sadece o kullanıcıya
// uygulama içi bildirim + telefon push'u gönderilir.
export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  }

  try {
    const { title, subtitle, message, targetId } = await req.json();
    if (!title?.trim() || !message?.trim()) {
      return NextResponse.json({ error: "Başlık ve mesaj zorunludur." }, { status: 400 });
    }

    let target: { id: string; fullName: string } | null = null;
    if (targetId) {
      target = await prisma.user.findUnique({
        where: { id: targetId },
        select: { id: true, fullName: true },
      });
      if (!target) {
        return NextResponse.json({ error: "Seçilen kullanıcı bulunamadı." }, { status: 404 });
      }
    }

    const cleanSubtitle = subtitle?.trim() || null;

    const announcement = await prisma.announcement.create({
      data: {
        title: title.trim(),
        subtitle: cleanSubtitle,
        message: message.trim(),
        targetId: target?.id ?? null,
        targetName: target?.fullName ?? null,
        senderId: session.userId,
      },
    });

    const inAppMessage = cleanSubtitle
      ? `${cleanSubtitle} — ${announcement.message}`
      : announcement.message;

    let pushRecipients: number | null = null;

    if (target) {
      // Tek kullanıcı: uygulama içi bildirim + kişiye özel push
      await prisma.notification.create({
        data: {
          userId: target.id,
          type: "ANNOUNCEMENT",
          title: `📢 ${announcement.title}`,
          message: inAppMessage,
          dedupeKey: `announcement-${announcement.id}`,
        },
      });
      await sendPushNotification(target.id, announcement.title, announcement.message);
      pushRecipients = 1;
    } else {
      // Herkese: tüm kullanıcılara uygulama içi bildirim + genel push
      const users = await prisma.user.findMany({ select: { id: true } });
      if (users.length) {
        await prisma.notification.createMany({
          data: users.map((u) => ({
            userId: u.id,
            type: "ANNOUNCEMENT" as const,
            title: `📢 ${announcement.title}`,
            message: inAppMessage,
            dedupeKey: `announcement-${announcement.id}`,
          })),
          skipDuplicates: true,
        });
      }
      const push = await sendPushToAll(announcement.title, announcement.message, cleanSubtitle);
      pushRecipients = (push as { recipients?: number } | null)?.recipients ?? null;
    }

    return NextResponse.json(
      { message: "Duyuru gönderildi.", announcement, pushRecipients },
      { status: 201 }
    );
  } catch (err) {
    console.error("Duyuru gönderme hatası:", err);
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  }

  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "Duyuru belirtilmedi." }, { status: 400 });
    await prisma.announcement.delete({ where: { id } });
    return NextResponse.json({ message: "Duyuru silindi." });
  } catch (err) {
    console.error("Duyuru silme hatası:", err);
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 });
  }
}
