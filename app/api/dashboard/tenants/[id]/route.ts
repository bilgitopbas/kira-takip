import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { saveUploadedFile } from "@/lib/uploads";
import { parseTenantFormData } from "@/lib/tenantForm";

async function getOwnedTenant(id: string, userId: string) {
  const tenant = await prisma.tenant.findUnique({
    where: { id },
    include: { property: true },
  });
  if (!tenant || tenant.property.ownerId !== userId) return null;
  return tenant;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
  }

  const { id } = await params;

  const tenant = await prisma.tenant.findUnique({
    where: { id },
    include: {
      property: true,
      debts: { orderBy: { dueDate: "asc" }, include: { payments: true } },
    },
  });

  if (!tenant || tenant.property.ownerId !== session.userId) {
    return NextResponse.json({ error: "Kiracı bulunamadı." }, { status: 404 });
  }

  return NextResponse.json({ tenant });
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
  const existing = await getOwnedTenant(id, session.userId);
  if (!existing) {
    return NextResponse.json({ error: "Kiracı bulunamadı." }, { status: 404 });
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

  let contractFileUrl = existing.contractFileUrl;
  const contractFile = formData.get("contractFile");
  if (contractFile instanceof File && contractFile.size > 0) {
    try {
      contractFileUrl = await saveUploadedFile(contractFile, "contracts");
    } catch (err) {
      return NextResponse.json({ error: err instanceof Error ? err.message : "Dosya yüklenemedi." }, { status: 400 });
    }
  }

  try {
    const tenant = await prisma.tenant.update({
      where: { id },
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
        monthlyRent: data.monthlyRent,
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
    return NextResponse.json({ error: "Kiracı güncellenemedi." }, { status: 500 });
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

  const tenant = await getOwnedTenant(id, session.userId);
  if (!tenant) {
    return NextResponse.json({ error: "Kiracı bulunamadı." }, { status: 404 });
  }

  try {
    await prisma.$transaction([
      prisma.payment.deleteMany({ where: { tenantId: id } }),
      prisma.debt.deleteMany({ where: { tenantId: id } }),
      prisma.tenant.delete({ where: { id } }),
    ]);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Kiracı silinemedi." }, { status: 500 });
  }
}
