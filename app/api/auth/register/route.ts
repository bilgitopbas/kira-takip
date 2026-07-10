import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, createSession } from "@/lib/auth";
import { sendWelcomeEmail } from "@/lib/mail";
import { notifyAdminsNewCustomer } from "@/lib/adminNotifications";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    if (!checkRateLimit(`register:${ip}`, 5, 60 * 60 * 1000)) {
      return NextResponse.json(
        { error: "Çok fazla kayıt denemesi yaptınız. Lütfen daha sonra tekrar deneyin." },
        { status: 429 }
      );
    }

    const {
      email,
      password,
      fullName,
      phone,
      city,
      wantsManagement,
      accountType,
      accountTypeOther,
      propertyCountRange,
      termsAccepted,
      marketingConsent,
    } = await req.json();

    if (!email || !password || !fullName || !city || !propertyCountRange) {
      return NextResponse.json(
        { error: "Zorunlu alanları doldurmanız gerekiyor." },
        { status: 400 }
      );
    }

    if (!termsAccepted) {
      return NextResponse.json(
        { error: "Devam etmek için Kullanıcı Sözleşmesi'ni kabul etmeniz gerekiyor." },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "Bu e-posta adresi zaten kayıtlı." },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 45);
    const now = new Date();

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        fullName,
        phone,
        city,
        wantsManagement: Boolean(wantsManagement),
        accountType: accountType || null,
        accountTypeOther: accountType === "OTHER" ? accountTypeOther : null,
        propertyCountRange,
        termsAcceptedAt: now,
        marketingConsentAt: marketingConsent ? now : null,
        trialEndsAt,
        role: "CUSTOMER",
        subscriptionStatus: "TRIAL",
      },
    });

    await createSession({ userId: user.id, role: user.role });

    try {
      await sendWelcomeEmail(user.email, user.fullName);
    } catch (mailErr) {
      console.error("Hoş geldin e-postası gönderilemedi:", mailErr);
    }

    try {
      await notifyAdminsNewCustomer(user);
    } catch (notifyErr) {
      console.error("Admin bildirimi oluşturulamadı:", notifyErr);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Kayıt sırasında bir hata oluştu." },
      { status: 500 }
    );
  }
}