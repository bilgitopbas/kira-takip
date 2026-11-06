import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { duyuruGonder } from "@/lib/adminIslemleri";

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

    const sonuc = await duyuruGonder({
      title: title.trim(),
      subtitle: subtitle?.trim() || null,
      message: message.trim(),
      targetId: targetId || null,
      senderId: session.userId,
    });
    if ("hata" in sonuc) {
      return NextResponse.json({ error: "Seçilen kullanıcı bulunamadı." }, { status: 404 });
    }
    const { announcement, pushRecipients } = sonuc;

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
