import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { requireWriteAccess } from "@/lib/access";
import { yeniPanelIzinli } from "@/lib/panelTercihi";
import { atamaDogrula } from "@/lib/binalarimKayit";

// Mülk Ekle/Düzenle formunun bina + konum ucu (yeni panel açıkken).
// Mülkün kendisi klasik uçla (/api/dashboard/properties) kaydedilir; bu uç
// ardından YALNIZ Property.buildingId/block/unitNo ve Building kaydını yazar.
// Kiracılar, borçlar ve mülk-kiracı bağları değişmez. Okuma/yazma yalnız
// session.userId'nin kayıtlarıyla; yazma requireWriteAccess'ten geçer.

export async function GET(req: NextRequest) {
  if (!yeniPanelIzinli()) return NextResponse.json({ error: "Bulunamadı." }, { status: 404 });
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });

  const ownerId = session.userId;
  const propertyId = req.nextUrl.searchParams.get("propertyId");
  const [binalar, mulk] = await Promise.all([
    prisma.building.findMany({
      where: { ownerId },
      select: { id: true, name: true, city: true, district: true, lat: true, lng: true, locationVerified: true, gorunum: true, _count: { select: { properties: true } } },
      orderBy: { name: "asc" },
    }),
    propertyId
      ? prisma.property.findFirst({ where: { id: propertyId, ownerId }, select: { buildingId: true, block: true, unitNo: true } })
      : Promise.resolve(null),
  ]);

  return NextResponse.json(
    {
      binalar: binalar.map(({ _count, ...b }) => ({ ...b, birimSayisi: _count.properties })),
      atama: mulk ? { buildingId: mulk.buildingId, block: mulk.block, unitNo: mulk.unitNo } : null,
    },
    { headers: { "Cache-Control": "private, no-store" } }
  );
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
  const sonuc = atamaDogrula(govde, new Set(mulkler.map((m) => m.id)), new Set(binalar.map((b) => b.id)));
  if (!sonuc.ok) return NextResponse.json({ error: sonuc.hata }, { status: 400 });
  const { atama } = sonuc;

  try {
    const binaId = await prisma.$transaction(async (tx) => {
      let id: string | null = null;
      if (atama.bina?.id) {
        // Mevcut bina: ad/il değişmez (Binalarım'dan yönetilir); yalnız pin
        // taşındıysa konum, görünüm gönderildiyse görünüm yazılır.
        id = atama.bina.id;
        const guncelle = {
          ...(atama.bina.konum ? { lat: atama.bina.konum.lat, lng: atama.bina.konum.lng, locationVerified: atama.bina.konum.dogrulandi } : {}),
          ...(atama.bina.gorunum !== undefined ? { gorunum: atama.bina.gorunum } : {}),
        };
        if (Object.keys(guncelle).length) await tx.building.updateMany({ where: { id, ownerId }, data: guncelle });
      } else if (atama.bina) {
        const yeni = await tx.building.create({
          data: {
            ownerId,
            name: atama.bina.ad,
            city: atama.bina.il,
            district: atama.bina.ilce,
            lat: atama.bina.konum?.lat ?? null,
            lng: atama.bina.konum?.lng ?? null,
            locationVerified: atama.bina.konum?.dogrulandi ?? false,
            gorunum: atama.bina.gorunum ?? null,
          },
          select: { id: true },
        });
        id = yeni.id;
      }
      await tx.property.updateMany({
        where: { id: atama.propertyId, ownerId },
        data: { buildingId: id, block: id ? atama.blok : null, unitNo: id ? atama.daireNo : null },
      });
      // Hiç mülkü kalmayan binaları temizle (mülklere dokunmaz)
      await tx.building.deleteMany({ where: { ownerId, properties: { none: {} } } });
      return id;
    });
    return NextResponse.json({ success: true, buildingId: binaId });
  } catch (err) {
    console.error("Mülk bina ataması başarısız:", err);
    return NextResponse.json({ error: "Bina bilgisi kaydedilemedi. Lütfen tekrar deneyin." }, { status: 500 });
  }
}
