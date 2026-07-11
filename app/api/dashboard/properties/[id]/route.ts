import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

const VALID_TYPES = ["ARSA", "AVM", "DEPO", "DEVREMULK", "FABRIKA", "KONUT", "OFIS"];

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

  return NextResponse.json({ property });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
  }

  const { id } = await params;

  const existing = await prisma.property.findUnique({ where: { id } });
  if (!existing || existing.ownerId !== session.userId) {
    return NextResponse.json({ error: "Mülk bulunamadı." }, { status: 404 });
  }

  const { title, address, city, district, squareMeters, propertyType, notes, isOccupied } =
    await req.json();

  if (!title?.trim()) {
    return NextResponse.json({ error: "Mülk adı zorunludur." }, { status: 400 });
  }

  if (propertyType && !VALID_TYPES.includes(propertyType)) {
    return NextResponse.json({ error: "Geçersiz mülk tipi." }, { status: 400 });
  }

  try {
    const property = await prisma.property.update({
      where: { id },
      data: {
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
    return NextResponse.json({ error: "Mülk güncellenemedi." }, { status: 500 });
  }
}

export async function DELETE(
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

  try {
    await prisma.property.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Bu mülke bağlı kiracılar var. Önce kiracıları silin." },
      { status: 400 }
    );
  }
}
