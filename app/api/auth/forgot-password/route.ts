import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/mail";
import { resolveAppUrl } from "@/lib/url";

const GENERIC_SUCCESS = {
  success: true,
  message: "Eğer bu e-posta kayıtlıysa, sıfırlama bağlantısı gönderildi.",
};

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: "E-posta zorunludur." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json(GENERIC_SUCCESS);
    }

    const token = randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordResetToken: token, passwordResetExpires: expires },
    });

    const resetLink = `${resolveAppUrl(req)}/reset-password?token=${token}`;

    try {
      await sendPasswordResetEmail(user.email, user.fullName, resetLink);
    } catch (mailErr) {
      console.error("Şifre sıfırlama e-postası gönderilemedi:", mailErr);
    }

    return NextResponse.json(GENERIC_SUCCESS);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Bir hata oluştu." }, { status: 500 });
  }
}
