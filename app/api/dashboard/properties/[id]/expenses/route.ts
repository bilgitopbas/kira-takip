import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
  }

  const { id } = await params;

  const property = await prisma.property.findUnique({ where: { id } });
  if (!property || property.ownerId !== session.userId) {
    return NextResponse.json({ error: "Mülk bulunamadı." }, { status: 404 });
  }

  const expenses = await prisma.expense.findMany({
    where: { propertyId: id },
    include: { tenant: { select: { fullName: true } } },
    orderBy: { date: "desc" },
  });

  return NextResponse.json({ expenses });
}
