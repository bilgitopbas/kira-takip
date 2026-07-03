import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { name, phone, consent } = await req.json();

    if (!name || !phone) {
      return NextResponse.json(
        { error: "Ad ve telefon zorunludur." },
        { status: 400 }
      );
    }

    await prisma.contactRequest.create({
      data: {
        name,
        phone,
        marketingConsent: Boolean(consent),
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Bir hata oluştu." },
      { status: 500 }
    );
  }
}