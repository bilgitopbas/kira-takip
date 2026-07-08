import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
  }

  const { subject, description } = await req.json();

  if (!subject?.trim() || !description?.trim()) {
    return NextResponse.json({ error: "Konu ve açıklama zorunludur." }, { status: 400 });
  }

  try {
    const ticket = await prisma.supportTicket.create({
      data: {
        userId: session.userId,
        subject: subject.trim(),
        description: description.trim(),
      },
    });
    return NextResponse.json({ success: true, ticket });
  } catch {
    return NextResponse.json({ error: "Destek talebi gönderilemedi." }, { status: 500 });
  }
}
