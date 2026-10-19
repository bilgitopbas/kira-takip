import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { resolveAppUrl } from "@/lib/url";
import { PANEL_CEREZI, panelTercihiCoz, yeniPanelIzinli } from "@/lib/panelTercihi";

// Yeni panel / klasik panel tercihini bu cihaz için çereze yazar ve panele
// döner. Yalnız görünüm tercihidir; hiçbir veriye ya da yetkiye dokunmaz.
export async function GET(req: NextRequest) {
  const taban = resolveAppUrl(req);
  const session = await getSession();
  if (!session) {
    return NextResponse.redirect(`${taban}/login`);
  }

  const istenen = panelTercihiCoz(req.nextUrl.searchParams.get("panel")) ?? "klasik";
  // Sunucu izni yoksa tercih ne olursa olsun klasik yazılır.
  const tercih = yeniPanelIzinli() ? istenen : "klasik";

  const yanit = NextResponse.redirect(`${taban}/dashboard`);
  yanit.cookies.set(PANEL_CEREZI, tercih, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return yanit;
}
