import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 403 });
  }

  const customers = await prisma.user.findMany({
    where: { role: "CUSTOMER" },
    select: {
      id: true,
      fullName: true,
      email: true,
      city: true,
      phone: true,
      wantsManagement: true,
      subscriptionStatus: true,
      trialEndsAt: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const subscriptions = await prisma.subscription.findMany({
    where: { userId: { in: customers.map((c) => c.id) } },
  });
  const subByUser = new Map(subscriptions.map((s) => [s.userId, s]));

  const withPlan = customers.map((c) => ({
    ...c,
    propertyLimit: subByUser.get(c.id)?.propertyCount || null,
  }));

  return NextResponse.json({ customers: withPlan });
}