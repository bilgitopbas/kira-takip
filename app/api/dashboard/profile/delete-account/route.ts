import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, destroySession } from "@/lib/auth";

export async function DELETE() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
  }

  const properties = await prisma.property.findMany({
    where: { ownerId: session.userId },
    select: { id: true },
  });
  const propertyIds = properties.map((p) => p.id);

  const tenants = await prisma.tenant.findMany({
    where: { propertyId: { in: propertyIds } },
    select: { id: true },
  });
  const tenantIds = tenants.map((t) => t.id);

  await prisma.payment.deleteMany({ where: { tenantId: { in: tenantIds } } });
  await prisma.debt.deleteMany({ where: { tenantId: { in: tenantIds } } });
  await prisma.tenant.deleteMany({ where: { propertyId: { in: propertyIds } } });
  await prisma.property.deleteMany({ where: { ownerId: session.userId } });
  await prisma.notification.deleteMany({ where: { userId: session.userId } });
  await prisma.supportTicket.deleteMany({ where: { userId: session.userId } });
  await prisma.subscription.deleteMany({ where: { userId: session.userId } });
  await prisma.accountMember.deleteMany({ where: { ownerId: session.userId } });
  await prisma.user.delete({ where: { id: session.userId } });

  await destroySession();

  return NextResponse.json({ success: true });
}
