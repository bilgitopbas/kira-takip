import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";
import { resolveAppUrl } from "@/lib/url";
import { sendWelcomeEmail } from "@/lib/mail";
import { notifyAdminsNewCustomer } from "@/lib/adminNotifications";

export async function GET(req: NextRequest) {
  const appUrl = resolveAppUrl(req);
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const savedState = req.cookies.get("google_oauth_state")?.value;

  if (!code || !state || !savedState || state !== savedState) {
    return NextResponse.redirect(`${appUrl}/login?error=google_state`);
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${appUrl}/login?error=google_not_configured`);
  }

  try {
    const redirectUri = `${appUrl}/api/auth/google/callback`;

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });
    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) {
      return NextResponse.redirect(`${appUrl}/login?error=google_token`);
    }

    const profileRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const profile = await profileRes.json();

    if (!profile.email || !profile.email_verified) {
      return NextResponse.redirect(`${appUrl}/login?error=google_email`);
    }

    let user = await prisma.user.findUnique({ where: { googleId: profile.sub } });
    let isNewUser = false;

    if (!user) {
      const existingByEmail = await prisma.user.findUnique({ where: { email: profile.email } });
      if (existingByEmail) {
        user = await prisma.user.update({
          where: { id: existingByEmail.id },
          data: {
            googleId: profile.sub,
            // Google e-postayı zaten doğruladığı için hesap henüz onaysızsa şimdi onaylanmış sayılır
            emailVerifiedAt: existingByEmail.emailVerifiedAt ?? new Date(),
          },
        });
      } else {
        const trialEndsAt = new Date();
        trialEndsAt.setDate(trialEndsAt.getDate() + 45);
        user = await prisma.user.create({
          data: {
            email: profile.email,
            googleId: profile.sub,
            fullName: profile.name || profile.email,
            trialEndsAt,
            role: "CUSTOMER",
            subscriptionStatus: "TRIAL",
            emailVerifiedAt: new Date(),
          },
        });
        isNewUser = true;
      }
    }

    await createSession({ userId: user.id, role: user.role });

    if (isNewUser) {
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
    }

    const destination =
      user.role === "ADMIN" ? "/admin" : !user.city ? "/dashboard/profili-tamamla" : "/dashboard";
    const res = NextResponse.redirect(`${appUrl}${destination}`);
    res.cookies.delete("google_oauth_state");
    return res;
  } catch (err) {
    console.error("Google OAuth hatası:", err);
    return NextResponse.redirect(`${appUrl}/login?error=google_unknown`);
  }
}
