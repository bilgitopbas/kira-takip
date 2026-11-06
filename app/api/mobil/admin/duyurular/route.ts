import { NextResponse } from "next/server";
import { duyuruGonder } from "@/lib/adminIslemleri";
import { duyuruGirdisi } from "@/lib/mobilAdminBicim";
import { duyuruGetir, duyurulariGetir } from "@/lib/mobilAdmin";
import { adminKapisi, hataYaniti, jsonGovde, jsonYanit, sunucuHatasi } from "@/lib/mobilKapi";

// Son 50 duyuru (web /admin/duyurular ile aynı)
export async function GET() {
  try {
    const k = await adminKapisi();
    if ("yanit" in k) return k.yanit;
    return jsonYanit({ duyurular: await duyurulariGetir() });
  } catch (err) {
    return sunucuHatasi(err);
  }
}

// hedefId yoksa HERKESE: uygulama içi bildirim + push (web announcements POST ile aynı işlev)
export async function POST(req: Request) {
  try {
    const k = await adminKapisi({ canli: true });
    if ("yanit" in k) return k.yanit;
    const g = await jsonGovde(req);
    if ("yanit" in g) return g.yanit;
    const d = duyuruGirdisi(g.govde);
    if ("hata" in d) return hataYaniti(d.hata, 400, "GECERSIZ_ALAN");

    const s = await duyuruGonder({ ...d, senderId: k.session.userId });
    if ("hata" in s) return hataYaniti("Seçilen kullanıcı bulunamadı.", 404, "KULLANICI_YOK");
    return NextResponse.json(
      { duyuru: await duyuruGetir(s.announcement.id), pushAlici: s.pushRecipients },
      { status: 201, headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (err) {
    return sunucuHatasi(err);
  }
}
