import { odemeBildiriminiSonuclandir } from "@/lib/adminIslemleri";
import { odemeIslemi } from "@/lib/mobilAdminBicim";
import { odemeBildirimiGetir } from "@/lib/mobilAdmin";
import { adminKapisi, hataYaniti, jsonGovde, jsonYanit, sunucuHatasi } from "@/lib/mobilKapi";

type Baglam = { params: Promise<{ id: string }> };

// Onay aboneliği açar/uzatır, red kaydı kapatır; ikisinde de müşteriye bildirim (web ile aynı işlev)
export async function PATCH(req: Request, { params }: Baglam) {
  try {
    const k = await adminKapisi({ canli: true });
    if ("yanit" in k) return k.yanit;
    const { id } = await params;
    const g = await jsonGovde(req);
    if ("yanit" in g) return g.yanit;
    const islem = odemeIslemi(g.govde);
    if ("hata" in islem) return hataYaniti(islem.hata, 400, "GECERSIZ_ALAN");

    const s = await odemeBildiriminiSonuclandir(id, islem.action, islem.note);
    if (s.sonuc === "YOK") return hataYaniti("Bildirim bulunamadı.", 404, "BILDIRIM_YOK");
    if (s.sonuc === "SONUCLANMIS") return hataYaniti("Bu bildirim zaten sonuçlandırılmış.", 409, "SONUCLANMIS");

    const kayit = await odemeBildirimiGetir(id);
    return kayit ? jsonYanit(kayit) : hataYaniti("Bildirim bulunamadı.", 404, "BILDIRIM_YOK");
  } catch (err) {
    return sunucuHatasi(err);
  }
}
