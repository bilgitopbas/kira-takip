import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
  }

  const properties = await prisma.property.findMany({
    where: { ownerId: session.userId },
    include: { _count: { select: { tenants: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ properties });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
  }

  const { title, address, city, isOccupied } = await req.json();

  if (!title?.trim() || !address?.trim()) {
    return NextResponse.json({ error: "Başlık ve adres zorunludur." }, { status: 400 });
  }

  try {
    const property = await prisma.property.create({
      data: {
        ownerId: session.userId,
        title: title.trim(),
        address: address.trim(),
        city: city?.trim() || null,
        isOccupied: !!isOccupied,
      },
    });
    return NextResponse.json({ success: true, property });
  } catch {
    return NextResponse.json({ error: "Mülk oluşturulamadı." }, { status: 500 });
  }
}
