import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { sendVerificationEmail } from "@/lib/mail";
import { resolveAppUrl } from "@/lib/url";
import { checkRateLimit } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
  }

  if (!checkRateLimit(`resend-verification:${session.userId}`, 3, 15 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Çok fazla deneme yaptınız. Lütfen birkaç dakika sonra tekrar deneyin." },
      { status: 429 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { email: true, fullName: true, emailVerifiedAt: true },
  });
  if (!user) {
    return NextResponse.json({ error: "Kullanıcı bulunamadı." }, { status: 404 });
  }
  if (user.emailVerifiedAt) {
    return NextResponse.json({ error: "E-posta adresiniz zaten onaylı." }, { status: 400 });
  }

  const emailVerificationToken = crypto.randomBytes(32).toString("hex");
  const emailVerificationExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await prisma.user.update({
    where: { id: session.userId },
    data: { emailVerificationToken, emailVerificationExpires },
  });

  try {
    const verifyLink = `${resolveAppUrl(req)}/api/auth/verify-email?token=${emailVerificationToken}`;
    await sendVerificationEmail(user.email, user.fullName, verifyLink);
  } catch {
    return NextResponse.json({ error: "E-posta gönderilemedi. Lütfen daha sonra tekrar deneyin." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
