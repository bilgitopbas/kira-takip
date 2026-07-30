import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculatePlanPrice } from "@/lib/access";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 403 });
  }

  const { id } = await params;
  const { action, note } = await req.json();

  if (action !== "confirm" && action !== "reject") {
    return NextResponse.json({ error: "Geçersiz işlem." }, { status: 400 });
  }

  const bildirim = await prisma.paymentNotice.findUnique({ where: { id } });
  if (!bildirim) {
    return NextResponse.json({ error: "Bildirim bulunamadı." }, { status: 404 });
  }
  if (bildirim.status !== "PENDING") {
    return NextResponse.json({ error: "Bu bildirim zaten sonuçlandırılmış." }, { status: 409 });
  }

  const reviewNote = typeof note === "string" ? note.slice(0, 500) : null;

  if (action === "reject") {
    await prisma.paymentNotice.update({
      where: { id },
      data: { status: "REJECTED", reviewedAt: new Date(), reviewNote },
    });
    await bildirimGonder(
      bildirim.userId,
      "Ödeme bildiriminiz onaylanmadı",
      `${bildirim.referenceCode} kodlu ödeme bildiriminiz onaylanamadı.${
        reviewNote ? ` Not: ${reviewNote}` : " Lütfen bizimle iletişime geçin."
      }`,
      `reject:${bildirim.id}`
    );
    return NextResponse.json({ success: true });
  }

  // Onay: aboneliği aç / uzat
  const simdi = new Date();
  const mevcut = await prisma.subscription.findUnique({ where: { userId: bildirim.userId } });

  // Aboneliği hâlâ sürüyorsa üzerine ekle, bitmişse bugünden başlat
  const baslangic =
    mevcut?.currentPeriodEnd && mevcut.currentPeriodEnd > simdi ? mevcut.currentPeriodEnd : simdi;
  const bitis = new Date(baslangic);
  bitis.setMonth(bitis.getMonth() + bildirim.months);

  await prisma.$transaction([
    prisma.paymentNotice.update({
      where: { id },
      data: { status: "CONFIRMED", reviewedAt: simdi, reviewNote },
    }),
    prisma.subscription.upsert({
      where: { userId: bildirim.userId },
      create: {
        userId: bildirim.userId,
        propertyCount: bildirim.propertyCount,
        monthlyPrice: calculatePlanPrice(bildirim.propertyCount),
        currentPeriodStart: simdi,
        currentPeriodEnd: bitis,
      },
      update: {
        propertyCount: bildirim.propertyCount,
        monthlyPrice: calculatePlanPrice(bildirim.propertyCount),
        currentPeriodEnd: bitis,
      },
    }),
    prisma.user.update({
      where: { id: bildirim.userId },
      data: { subscriptionStatus: "ACTIVE" },
    }),
  ]);

  await bildirimGonder(
    bildirim.userId,
    "Ödemeniz onaylandı",
    `Mizan Pro aboneliğiniz ${bitis.toLocaleDateString("tr-TR")} tarihine kadar aktif edildi.`,
    `confirm:${bildirim.id}`
  );

  return NextResponse.json({ success: true, periodEnd: bitis });
}

async function bildirimGonder(
  userId: string,
  title: string,
  message: string,
  dedupeKey: string
) {
  try {
    await prisma.notification.create({
      data: { userId, type: "EFT_PAYMENT_NOTICE", title, message, link: "/dashboard/mizan-pro", dedupeKey },
    });
  } catch (hata) {
    console.error("Musteri bildirimi olusturulamadi:", hata);
  }
}
