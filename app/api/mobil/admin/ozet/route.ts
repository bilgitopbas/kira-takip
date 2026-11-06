import { adminKapisi, jsonYanit, sunucuHatasi } from "@/lib/mobilKapi";
import { adminOzetiGetir } from "@/lib/mobilAdmin";

// Yönetici kontrol paneli: web /admin kartları + mobil için ek sayılar
export async function GET() {
  try {
    const k = await adminKapisi();
    if ("yanit" in k) return k.yanit;
    return jsonYanit(await adminOzetiGetir(k.session.userId));
  } catch (err) {
    return sunucuHatasi(err);
  }
}
