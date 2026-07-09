import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "Geçersiz davet bağlantısı." }, { status: 400 });
  }

  const member = await prisma.accountMember.findUnique({ where: { inviteToken: token } });
  if (!member || !member.inviteTokenExpires || member.inviteTokenExpires < new Date()) {
    return NextResponse.json({ error: "Davet bağlantısının süresi dolmuş veya geçersiz." }, { status: 400 });
  }
  if (member.acceptedAt) {
    return NextResponse.json({ error: "Bu davet zaten kabul edilmiş." }, { status: 400 });
  }

  const owner = await prisma.user.findUnique({ where: { id: member.ownerId }, select: { fullName: true } });

  return NextResponse.json({
    email: member.email,
    fullName: member.fullName,
    ownerName: owner?.fullName || "",
  });
}

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json({ error: "Token ve şifre zorunludur." }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "Şifre en az 6 karakter olmalıdır." }, { status: 400 });
    }

    const member = await prisma.accountMember.findUnique({ where: { inviteToken: token } });
    if (!member || !member.inviteTokenExpires || member.inviteTokenExpires < new Date()) {
      return NextResponse.json({ error: "Davet bağlantısının süresi dolmuş veya geçersiz." }, { status: 400 });
    }

    const passwordHash = await hashPassword(password);

    await prisma.accountMember.update({
      where: { id: member.id },
      data: { passwordHash, acceptedAt: new Date(), inviteToken: null, inviteTokenExpires: null },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Bir hata oluştu." }, { status: 500 });
  }
}
