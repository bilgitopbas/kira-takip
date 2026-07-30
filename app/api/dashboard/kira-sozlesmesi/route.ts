import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireWriteAccess } from "@/lib/access";
import { sendKiraSozlesmesiEmail } from "@/lib/mail";
import {
  dosyaAdiUret,
  eksikZorunluAlanlar,
  pdfeCevir,
  sablonVerisiHazirla,
  sozlesmeUret,
} from "@/lib/kiraSozlesmesi";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Oturum bulunamadı." }, { status: 401 });
  }

  const access = await requireWriteAccess(session.userId);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: 403 });
  }

  let govde: Record<string, unknown>;
  try {
    govde = await req.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const alanlar = (govde.alanlar ?? {}) as Record<string, unknown>;
  const eksikler = eksikZorunluAlanlar(alanlar);
  if (eksikler.length > 0) {
    return NextResponse.json(
      { error: `Şu alanlar zorunludur: ${eksikler.join(", ")}` },
      { status: 400 }
    );
  }

  const veri = sablonVerisiHazirla(alanlar);

  let docx: Buffer;
  try {
    docx = sozlesmeUret(veri);
  } catch (hata) {
    console.error("Sozlesme uretilemedi:", hata);
    return NextResponse.json(
      { error: "Sözleşme oluşturulamadı. Lütfen tekrar deneyin." },
      { status: 500 }
    );
  }

  const pdf = await pdfeCevir(docx);
  const kiraciAdi = typeof veri["Kiracıadsoyad"] === "string" ? veri["Kiracıadsoyad"] : "";
  const dosyaAdi = dosyaAdiUret(kiraciAdi);

  // E-posta yalnızca oturum sahibine gider; kiracıya doğrudan gönderilmez.
  let mailGonderildi = false;
  if (govde.mailGonder === true) {
    try {
      const kullanici = await prisma.user.findUnique({
        where: { id: session.userId },
        select: { email: true, fullName: true },
      });
      const alici = session.memberEmail || kullanici?.email;
      const ad = session.memberName || kullanici?.fullName || "";
      if (alici) {
        const ekler: { filename: string; content: Buffer }[] = [
          { filename: `${dosyaAdi}.docx`, content: docx },
        ];
        if (pdf) ekler.push({ filename: `${dosyaAdi}.pdf`, content: pdf });
        await sendKiraSozlesmesiEmail(alici, ad, kiraciAdi, ekler);
        mailGonderildi = true;
      }
    } catch (hata) {
      // E-posta gidemezse belge yine de indirilebilsin
      console.error("Sozlesme e-postasi gonderilemedi:", hata);
    }
  }

  return NextResponse.json({
    dosyaAdi,
    docx: docx.toString("base64"),
    pdf: pdf ? pdf.toString("base64") : null,
    mailGonderildi,
  });
}
