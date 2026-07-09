import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

function slugify(title: string) {
  const map: Record<string, string> = { ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u", Ç: "c", Ğ: "g", İ: "i", Ö: "o", Ş: "s", Ü: "u" };
  return title
    .split("")
    .map((ch) => map[ch] ?? ch)
    .join("")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 403 });
  }

  const posts = await prisma.blogPost.findMany({ orderBy: { publishedAt: "desc" } });
  return NextResponse.json({ posts });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 403 });
  }

  const { title, excerpt, content, coverImageUrl, readingMinutes } = await req.json();
  if (!title?.trim() || !excerpt?.trim() || !content?.trim()) {
    return NextResponse.json({ error: "Başlık, özet ve içerik zorunludur." }, { status: 400 });
  }

  let slug = slugify(title.trim());
  let suffix = 1;
  const baseSlug = slug;
  while (await prisma.blogPost.findUnique({ where: { slug } })) {
    suffix += 1;
    slug = `${baseSlug}-${suffix}`;
  }

  const post = await prisma.blogPost.create({
    data: {
      slug,
      title: title.trim(),
      excerpt: excerpt.trim(),
      content: content.trim(),
      coverImageUrl: coverImageUrl?.trim() || null,
      readingMinutes: readingMinutes ? Number(readingMinutes) : 5,
    },
  });

  return NextResponse.json({ success: true, post });
}
