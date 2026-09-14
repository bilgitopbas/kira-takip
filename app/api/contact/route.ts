import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { verifyRecaptcha } from "@/lib/recaptcha";

const AD_EN_AZ = 2;
const AD_EN_FAZLA = 100;

// Türkiye numarası: boşluk, tire, parantez ve +90 / 0 öneki temizlendikten
// sonra 2-5 ile başlayan 10 hane (sabit hat veya cep). Kayıt "+90XXXXXXXXXX"
// biçiminde tutulur.
function telefonuNormallestir(girdi: string): string | null {
  let rakamlar = girdi.replace(/[\s\-().]/g, "");
  if (rakamlar.startsWith("+")) rakamlar = rakamlar.slice(1);
  if (!/^\d+$/.test(rakamlar)) return null;
  if (rakamlar.length === 12 && rakamlar.startsWith("90")) rakamlar = rakamlar.slice(2);
  else if (rakamlar.length === 11 && rakamlar.startsWith("0")) rakamlar = rakamlar.slice(1);
  if (!/^[2-5]\d{9}$/.test(rakamlar)) return null;
  return `+90${rakamlar}`;
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (!checkRateLimit(`contact:${ip}`, 5, 60 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Çok fazla talep gönderildi. Lütfen daha sonra tekrar deneyin." },
      { status: 429 }
    );
  }

  let govde: unknown;
  try {
    govde = await req.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }
  const { name, phone, consent, recaptchaToken } = (govde ?? {}) as Record<string, unknown>;

  if (typeof name !== "string" || typeof phone !== "string") {
    return NextResponse.json({ error: "Ad ve telefon zorunludur." }, { status: 400 });
  }

  // Kontrol karakterlerini at, fazla boşlukları tek boşluğa indir.
  const ad = name.replace(/[\u0000-\u001f\u007f]/g, "").replace(/\s+/g, " ").trim();
  if (ad.length < AD_EN_AZ || ad.length > AD_EN_FAZLA) {
    return NextResponse.json(
      { error: `Ad soyad ${AD_EN_AZ}-${AD_EN_FAZLA} karakter arasında olmalıdır.` },
      { status: 400 }
    );
  }

  const telefon = phone.length <= 25 ? telefonuNormallestir(phone) : null;
  if (!telefon) {
    return NextResponse.json(
      { error: "Geçerli bir telefon numarası girin (ör. 5XX XXX XX XX)." },
      { status: 400 }
    );
  }

  const recaptchaOk = await verifyRecaptcha(typeof recaptchaToken === "string" ? recaptchaToken : null);
  if (!recaptchaOk) {
    return NextResponse.json({ error: "Lütfen robot olmadığınızı doğrulayın." }, { status: 400 });
  }

  try {
    await prisma.contactRequest.create({
      data: {
        name: ad,
        phone: telefon,
        // Pazarlama onayı yalnızca kutucuk açıkça işaretlendiyse (true) kaydedilir.
        marketingConsent: consent === true,
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Bir hata oluştu." }, { status: 500 });
  }
}
