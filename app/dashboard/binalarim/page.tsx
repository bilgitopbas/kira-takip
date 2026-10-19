import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { yeniPanelIzinli } from "@/lib/panelTercihi";
import BinalarimEditor from "@/components/binalarim/BinalarimEditor";

/** Kısa sürüm imzası (React anahtarı uzun metin olmasın) */
function ozet(metin: string): string {
  let h = 5381;
  for (let i = 0; i < metin.length; i++) h = ((h << 5) + h + metin.charCodeAt(i)) | 0;
  return `${metin.length}-${(h >>> 0).toString(36)}`;
}

// "Binalarım" eşleme ekranı — yalnız yeni panel açıkken (YENI_PANEL=1).
// Veri kapsamı klasik panelle aynı: oturumdaki session.userId'nin mülkleri.
export default async function BinalarimSayfasi() {
  if (!yeniPanelIzinli()) notFound();
  const session = await getSession();
  if (!session) redirect("/login");

  const [mulkler, binalar] = await Promise.all([
    prisma.property.findMany({
      where: { ownerId: session.userId },
      select: { id: true, title: true, address: true, city: true, district: true, propertyType: true, buildingId: true, block: true, unitNo: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.building.findMany({
      where: { ownerId: session.userId },
      select: { id: true, name: true, city: true, district: true, lat: true, lng: true, locationVerified: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  // Kayıttan ya da mülk düzenlemesinden sonra (router.refresh) düzenleyici
  // yeni veriyle baştan kurulsun
  const surum = ozet(`${binalar.map((b) => `${b.id}${b.name}${b.city ?? ""}${b.lat ?? ""}`).join(",")}|${mulkler
    .map((m) => `${m.buildingId ?? ""}${m.block ?? ""}${m.unitNo ?? ""}${m.title}${m.address}${m.city ?? ""}${m.district ?? ""}`)
    .join(",")}`);

  return <BinalarimEditor key={surum} mulkler={mulkler} binalar={binalar} />;
}
