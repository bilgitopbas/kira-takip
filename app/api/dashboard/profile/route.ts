import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { fullName: true, email: true, phone: true },
  });

  if (!user) {
    return NextResponse.json({ error: "Kullanıcı bulunamadı." }, { status: 404 });
  }

  return NextResponse.json({ user });
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
  }

  const { fullName, email, phone } = await req.json();

  if (!fullName?.trim() || !email?.trim()) {
    return NextResponse.json({ error: "Ad soyad ve e-posta zorunludur." }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email: email.trim() } });
  if (existing && existing.id !== session.userId) {
    return NextResponse.json({ error: "Bu e-posta adresi başka bir hesapta kayıtlı." }, { status: 409 });
  }

  try {
    const user = await prisma.user.update({
      where: { id: session.userId },
      data: {
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone?.trim() || null,
      },
      select: { fullName: true, email: true, phone: true },
    });
    return NextResponse.json({ success: true, user });
  } catch {
    return NextResponse.json({ error: "Profil güncellenemedi." }, { status: 500 });
  }
}
