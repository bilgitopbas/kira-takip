import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
  }

  const prefs = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      notifyPaymentOverdue: true,
      notifyRenewalUpcoming: true,
      notifyFiveYear: true,
      notifyMonthlySummary: true,
    },
  });

  return NextResponse.json({ preferences: prefs });
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
  }

  const body = await req.json();
  const data: Record<string, boolean> = {};
  for (const key of [
    "notifyPaymentOverdue",
    "notifyRenewalUpcoming",
    "notifyFiveYear",
    "notifyMonthlySummary",
  ]) {
    if (typeof body[key] === "boolean") {
      data[key] = body[key];
    }
  }

  const prefs = await prisma.user.update({
    where: { id: session.userId },
    data,
    select: {
      notifyPaymentOverdue: true,
      notifyRenewalUpcoming: true,
      notifyFiveYear: true,
      notifyMonthlySummary: true,
    },
  });

  return NextResponse.json({ success: true, preferences: prefs });
}
