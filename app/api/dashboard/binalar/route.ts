import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { requireWriteAccess } from "@/lib/access";
import { yeniPanelIzinli } from "@/lib/panelTercihi";
import { kayitDogrula } from "@/lib/binalarimKayit";

// "Binalarım" eşleme ekranının veri ucu (yeni panel).
// Yetki: klasik paneldeki uçlarla aynı — oturum şart; okuma ve yazma yalnız
// session.userId'ye (ekip üyesinde hesap sahibine) ait mülk/binalarla.
// Yazma, klasik paneldeki gibi requireWriteAccess'ten geçer.
// Yalnız Property.buildingId/block/unitNo ve Building kayıtları değişir;
// mülkün başlığı, adresi, ili, kiracıları ve borçları DEĞİŞMEZ.

export async function GET() {
  if (!yeniPanelIzinli()) return NextResponse.json({ error: "Bulunamadı." }, { status: 404 });
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });

  const [mulkler, binalar] = await Promise.all([
    prisma.property.findMany({
      where: { ownerId: session.userId },
      select: { id: true, title: true, address: true, city: true, district: true, propertyType: true, buildingId: true, block: true, unitNo: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.building.findMany({
      where: { ownerId: session.userId },
      select: { id: true, name: true, city: true, district: true, lat: true, lng: true, locationVerified: true, gorunum: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  return NextResponse.json({ mulkler, binalar }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(req: NextRequest) {
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

  const ownerId = session.userId;
  const [mulkler, binalar] = await Promise.all([
    prisma.property.findMany({ where: { ownerId }, select: { id: true } }),
    prisma.building.findMany({ where: { ownerId }, select: { id: true } }),
  ]);
  const sonuc = kayitDogrula(
    govde,
    new Set(mulkler.map((m) => m.id)),
    new Set(binalar.map((b) => b.id))
  );
  if (!sonuc.ok) return NextResponse.json({ error: sonuc.hata }, { status: 400 });

  const binaIdleri: string[] = [];
  try {
    await prisma.$transaction(
      async (tx) => {
        for (const b of sonuc.binalar) {
          const veri = {
            name: b.ad,
            city: b.il,
            district: b.ilce,
            lat: b.konum?.lat ?? null,
            lng: b.konum?.lng ?? null,
            locationVerified: b.konum?.dogrulandi ?? false,
            // Görünüm gönderilmediyse kayıttaki değer korunur
            ...(b.gorunum !== undefined ? { gorunum: b.gorunum } : {}),
          };
          // Sahiplik kayitDogrula'da denetlendi; yine de where'de ownerId şart
          const bina = b.id
            ? (await tx.building.updateMany({ where: { id: b.id, ownerId }, data: veri }), { id: b.id })
            : await tx.building.create({ data: { ...veri, ownerId }, select: { id: true } });
          binaIdleri.push(bina.id);
          for (const u of b.birimler) {
            await tx.property.updateMany({
              where: { id: u.propertyId, ownerId },
              data: { buildingId: bina.id, block: u.blok, unitNo: u.daireNo },
            });
          }
        }
        // Hiç mülkü kalmayan binaları temizle (mülklere dokunmaz)
        await tx.building.deleteMany({ where: { ownerId, properties: { none: {} } } });
      },
      { timeout: 20000 }
    );
  } catch (err) {
    console.error("Binalarım kaydı başarısız:", err);
    return NextResponse.json({ error: "Kaydedilemedi. Lütfen tekrar deneyin." }, { status: 500 });
  }

  return NextResponse.json({ success: true, binaIdleri });
}
