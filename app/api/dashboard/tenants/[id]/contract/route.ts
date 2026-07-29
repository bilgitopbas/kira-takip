import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getUploadedFilePath } from "@/lib/uploads";

// Dosya yeni sekmede açılabilsin diye gerçek MIME türüyle sunulur.
// Onceden hepsi "application/octet-stream" + "attachment" ile gonderildigi icin
// tarayici PDF/gorseli sekmede acmak yerine her zaman indirmeye zorluyordu.
// (Guvenlik basliklarindaki X-Content-Type-Options: nosniff nedeniyle dogru
// tur gondermek ayrica sart.)
const MIME_TYPES: Record<string, string> = {
  ".pdf": "application/pdf",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
  }

  const { id } = await params;

  const tenant = await prisma.tenant.findUnique({
    where: { id },
    include: { property: true },
  });

  if (!tenant || tenant.property.ownerId !== session.userId || !tenant.contractFileUrl) {
    return NextResponse.json({ error: "Dosya bulunamadı." }, { status: 404 });
  }

  try {
    const filePath = getUploadedFilePath("contracts", tenant.contractFileUrl);
    const buffer = await readFile(filePath);
    const ext = path.extname(tenant.contractFileUrl).toLowerCase();
    // Word gibi tarayicinin gosteremedigi turlerde "inline" zaten indirmeye duser
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": MIME_TYPES[ext] || "application/octet-stream",
        "Content-Disposition": `inline; filename="${tenant.contractFileUrl}"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "Dosya bulunamadı." }, { status: 404 });
  }
}
