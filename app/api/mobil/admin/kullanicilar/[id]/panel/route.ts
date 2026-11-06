import { adminKapisi, hataYaniti, jsonYanit, sunucuHatasi } from "@/lib/mobilKapi";
import { vekaletAc } from "@/lib/mobilOturum";

type Baglam = { params: Promise<{ id: string }> };

// Mizan Danışman müşterinin paneline gir: 30 dk'lık, yenilenmeyen erişim jetonu.
// Bu jetonla hesap ayarları (VEKALET_YASAK) ve yönetim uçları (YETKI_YOK) kapalıdır.
export async function POST(_req: Request, { params }: Baglam) {
  try {
    const k = await adminKapisi({ canli: true });
    if ("yanit" in k) return k.yanit;
    const { id } = await params;
    const s = await vekaletAc(k.session.userId, k.session.mobilOturumId, id);
    if ("hata" in s) {
      return s.hata === "KULLANICI_YOK"
        ? hataYaniti("Kullanıcı bulunamadı.", 404, "KULLANICI_YOK")
        : hataYaniti("Yalnız Mizan Danışman paketli kullanıcıların paneline girilebilir.", 403, "YALNIZ_DANISMAN");
    }
    return jsonYanit(s.tamam);
  } catch (err) {
    return sunucuHatasi(err);
  }
}
