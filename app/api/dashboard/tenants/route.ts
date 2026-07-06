import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
  }

  const tenants = await prisma.tenant.findMany({
    where: { property: { ownerId: session.userId } },
    include: { property: { select: { title: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ tenants });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
  }

  const { propertyId, fullName, phone, email, monthlyRent, contractStart, contractEnd } =
    await req.json();

  if (!propertyId || !fullName?.trim() || !monthlyRent) {
    return NextResponse.json(
      { error: "Mülk, ad soyad ve aylık kira zorunludur." },
      { status: 400 }
    );
  }

  const property = await prisma.property.findUnique({ where: { id: propertyId } });
  if (!property || property.ownerId !== session.userId) {
    return NextResponse.json({ error: "Mülk bulunamadı." }, { status: 404 });
  }

  try {
    const tenant = await prisma.tenant.create({
      data: {
        propertyId,
        fullName: fullName.trim(),
        phone: phone?.trim() || null,
        email: email?.trim() || null,
        monthlyRent,
        contractStart: contractStart ? new Date(contractStart) : null,
        contractEnd: contractEnd ? new Date(contractEnd) : null,
      },
    });
    return NextResponse.json({ success: true, tenant });
  } catch {
    return NextResponse.json({ error: "Kiracı oluşturulamadı." }, { status: 500 });
  }
}
