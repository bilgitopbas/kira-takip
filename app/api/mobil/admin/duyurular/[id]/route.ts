import { duyuruSil } from "@/lib/mobilAdmin";
import { adminKapisi, hataYaniti, jsonYanit, sunucuHatasi } from "@/lib/mobilKapi";

type Baglam = { params: Promise<{ id: string }> };

// Yalnız duyuru kaydı silinir; gönderilmiş bildirimler kalır (web ile aynı)
export async function DELETE(_req: Request, { params }: Baglam) {
  try {
    const k = await adminKapisi({ canli: true });
    if ("yanit" in k) return k.yanit;
    const { id } = await params;
    if (!(await duyuruSil(id))) return hataYaniti("Duyuru bulunamadı.", 404, "DUYURU_YOK");
    return jsonYanit({ mesaj: "Duyuru silindi." });
  } catch (err) {
    return sunucuHatasi(err);
  }
}
