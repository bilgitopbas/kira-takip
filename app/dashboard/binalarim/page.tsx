import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { yeniPanelIzinli } from "@/lib/panelTercihi";
import BinalarimEditor from "@/components/binalarim/BinalarimEditor";

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

  // Kayıttan sonra (router.refresh) düzenleyici yeni veriyle baştan kurulsun
  const surum = `${binalar.map((b) => b.id).join(",")}|${mulkler.map((m) => `${m.buildingId ?? ""}${m.block ?? ""}${m.unitNo ?? ""}`).join(",")}`;

  return <BinalarimEditor key={surum} mulkler={mulkler} binalar={binalar} />;
}
