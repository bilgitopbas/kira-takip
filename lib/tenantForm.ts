import { addMonthsClamped } from "@/lib/debts";

const TENANT_TYPES = ["INDIVIDUAL", "CORPORATE"];
const PAYMENT_FREQUENCIES = ["MONTHLY", "YEARLY"];
const INCREASE_TYPES = ["TUFE", "CUSTOM"];
const CURRENCIES = ["TRY", "USD", "EUR"];

export function parseTenantFormData(formData: FormData) {
  const get = (key: string) => (formData.get(key) as string | null)?.trim() || "";

  const propertyId = get("propertyId");
  const fullName = get("fullName");

  if (!propertyId || !fullName) {
    return { error: "Mülk ve ad soyad zorunludur." } as const;
  }

  const tenantType = get("tenantType");
  if (tenantType && !TENANT_TYPES.includes(tenantType)) {
    return { error: "Geçersiz kiracı tipi." } as const;
  }

  const paymentFrequency = get("paymentFrequency");
  if (paymentFrequency && !PAYMENT_FREQUENCIES.includes(paymentFrequency)) {
    return { error: "Geçersiz ödeme şekli." } as const;
  }

  const increaseType = get("increaseType");
  if (increaseType && !INCREASE_TYPES.includes(increaseType)) {
    return { error: "Geçersiz artış tipi." } as const;
  }

  const depositCurrency = get("depositCurrency");
  if (depositCurrency && !CURRENCIES.includes(depositCurrency)) {
    return { error: "Geçersiz para birimi." } as const;
  }

  const ratingRaw = get("rating");
  const rating = ratingRaw ? Number(ratingRaw) : null;
  if (rating !== null && (rating < 1 || rating > 5)) {
    return { error: "Puan 1 ile 5 arasında olmalıdır." } as const;
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

  return {
    data: {
      propertyId,
      fullName,
      phone: get("phone") || null,
      email: get("email") || null,
      tenantType: (tenantType as "INDIVIDUAL" | "CORPORATE" | "") || null,
      nationalId: get("nationalId") || null,
      taxNumber: get("taxNumber") || null,
      notificationAddress: get("notificationAddress") || null,
      notes: get("notes") || null,
      rating,
      contractStart,
      contractEnd,
      rentRevisionDate,
      rentPaymentDate,
      contractDurationMonths,
      paymentFrequency: (paymentFrequency as "MONTHLY" | "YEARLY" | "") || null,
      increaseType: (increaseType as "TUFE" | "CUSTOM" | "") || null,
      increaseRate,
      depositAmount,
      depositCurrency: (depositCurrency as "TRY" | "USD" | "EUR" | "") || null,
      contractNotes: get("contractNotes") || null,
    },
  } as const;
}
