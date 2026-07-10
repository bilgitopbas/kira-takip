import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { saveUploadedFile } from "@/lib/uploads";
import { generateMonthlyDebts } from "@/lib/debts";
import { parseTenantFormData } from "@/lib/tenantForm";
import { requireWriteAccess } from "@/lib/access";

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
    const tenant = await prisma.$transaction(async (tx) => {
      const created = await tx.tenant.create({
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

      const debtStart = data.rentPaymentDate || data.contractStart;
      if (debtStart) {
        const debts = generateMonthlyDebts(debtStart, data.monthlyRent);
        await tx.debt.createMany({
          data: debts.map((d) => ({ ...d, tenantId: created.id })),
        });
      }

      return created;
    });

    return NextResponse.json({ success: true, tenant });
  } catch {
    return NextResponse.json({ error: "Kiracı oluşturulamadı." }, { status: 500 });
  }
}
