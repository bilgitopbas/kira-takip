import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { requireWriteAccess, checkPropertyLimit } from "@/lib/access";

const PAGE_SIZE = 10;

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const q = searchParams.get("q")?.trim() || "";
  const type = searchParams.get("type")?.trim() || "";
  const city = searchParams.get("city")?.trim() || "";
  const occupied = searchParams.get("occupied")?.trim() || "";

  // Form seçicileri (kiracı ekle/düzenle) için hafif, sayfalanmamış tam liste
  if (searchParams.get("all") === "1") {
    const properties = await prisma.property.findMany({
      where: { ownerId: session.userId },
      select: { id: true, title: true },
      orderBy: { title: "asc" },
    });
    return NextResponse.json({ properties });
  }

  const where = {
    ownerId: session.userId,
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" as const } },
            { address: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
    ...(type ? { propertyType: type as never } : {}),
    ...(city ? { city } : {}),
    ...(occupied === "true" ? { isOccupied: true } : occupied === "false" ? { isOccupied: false } : {}),
  };

  const [properties, total] = await Promise.all([
    prisma.property.findMany({
      where,
      select: {
        id: true,
        title: true,
        address: true,
        city: true,
        isOccupied: true,
        propertyType: true,
        _count: { select: { tenants: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.property.count({ where }),
  ]);

  return NextResponse.json({ properties, total, hasMore: page * PAGE_SIZE < total });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
  }

  const access = await requireWriteAccess(session.userId);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: 403 });
  }
  const limit = await checkPropertyLimit(session.userId);
  if (!limit.ok) {
    return NextResponse.json({ error: limit.error }, { status: 403 });
  }

  const { title, address, city, district, squareMeters, propertyType, notes, isOccupied } =
    await req.json();

  if (!title?.trim()) {
    return NextResponse.json({ error: "Mülk adı zorunludur." }, { status: 400 });
  }

  const VALID_TYPES = ["ARSA", "AVM", "DEPO", "DEVREMULK", "FABRIKA", "KONUT", "OFIS"];
  if (propertyType && !VALID_TYPES.includes(propertyType)) {
    return NextResponse.json({ error: "Geçersiz mülk tipi." }, { status: 400 });
  }

  try {
    const property = await prisma.property.create({
      data: {
        ownerId: session.userId,
        title: title.trim(),
        address: address?.trim() || "",
        city: city?.trim() || null,
        district: district?.trim() || null,
        squareMeters: squareMeters ? Number(squareMeters) : null,
        propertyType: propertyType || null,
        notes: notes?.trim() || null,
        isOccupied: !!isOccupied,
      },
    });
    return NextResponse.json({ success: true, property });
  } catch {
    return NextResponse.json({ error: "Mülk oluşturulamadı." }, { status: 500 });
  }
}
