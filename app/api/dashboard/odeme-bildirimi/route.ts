import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  periyotGecerliMi,
  referansKoduUret,
  tutarHesapla,
} from "@/lib/odemeBildirimi";

/** Müşterinin bekleyen ödeme bildirimi varsa döner */
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Oturum bulunamadı." }, { status: 401 });
  }

  const bekleyen = await prisma.paymentNotice.findFirst({
    where: { userId: session.userId, status: "PENDING" },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      referenceCode: true,
      propertyCount: true,
      months: true,
      amount: true,
      createdAt: true,
    },
  });

  return NextResponse.json({
    bekleyen: bekleyen ? { ...bekleyen, amount: Number(bekleyen.amount) } : null,
  });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Oturum bulunamadı." }, { status: 401 });
  }

  let govde: { propertyCount?: unknown; months?: unknown; note?: unknown };
  try {
    govde = await req.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const mulkSayisi = Math.trunc(Number(govde.propertyCount));
  const ay = Math.trunc(Number(govde.months));

  if (!Number.isFinite(mulkSayisi) || mulkSayisi < 1 || mulkSayisi > 1000) {
    return NextResponse.json({ error: "Geçerli bir mülk sayısı girin." }, { status: 400 });
  }
  if (!periyotGecerliMi(ay)) {
    return NextResponse.json({ error: "Geçersiz ödeme dönemi." }, { status: 400 });
  }

  // Aynı anda birden fazla bekleyen bildirim olmasın
  const mevcut = await prisma.paymentNotice.findFirst({
    where: { userId: session.userId, status: "PENDING" },
  });
  if (mevcut) {
    return NextResponse.json(
      { error: "Zaten inceleme bekleyen bir ödeme bildiriminiz var." },
      { status: 409 }
    );
  }

  // Referans kodu benzersiz olmalı; çakışırsa birkaç kez dener
  let bildirim = null;
  for (let deneme = 0; deneme < 5 && !bildirim; deneme++) {
    try {
      bildirim = await prisma.paymentNotice.create({
        data: {
          userId: session.userId,
          referenceCode: referansKoduUret(),
          propertyCount: mulkSayisi,
          months: ay,
          amount: tutarHesapla(mulkSayisi, ay),
          note: typeof govde.note === "string" ? govde.note.slice(0, 500) : null,
        },
      });
    } catch {
      // benzersizlik çakışması — yeniden dene
    }
  }

  if (!bildirim) {
    return NextResponse.json(
      { error: "Bildirim oluşturulamadı, lütfen tekrar deneyin." },
      { status: 500 }
    );
  }

  // Admin'e uygulama içi bildirim
  try {
    const kullanici = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { fullName: true },
    });
    const adminler = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: { id: true },
    });
    await prisma.notification.createMany({
      data: adminler.map((a) => ({
        userId: a.id,
        type: "EFT_PAYMENT_NOTICE" as const,
        title: "Yeni ödeme bildirimi",
        message: `${kullanici?.fullName ?? "Bir müşteri"} ${bildirim.referenceCode} kodu ile ${Number(
          bildirim.amount
        ).toLocaleString("tr-TR")} TL ödeme bildirdi.`,
        link: "/admin/odeme-bildirimleri",
        dedupeKey: `eft:${bildirim.id}`,
      })),
      skipDuplicates: true,
    });
  } catch (hata) {
    // Bildirim gidemezse akış kesilmesin
    console.error("Admin bildirimi olusturulamadi:", hata);
  }

  return NextResponse.json({
    referenceCode: bildirim.referenceCode,
    amount: Number(bildirim.amount),
  });
}
