import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { hashPassword, createSession } from "@/lib/auth";
import { sendWelcomeEmail, sendVerificationEmail } from "@/lib/mail";
import { notifyAdminsNewCustomer } from "@/lib/adminNotifications";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { verifyRecaptcha } from "@/lib/recaptcha";
import { isValidEmailFormat, domainAcceptsMail } from "@/lib/emailValidation";
import { resolveAppUrl } from "@/lib/url";

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
      recaptchaToken,
    } = await req.json();

    if (!email || !password || !fullName || !city || !propertyCountRange) {
      return NextResponse.json(
        { error: "Zorunlu alanları doldurmanız gerekiyor." },
        { status: 400 }
      );
    }

    if (!isValidEmailFormat(email)) {
      return NextResponse.json(
        { error: "Geçerli bir e-posta adresi girin." },
        { status: 400 }
      );
    }

    const emailDomainOk = await domainAcceptsMail(email);
    if (!emailDomainOk) {
      return NextResponse.json(
        { error: "Girdiğiniz e-posta adresi geçerli görünmüyor. Lütfen adresi kontrol edip tekrar deneyin." },
        { status: 400 }
      );
    }

    const recaptchaOk = await verifyRecaptcha(recaptchaToken || null);
    if (!recaptchaOk) {
      return NextResponse.json(
        { error: "Robot olmadığınızı doğrulayın." },
        { status: 400 }
      );
    }

    if (!termsAccepted) {
      return NextResponse.json(
        { error: "Devam etmek için Kullanıcı Sözleşmesi'ni ve Aydınlatma Metni'ni kabul etmeniz gerekiyor." },
        { status: 400 }
      );
    }

    if (!marketingConsent) {
      return NextResponse.json(
        { error: "Devam etmek için Açık Rıza Metni'ni kabul etmeniz gerekiyor." },
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

    const emailVerificationToken = crypto.randomBytes(32).toString("hex");
    const emailVerificationExpires = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

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
        emailVerificationToken,
        emailVerificationExpires,
      },
    });

    await createSession({ userId: user.id, role: user.role });

    try {
      await sendWelcomeEmail(user.email, user.fullName);
    } catch (mailErr) {
      console.error("Hoş geldin e-postası gönderilemedi:", mailErr);
    }

    try {
      const verifyLink = `${resolveAppUrl(req)}/api/auth/verify-email?token=${emailVerificationToken}`;
      await sendVerificationEmail(user.email, user.fullName, verifyLink);
    } catch (mailErr) {
      console.error("Onay e-postası gönderilemedi:", mailErr);
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