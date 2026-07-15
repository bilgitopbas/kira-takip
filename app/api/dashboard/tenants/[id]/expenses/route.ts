import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { requireWriteAccess } from "@/lib/access";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
  }

  const access = await requireWriteAccess(session.userId);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: 403 });
  }

  const { id } = await params;

  const tenant = await prisma.tenant.findUnique({
    where: { id },
    include: { property: true },
  });
  if (!tenant || tenant.property.ownerId !== session.userId) {
    return NextResponse.json({ error: "Kiracı bulunamadı." }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const description = typeof body?.description === "string" ? body.description.trim() : "";
  const amount = Number(body?.amount);
  const date = body?.date ? new Date(body.date) : null;
  const notes = typeof body?.notes === "string" ? body.notes.trim() || null : null;

  if (!description) {
    return NextResponse.json({ error: "Masraf açıklaması zorunludur." }, { status: 400 });
  }
  if (Number.isNaN(amount) || amount <= 0) {
    return NextResponse.json({ error: "Geçerli bir tutar girin." }, { status: 400 });
  }
  if (!date || Number.isNaN(date.getTime())) {
    return NextResponse.json({ error: "Geçerli bir tarih girin." }, { status: 400 });
  }

  try {
    const expense = await prisma.expense.create({
      data: {
        propertyId: tenant.propertyId,
        tenantId: tenant.id,
        description,
        amount,
        date,
        notes,
      },
    });
    return NextResponse.json({ success: true, expense });
  } catch {
    return NextResponse.json({ error: "Masraf kaydedilemedi." }, { status: 500 });
  }
}
