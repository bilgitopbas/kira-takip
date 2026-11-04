import { hataYaniti, jsonYanit, panelKapisi, sunucuHatasi } from "@/lib/mobilKapi";
import { kiraciDetayiGetir } from "@/lib/mobilPanel";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const k = await panelKapisi();
    if ("yanit" in k) return k.yanit;
    const { id } = await params;
    const kiraci = await kiraciDetayiGetir(k.session.userId, id);
    if (!kiraci) return hataYaniti("Kiracı bulunamadı.", 404, "BULUNAMADI");
    return jsonYanit(kiraci);
  } catch (err) {
    return sunucuHatasi(err);
  }
}
