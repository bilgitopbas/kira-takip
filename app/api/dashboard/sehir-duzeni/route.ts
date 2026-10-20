import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { requireWriteAccess } from "@/lib/access";
import { yeniPanelIzinli } from "@/lib/panelTercihi";
import { DUZEN_SINIRI, duzenDogrula, type Duzen } from "@/lib/sehirDuzeni";

// Mülk Şehrim 3D bina düzeni (yeni panel). Yalnız session.userId'nin satırı
// okunur/yazılır; yazma requireWriteAccess'ten geçer. Tablo (city_layouts)
// henüz kurulmadıysa { sunucu: false } döner ve istemci düzeni cihazda tutar.

/** Cihazdaki geçici düzen anahtarı için hesap özeti (kimliği açığa vermez) */
const hesapOzeti = (ownerId: string) => createHash("sha256").update(`mizan-sehir:${ownerId}`).digest("hex").slice(0, 12);

function tabloYok(err: unknown): boolean {
  const e = err as { code?: string; message?: string };
  return e?.code === "P2021" || /city_layouts/.test(e?.message ?? "");
}

function ilOku(deger: string | null): string | null {
  const il = deger?.trim() ?? "";
  return il && il.length <= DUZEN_SINIRI.il ? il : null;
}

export async function GET(req: NextRequest) {
  if (!yeniPanelIzinli()) return NextResponse.json({ error: "Bulunamadı." }, { status: 404 });
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
  const il = ilOku(req.nextUrl.searchParams.get("il"));
  if (!il) return NextResponse.json({ error: "Geçersiz il." }, { status: 400 });

  const hesap = hesapOzeti(session.userId);
  const basliklar = { "Cache-Control": "private, no-store" };
  try {
    const satir = await prisma.cityLayout.findUnique({
      where: { ownerId_il: { ownerId: session.userId, il } },
      select: { cells: true },
    });
    return NextResponse.json({ sunucu: true, hesap, duzen: (satir?.cells as Duzen | undefined) ?? null }, { headers: basliklar });
  } catch (err) {
    if (tabloYok(err)) return NextResponse.json({ sunucu: false, hesap, duzen: null }, { headers: basliklar });
    console.error("Şehir düzeni okunamadı:", err);
    return NextResponse.json({ error: "Okunamadı." }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  if (!yeniPanelIzinli()) return NextResponse.json({ error: "Bulunamadı." }, { status: 404 });
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
  const access = await requireWriteAccess(session.userId);
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: 403 });

  let govde: unknown;
  try {
    govde = await req.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }
  const sonuc = duzenDogrula(govde);
  if (!sonuc.ok) return NextResponse.json({ error: sonuc.hata }, { status: 400 });

  const ownerId = session.userId;
  try {
    if (Object.keys(sonuc.duzen).length === 0) {
      // Boş düzen = "Düzeni sıfırla"
      await prisma.cityLayout.deleteMany({ where: { ownerId, il: sonuc.il } });
    } else {
      await prisma.cityLayout.upsert({
        where: { ownerId_il: { ownerId, il: sonuc.il } },
        create: { ownerId, il: sonuc.il, cells: sonuc.duzen },
        update: { cells: sonuc.duzen },
      });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    if (tabloYok(err)) return NextResponse.json({ sunucu: false }, { status: 409 });
    console.error("Şehir düzeni kaydedilemedi:", err);
    return NextResponse.json({ error: "Kaydedilemedi." }, { status: 500 });
  }
}
