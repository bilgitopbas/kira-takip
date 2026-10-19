import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { panelOzetiGetir } from "@/lib/yeniPanelVeri";
import { panelBirimleriGetir } from "@/lib/yeniPanelBirimleri";
import { yeniPanelIzinli } from "@/lib/panelTercihi";

// Yeni panelin SALT OKUNUR veri ucu (ekleme/düzenleme sonrası tazeleme için).
// Yetki: klasik paneldeki uçlarla aynı — oturum şart, veri yalnız
// session.userId'ye (ekip üyesinde hesap sahibine) ait mülklerle sınırlı.
export async function GET() {
  if (!yeniPanelIzinli()) {
    return NextResponse.json({ error: "Bulunamadı." }, { status: 404 });
  }

  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
  }

  const [ozet, { birimler, bugun }] = await Promise.all([
    panelOzetiGetir(session.userId),
    panelBirimleriGetir(session.userId),
  ]);

  return NextResponse.json(
    { ozet, birimler, bugun },
    { headers: { "Cache-Control": "private, no-store" } }
  );
}
