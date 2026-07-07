import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { saveUploadedFile } from "@/lib/uploads";

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

function addMonthsClamped(date: Date, months: number) {
  const day = date.getDate();
  const result = new Date(date.getFullYear(), date.getMonth() + months, 1);
  const lastDayOfResultMonth = new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate();
  result.setDate(Math.min(day, lastDayOfResultMonth));
  return result;
}

const TENANT_TYPES = ["INDIVIDUAL", "CORPORATE"];
const PAYMENT_FREQUENCIES = ["MONTHLY", "YEARLY"];
const INCREASE_TYPES = ["TUFE", "CUSTOM"];
const CURRENCIES = ["TRY", "USD", "EUR"];

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
  }

  const formData = await req.formData();
  const get = (key: string) => (formData.get(key) as string | null)?.trim() || "";

  const propertyId = get("propertyId");
  const fullName = get("fullName");
  const monthlyRentRaw = get("monthlyRent");

  if (!propertyId || !fullName || !monthlyRentRaw) {
    return NextResponse.json(
      { error: "Mülk, ad soyad ve aylık kira zorunludur." },
      { status: 400 }
    );
  }

  const property = await prisma.property.findUnique({ where: { id: propertyId } });
  if (!property || property.ownerId !== session.userId) {
    return NextResponse.json({ error: "Mülk bulunamadı." }, { status: 404 });
  }

  const tenantType = get("tenantType");
  if (tenantType && !TENANT_TYPES.includes(tenantType)) {
    return NextResponse.json({ error: "Geçersiz kiracı tipi." }, { status: 400 });
  }

  const paymentFrequency = get("paymentFrequency");
  if (paymentFrequency && !PAYMENT_FREQUENCIES.includes(paymentFrequency)) {
    return NextResponse.json({ error: "Geçersiz ödeme şekli." }, { status: 400 });
  }

  const increaseType = get("increaseType");
  if (increaseType && !INCREASE_TYPES.includes(increaseType)) {
    return NextResponse.json({ error: "Geçersiz artış tipi." }, { status: 400 });
  }

  const depositCurrency = get("depositCurrency");
  if (depositCurrency && !CURRENCIES.includes(depositCurrency)) {
    return NextResponse.json({ error: "Geçersiz para birimi." }, { status: 400 });
  }

  const monthlyRent = Number(monthlyRentRaw);
  if (Number.isNaN(monthlyRent) || monthlyRent <= 0) {
    return NextResponse.json({ error: "Geçersiz aylık kira bedeli." }, { status: 400 });
  }

  const ratingRaw = get("rating");
  const rating = ratingRaw ? Number(ratingRaw) : null;
  if (rating !== null && (rating < 1 || rating > 5)) {
    return NextResponse.json({ error: "Puan 1 ile 5 arasında olmalıdır." }, { status: 400 });
  }

  const contractStartRaw = get("contractStart");
  const contractStart = contractStartRaw ? new Date(contractStartRaw) : null;

  const contractDurationMonthsRaw = get("contractDurationMonths");
  const contractDurationMonths = contractDurationMonthsRaw ? Number(contractDurationMonthsRaw) : null;

  const contractEnd =
    contractStart && contractDurationMonths
      ? addMonthsClamped(contractStart, contractDurationMonths)
      : null;

  const rentRevisionDateRaw = get("rentRevisionDate");
  const rentPaymentDateRaw = get("rentPaymentDate");
  const rentRevisionDate = rentRevisionDateRaw ? new Date(rentRevisionDateRaw) : null;
  const rentPaymentDate = rentPaymentDateRaw ? new Date(rentPaymentDateRaw) : null;

  const increaseRateRaw = get("increaseRate");
  const increaseRate = increaseType === "CUSTOM" && increaseRateRaw ? Number(increaseRateRaw) : null;

  const depositAmountRaw = get("depositAmount");
  const depositAmount = depositAmountRaw ? Number(depositAmountRaw) : null;

  let contractFileUrl: string | null = null;
  const contractFile = formData.get("contractFile");
  if (contractFile instanceof File && contractFile.size > 0) {
    contractFileUrl = await saveUploadedFile(contractFile, "contracts");
  }

  try {
    const tenant = await prisma.$transaction(async (tx) => {
      const created = await tx.tenant.create({
        data: {
          propertyId,
          fullName,
          phone: get("phone") || null,
          email: get("email") || null,
          tenantType: (tenantType as "INDIVIDUAL" | "CORPORATE") || null,
          nationalId: get("nationalId") || null,
          taxNumber: get("taxNumber") || null,
          notificationAddress: get("notificationAddress") || null,
          notes: get("notes") || null,
          rating,
          monthlyRent,
          contractStart,
          contractEnd,
          rentRevisionDate,
          rentPaymentDate,
          contractDurationMonths,
          paymentFrequency: (paymentFrequency as "MONTHLY" | "YEARLY") || null,
          increaseType: (increaseType as "TUFE" | "CUSTOM") || null,
          increaseRate,
          depositAmount,
          depositCurrency: (depositCurrency as "TRY" | "USD" | "EUR") || null,
          contractFileUrl,
          contractNotes: get("contractNotes") || null,
        },
      });

      const debtStart = rentPaymentDate || contractStart;
      if (debtStart) {
        for (let i = 0; i < 12; i++) {
          const dueDate = addMonthsClamped(debtStart, i);
          await tx.debt.create({
            data: {
              tenantId: created.id,
              year: dueDate.getFullYear(),
              month: dueDate.getMonth() + 1,
              amount: monthlyRent,
              dueDate,
            },
          });
        }
      }

      return created;
    });

    return NextResponse.json({ success: true, tenant });
  } catch {
    return NextResponse.json({ error: "Kiracı oluşturulamadı." }, { status: 500 });
  }
}
