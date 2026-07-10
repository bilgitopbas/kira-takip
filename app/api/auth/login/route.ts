import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, createSession } from "@/lib/auth";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    if (!checkRateLimit(`login:${ip}`, 10, 10 * 60 * 1000)) {
      return NextResponse.json(
        { error: "Çok fazla deneme yaptınız. Lütfen birkaç dakika sonra tekrar deneyin." },
        { status: 429 }
      );
    }

    const { email, password } = await req.json();

    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      if (!user.passwordHash) {
        return NextResponse.json(
          { error: "Bu hesap Google ile oluşturulmuş. Lütfen \"Google ile Giriş Yap\" ile devam edin." },
          { status: 401 }
        );
      }
      const valid = await verifyPassword(password, user.passwordHash);
      if (!valid) {
        return NextResponse.json({ error: "E-posta veya şifre hatalı." }, { status: 401 });
      }
      await createSession({ userId: user.id, role: user.role });
      return NextResponse.json({ success: true, role: user.role });
    }

    const member = await prisma.accountMember.findUnique({ where: { email } });
    if (member && member.passwordHash) {
      const valid = await verifyPassword(password, member.passwordHash);
      if (!valid) {
        return NextResponse.json({ error: "E-posta veya şifre hatalı." }, { status: 401 });
      }
      await createSession({ userId: member.ownerId, role: "CUSTOMER" });
      return NextResponse.json({ success: true, role: "CUSTOMER" });
    }
    if (member && !member.passwordHash) {
      return NextResponse.json(
        { error: "Daveti henüz kabul etmediniz. Lütfen e-postanızdaki bağlantıyla şifrenizi belirleyin." },
        { status: 401 }
      );
    }

    return NextResponse.json({ error: "E-posta veya şifre hatalı." }, { status: 401 });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Giriş sırasında bir hata oluştu." },
      { status: 500 }
    );
  }
}