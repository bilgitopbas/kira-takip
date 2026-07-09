import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { calculatePlanPrice } from "@/lib/access";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 403 });
  }

  const { id } = await params;
  const { propertyCount } = await req.json();
  const count = Number(propertyCount);

  if (!count || count < 1) {
    return NextResponse.json({ error: "Geçerli bir mülk sayısı girin." }, { status: 400 });
  }

  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  const subscription = await prisma.subscription.upsert({
    where: { userId: id },
    create: {
      userId: id,
      propertyCount: count,
      monthlyPrice: calculatePlanPrice(count),
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
    },
    update: {
      propertyCount: count,
      monthlyPrice: calculatePlanPrice(count),
    },
  });

  return NextResponse.json({ success: true, subscription });
}
