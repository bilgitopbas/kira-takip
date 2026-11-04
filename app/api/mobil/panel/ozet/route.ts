import { jsonYanit, panelKapisi, sunucuHatasi } from "@/lib/mobilKapi";
import { ozetGetir } from "@/lib/mobilPanel";

export async function GET() {
  try {
    const k = await panelKapisi();
    if ("yanit" in k) return k.yanit;
    return jsonYanit(await ozetGetir(k.session.userId));
  } catch (err) {
    return sunucuHatasi(err);
  }
}
