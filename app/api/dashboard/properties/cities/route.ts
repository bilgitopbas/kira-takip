import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
  }

  const rows = await prisma.property.findMany({
    where: { ownerId: session.userId, city: { not: null } },
    select: { city: true },
    distinct: ["city"],
    orderBy: { city: "asc" },
  });

  const cities = rows.map((r) => r.city).filter((c): c is string => !!c);
  return NextResponse.json({ cities });
}
