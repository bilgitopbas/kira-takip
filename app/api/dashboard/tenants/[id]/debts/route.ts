import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { generateMonthlyDebts, generateYearlyDebt } from "@/lib/debts";
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

  const { monthlyRent, startDate, paymentType, months } = await req.json();
  const rent = Number(monthlyRent);
  if (!startDate || Number.isNaN(rent) || rent <= 0) {
    return NextResponse.json({ error: "Geçerli bir tarih ve kira bedeli girin." }, { status: 400 });
  }

  // Dönem uzunluğu kullanıcı tarafından seçilir (varsayılan 12). Erken zam
  // gibi durumlarda 10 aylık bir dönem oluşturulabilsin diye serbest bırakıldı.
  const aySayisi = Math.min(36, Math.max(1, Math.trunc(Number(months)) || 12));

  // "YEARLY" seçilirse girilen tutar dönemin toplamıdır ve tüm dönemi kapsayan
  // tek bir borç kaydı oluşturulur. Varsayılan (önceki davranış) aylıktır.
  const yillik = paymentType === "YEARLY";

  const uretilen = yillik
    ? generateYearlyDebt(new Date(startDate), rent, aySayisi)
    : generateMonthlyDebts(new Date(startDate), rent, aySayisi);

  const existingDebts = await prisma.debt.findMany({
    where: { tenantId: id },
    select: { id: true, year: true, month: true },
  });
  const mevcutlar = new Map(existingDebts.map((d) => [`${d.year}-${d.month}`, d.id]));

  // Aynı aya denk gelen eski borçlar hata vermek yerine YENİ döneme devralınır:
  // tutarı güncellenir ve dönem kimliği yeni gruba taşınır. Erken zam yapılınca
  // ("1 Mart'ta başlayan kiracıya Ocak'ta zam") o aylar eski dönemden çıkıp
  // yeni dönemin parçası olur - kullanıcının beklediği davranış budur.
  const billingGroupId = crypto.randomUUID();
  const yeniler = uretilen.filter((d) => !mevcutlar.has(`${d.year}-${d.month}`));
  const devralinanlar = uretilen
    .map((d) => ({ debt: d, id: mevcutlar.get(`${d.year}-${d.month}`) }))
    .filter((x): x is { debt: (typeof uretilen)[number]; id: string } => !!x.id);

  await prisma.$transaction([
    ...(yeniler.length > 0
      ? [prisma.debt.createMany({ data: yeniler.map((d) => ({ ...d, tenantId: id, billingGroupId })) })]
      : []),
    ...devralinanlar.map((x) =>
      prisma.debt.update({
        where: { id: x.id },
        data: {
          amount: x.debt.amount,
          dueDate: x.debt.dueDate,
          periodMonths: x.debt.periodMonths,
          billingGroupId,
        },
      })
    ),
  ]);

  // Aylık kira bilgisi, tarihi en güncel olan borç dönemine göre belirlenir
  // (borçlandırmaların hangi sırayla girildiğine değil, tarihe bakılır).
  // Yıllık borçta tutar 12 ayın toplamıdır; "Aylık Kira" alanının doğru
  // kalması için aylık karşılığa bölünerek yazılır.
  const latestDebt = await prisma.debt.findFirst({
    where: { tenantId: id },
    orderBy: { dueDate: "desc" },
    select: { amount: true, periodMonths: true },
  });
  if (latestDebt) {
    const aylikKarsilik = Number(latestDebt.amount) / Math.max(1, latestDebt.periodMonths);
    await prisma.tenant.update({
      where: { id },
      data: {
        monthlyRent: aylikKarsilik,
        paymentFrequency: yillik ? "YEARLY" : "MONTHLY",
      },
    });
  }

  return NextResponse.json({
    success: true,
    created: yeniler.length,
    updated: devralinanlar.length,
  });
}
