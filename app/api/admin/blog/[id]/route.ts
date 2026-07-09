import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 403 });
  }

  const { id } = await params;
  const { title, excerpt, content, coverImageUrl, readingMinutes } = await req.json();

  if (!title?.trim() || !excerpt?.trim() || !content?.trim()) {
    return NextResponse.json({ error: "Başlık, özet ve içerik zorunludur." }, { status: 400 });
  }

  const post = await prisma.blogPost.update({
    where: { id },
    data: {
      title: title.trim(),
      excerpt: excerpt.trim(),
      content: content.trim(),
      coverImageUrl: coverImageUrl?.trim() || null,
      readingMinutes: readingMinutes ? Number(readingMinutes) : 5,
    },
  });

  return NextResponse.json({ success: true, post });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 403 });
  }

  const { id } = await params;
  await prisma.blogPost.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
