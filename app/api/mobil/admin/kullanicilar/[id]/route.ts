import { musteriPaketiDegistir, mulkLimitiBelirle, yonetimTercihiDegistir } from "@/lib/adminIslemleri";
import { kullaniciDegisikligi } from "@/lib/mobilAdminBicim";
import { kullaniciGetir, musteriMi } from "@/lib/mobilAdmin";
import { adminKapisi, hataYaniti, jsonGovde, jsonYanit, sunucuHatasi } from "@/lib/mobilKapi";
import { prisma } from "@/lib/prisma";

type Baglam = { params: Promise<{ id: string }> };

// Paket, yönetim isteği ve mülk limiti: web customers/[id]/status|management|subscription ile aynı işlevler
export async function PATCH(req: Request, { params }: Baglam) {
  try {
    const k = await adminKapisi({ canli: true });
    if ("yanit" in k) return k.yanit;
    const { id } = await params;
    const g = await jsonGovde(req);
    if ("yanit" in g) return g.yanit;
    const d = kullaniciDegisikligi(g.govde);
    if ("hata" in d) return hataYaniti(d.hata, 400, "GECERSIZ_ALAN");
    if (!(await musteriMi(id))) return hataYaniti("Kullanıcı bulunamadı.", 404, "KULLANICI_YOK");

    // Hepsi ya da hiçbiri
    await prisma.$transaction([
      ...(d.paket ? [musteriPaketiDegistir(id, d.paket)] : []),
      ...(d.yonetimIstiyor !== undefined ? [yonetimTercihiDegistir(id, d.yonetimIstiyor)] : []),
      ...(d.mulkLimiti !== undefined ? [mulkLimitiBelirle(id, d.mulkLimiti)] : []),
    ]);

    const kullanici = await kullaniciGetir(id);
    return kullanici ? jsonYanit(kullanici) : hataYaniti("Kullanıcı bulunamadı.", 404, "KULLANICI_YOK");
  } catch (err) {
    return sunucuHatasi(err);
  }
}
