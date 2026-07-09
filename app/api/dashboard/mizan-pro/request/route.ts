import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { calculatePlanPrice } from "@/lib/access";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
  }

  const body = await req.json();
  const { type } = body;

  if (type === "PLAN_UPGRADE") {
    const propertyCount = Number(body.propertyCount);
    if (!propertyCount || propertyCount < 1) {
      return NextResponse.json({ error: "Geçerli bir mülk sayısı girin." }, { status: 400 });
    }
    const price = calculatePlanPrice(propertyCount);
    try {
      const ticket = await prisma.supportTicket.create({
        data: {
          userId: session.userId,
          subject: `Mizan Pro Talebi — ${propertyCount} mülk`,
          description: `Kullanıcı Mizan Pro planına geçmek istiyor.\nMülk sayısı: ${propertyCount}\nAylık tutar: ${price} TL\nÖdeme altyapısı (iyzico) tamamlanana kadar bu talep manuel olarak işleme alınmalıdır.`,
        },
      });
      return NextResponse.json({ success: true, ticket });
    } catch {
      return NextResponse.json({ error: "Talep gönderilemedi." }, { status: 500 });
    }
  }

  if (type === "MANAGEMENT_SERVICE") {
    const { fullName, email, phone, city, propertyCount } = body;
    if (!fullName?.trim() || !email?.trim() || !phone?.trim() || !city?.trim() || !propertyCount) {
      return NextResponse.json({ error: "Tüm alanları doldurun." }, { status: 400 });
    }
    try {
      const [ticket] = await Promise.all([
        prisma.supportTicket.create({
          data: {
            userId: session.userId,
            subject: "Profesyonel Mülk Yönetimi Hizmeti Talebi",
            description: `Ad Soyad: ${fullName.trim()}\nE-posta: ${email.trim()}\nCep Telefonu: ${phone.trim()}\nŞehir: ${city.trim()}\nMülk Sayısı: ${propertyCount}\n\nBu ücretsiz bir hizmet değildir, kullanıcıya özel teklif sunulmalıdır.`,
          },
        }),
        prisma.user.update({
          where: { id: session.userId },
          data: { wantsManagement: true },
        }),
      ]);
      return NextResponse.json({ success: true, ticket });
    } catch {
      return NextResponse.json({ error: "Talep gönderilemedi." }, { status: 500 });
    }
  }

  return NextResponse.json({ error: "Geçersiz talep türü." }, { status: 400 });
}
