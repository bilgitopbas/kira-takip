import { NextRequest } from "next/server";
import { sorguMetni } from "@/lib/mobilBicim";
import { odemeDurumuMu } from "@/lib/mobilAdminBicim";
import { odemeBildirimleriGetir } from "@/lib/mobilAdmin";
import { adminKapisi, hataYaniti, jsonYanit, sunucuHatasi } from "@/lib/mobilKapi";

// Web /admin/odeme-bildirimleri ile aynı sorgu: en çok 200, bekleyenler önce
export async function GET(req: NextRequest) {
  try {
    const k = await adminKapisi();
    if ("yanit" in k) return k.yanit;
    const durum = sorguMetni(req.nextUrl.searchParams, "durum");
    if (durum !== null && !odemeDurumuMu(durum)) return hataYaniti("Geçersiz durum.", 400, "GECERSIZ_ALAN");
    return jsonYanit({ kayitlar: await odemeBildirimleriGetir(durum) });
  } catch (err) {
    return sunucuHatasi(err);
  }
}
