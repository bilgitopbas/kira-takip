import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { saveUploadedFile } from "@/lib/uploads";
import { parseTenantFormData } from "@/lib/tenantForm";
import { requireWriteAccess } from "@/lib/access";

const PAGE_SIZE = 10;

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const q = searchParams.get("q")?.trim() || "";
  const city = searchParams.get("city")?.trim() || "";

  // Tahsilat formu gibi seçiciler için hafif, sayfalanmamış tam liste
  if (searchParams.get("all") === "1") {
    const tenants = await prisma.tenant.findMany({
      where: { property: { ownerId: session.userId } },
      select: { id: true, fullName: true, property: { select: { title: true } } },
      orderBy: { fullName: "asc" },
    });
    return NextResponse.json({ tenants });
  }

  const where = {
    property: {
      ownerId: session.userId,
      ...(city ? { city } : {}),
    },
    ...(q ? { fullName: { contains: q, mode: "insensitive" as const } } : {}),
  };

  const [tenants, total] = await Promise.all([
    prisma.tenant.findMany({
      where,
      select: {
        id: true,
        fullName: true,
        monthlyRent: true,
        contractStart: true,
        rating: true,
        property: { select: { title: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.tenant.count({ where }),
  ]);

  return NextResponse.json({ tenants, total, hasMore: page * PAGE_SIZE < total });
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

  const formData = await req.formData();
  const parsed = parseTenantFormData(formData);
  if (parsed.error) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const data = parsed.data;

  const property = await prisma.property.findUnique({ where: { id: data.propertyId } });
  if (!property || property.ownerId !== session.userId) {
    return NextResponse.json({ error: "Mülk bulunamadı." }, { status: 404 });
  }

  let contractFileUrl: string | null = null;
  const contractFile = formData.get("contractFile");
  if (contractFile instanceof File && contractFile.size > 0) {
    try {
      contractFileUrl = await saveUploadedFile(contractFile, "contracts");
    } catch (err) {
      return NextResponse.json({ error: err instanceof Error ? err.message : "Dosya yüklenemedi." }, { status: 400 });
    }
  }

  try {
    const tenant = await prisma.tenant.create({
      data: {
        propertyId: data.propertyId,
        fullName: data.fullName,
        phone: data.phone,
        email: data.email,
        tenantType: data.tenantType || null,
        nationalId: data.nationalId,
        taxNumber: data.taxNumber,
        notificationAddress: data.notificationAddress,
        notes: data.notes,
        rating: data.rating,
        contractStart: data.contractStart,
        contractEnd: data.contractEnd,
        rentRevisionDate: data.rentRevisionDate,
        rentPaymentDate: data.rentPaymentDate,
        contractDurationMonths: data.contractDurationMonths,
        paymentFrequency: data.paymentFrequency || null,
        increaseType: data.increaseType || null,
        increaseRate: data.increaseRate,
        depositAmount: data.depositAmount,
        depositCurrency: data.depositCurrency || null,
        contractFileUrl,
        contractNotes: data.contractNotes,
      },
    });

    return NextResponse.json({ success: true, tenant });
  } catch {
    return NextResponse.json({ error: "Kiracı oluşturulamadı." }, { status: 500 });
  }
}
