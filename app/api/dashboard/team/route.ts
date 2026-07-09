import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { sendInviteEmail } from "@/lib/mail";
import { resolveAppUrl } from "@/lib/url";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
  }

  const members = await prisma.accountMember.findMany({
    where: { ownerId: session.userId },
    select: { id: true, email: true, fullName: true, acceptedAt: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ members });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
  }

  const { email, fullName } = await req.json();
  if (!email?.trim() || !fullName?.trim()) {
    return NextResponse.json({ error: "Ad soyad ve e-posta zorunludur." }, { status: 400 });
  }
  const trimmedEmail = email.trim().toLowerCase();

  const existingUser = await prisma.user.findUnique({ where: { email: trimmedEmail } });
  if (existingUser) {
    return NextResponse.json({ error: "Bu e-posta adresi zaten kayıtlı bir hesaba ait." }, { status: 409 });
  }
  const existingMember = await prisma.accountMember.findUnique({ where: { email: trimmedEmail } });
  if (existingMember) {
    return NextResponse.json({ error: "Bu e-posta adresi zaten bir hesaba davetli." }, { status: 409 });
  }

  const owner = await prisma.user.findUnique({ where: { id: session.userId }, select: { fullName: true } });

  const inviteToken = randomBytes(32).toString("hex");
  const inviteTokenExpires = new Date(Date.now() + 48 * 60 * 60 * 1000);

  const member = await prisma.accountMember.create({
    data: {
      ownerId: session.userId,
      email: trimmedEmail,
      fullName: fullName.trim(),
      inviteToken,
      inviteTokenExpires,
    },
  });

  const inviteLink = `${resolveAppUrl(req)}/hesap-davet?token=${inviteToken}`;

  try {
    await sendInviteEmail(trimmedEmail, owner?.fullName || "Bir kullanıcı", inviteLink);
  } catch (mailErr) {
    console.error("Davet e-postası gönderilemedi:", mailErr);
  }

  return NextResponse.json({ success: true, member });
}
