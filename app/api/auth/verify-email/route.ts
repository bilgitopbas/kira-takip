import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveAppUrl } from "@/lib/url";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  const baseUrl = resolveAppUrl(req);

  if (!token) {
    return NextResponse.redirect(`${baseUrl}/eposta-onay?status=missing`);
  }

  const user = await prisma.user.findUnique({
    where: { emailVerificationToken: token },
    select: { id: true, emailVerificationExpires: true },
  });

  if (!user || !user.emailVerificationExpires || user.emailVerificationExpires < new Date()) {
    return NextResponse.redirect(`${baseUrl}/eposta-onay?status=invalid`);
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerifiedAt: new Date(),
      emailVerificationToken: null,
      emailVerificationExpires: null,
    },
  });

  return NextResponse.redirect(`${baseUrl}/eposta-onay?status=success`);
}
