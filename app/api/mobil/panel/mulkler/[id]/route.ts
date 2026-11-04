import { hataYaniti, jsonYanit, panelKapisi, sunucuHatasi } from "@/lib/mobilKapi";
import { mulkDetayiGetir } from "@/lib/mobilPanel";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const k = await panelKapisi();
    if ("yanit" in k) return k.yanit;
    const { id } = await params;
    const mulk = await mulkDetayiGetir(k.session.userId, id);
    if (!mulk) return hataYaniti("Mülk bulunamadı.", 404, "BULUNAMADI");
    return jsonYanit(mulk);
  } catch (err) {
    return sunucuHatasi(err);
  }
}
