import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { VEKALET_YASAK_MESAJI, kullaniciTuru, mobilAdminMi, sozlesmeGerekli } from "@/lib/mobilBicim";

// app/api/mobil/* uçlarının ortak kapıları ve yanıtları. Kullanım:
//   const k = await panelKapisi(); if ("yanit" in k) return k.yanit; k.session ...

const GOVDE_SINIRI = 16 * 1024;
const OZEL = { "Cache-Control": "private, no-store" };

export const hataYaniti = (hata: string, durum: number, kod?: string) =>
  NextResponse.json({ hata, ...(kod ? { kod } : {}) }, { status: durum, headers: OZEL });

export const jsonYanit = (veri: unknown) => NextResponse.json(veri, { headers: OZEL });

export const sunucuHatasi = (err: unknown) => {
  console.error("Mobil API hatası:", err);
  return hataYaniti("Sunucu hatası.", 500, "SUNUCU_HATASI");
};

const YETKISIZ = () => hataYaniti("Yetkisiz.", 401, "YETKISIZ");
const VEKALET_YASAK = () => hataYaniti(VEKALET_YASAK_MESAJI, 403, "VEKALET_YASAK");

type Oturum = NonNullable<Awaited<ReturnType<typeof getSession>>>;
export type MobilOturumu = Oturum & { mobilOturumId: string };
type Kapi = { session: MobilOturumu } | { yanit: NextResponse };

// Yalnız mobil jetonla: çerezli web oturumu bu uçlara girmez
export async function mobilKapisi(): Promise<Kapi> {
  const session = await getSession();
  return session?.mobilOturumId ? { session: session as MobilOturumu } : { yanit: YETKISIZ() };
}

// Hesabın kendine ait işlemleri (cihaz, sözleşme onayı): yönetici müşteri panelindeyken kapalı
export async function kendiHesabiKapisi(): Promise<Kapi> {
  const k = await mobilKapisi();
  if ("yanit" in k) return k;
  return k.session.impersonatedBy ? { yanit: VEKALET_YASAK() } : k;
}

// Geri alınamaz işlemler: erişim jetonu çıkıştan birkaç dakika uzun yaşayabilir,
// oturum satırı da aranır
export async function canliOturumKapisi(): Promise<Kapi> {
  const k = await kendiHesabiKapisi();
  return "yanit" in k ? k : oturumSatiriKapisi(k.session);
}

async function oturumSatiriKapisi(session: MobilOturumu): Promise<Kapi> {
  const { mobilOturumId: id, userId } = session;
  const oturum = await prisma.mobilOturum.findFirst({ where: { id, userId }, select: { id: true } });
  return oturum ? { session } : { yanit: hataYaniti("Oturum geçersiz. Lütfen yeniden giriş yapın.", 401, "OTURUM_YOK") };
}

// Panel okumaları: onayı eksik sahibe veri verilmez, uygulama onay ekranına gider
export async function panelKapisi(): Promise<Kapi> {
  const k = await mobilKapisi();
  if ("yanit" in k) return k;
  const tur = kullaniciTuru(k.session.mobilRol ?? "CUSTOMER", k.session.memberId);
  // Yönetici onayı sahip adına veremez; web panelinde de vekalette sözleşme sorulmaz
  if (tur !== "SAHIP" || k.session.impersonatedBy) return k;
  const sahip = await prisma.user.findUnique({
    where: { id: k.session.userId },
    select: { termsAcceptedAt: true, marketingConsentAt: true },
  });
  if (!sahip) return { yanit: YETKISIZ() };
  if (sozlesmeGerekli(tur, sahip)) {
    return { yanit: hataYaniti("Sözleşme onayı gerekiyor.", 403, "SOZLESME_ONAYI_GEREK") };
  }
  return k;
}

// /api/mobil/admin/*: yalnız yöneticinin kendi oturumu (vekalet jetonu ve ekip üyesi değil).
// Yazan uçlar canli: true ile oturum satırını da arar. Abonelik ve sözleşme onayı aranmaz.
export async function adminKapisi({ canli = false } = {}): Promise<Kapi> {
  const k = await mobilKapisi();
  if ("yanit" in k) return k;
  const yetkiYok = { yanit: hataYaniti("Bu işlem için yönetici yetkisi gerekiyor.", 403, "YETKI_YOK") };
  if (!mobilAdminMi(k.session)) return yetkiYok;
  // Jetondaki rol 5 dk eskiyebilir: yetkisi alınan yönetici hemen düşer
  const kullanici = await prisma.user.findUnique({ where: { id: k.session.userId }, select: { role: true } });
  if (kullanici?.role !== "ADMIN") return yetkiYok;
  return canli ? oturumSatiriKapisi(k.session) : k;
}

// Bozuk JSON boş gövde sayılır; zorunlu alan denetimi uçta yapılır
export async function jsonGovde(req: Request): Promise<{ govde: Record<string, unknown> } | { yanit: NextResponse }> {
  const buyuk = () => ({ yanit: hataYaniti("İstek gövdesi çok büyük.", 413, "GOVDE_BUYUK") });
  if (Number(req.headers.get("content-length") ?? 0) > GOVDE_SINIRI) return buyuk();
  // Content-Length olmayabilir: sınır aşılınca okuma kesilir, gövde belleğe alınmaz
  const parcalar: Uint8Array[] = [];
  let boyut = 0;
  const okuyucu = req.body?.getReader();
  try {
    for (;;) {
      const { done, value } = okuyucu ? await okuyucu.read() : { done: true, value: undefined };
      if (done || !value) break;
      boyut += value.byteLength;
      if (boyut > GOVDE_SINIRI) {
        await okuyucu?.cancel();
        return buyuk();
      }
      parcalar.push(value);
    }
  } catch {
    return { govde: {} };
  }
  try {
    const g: unknown = JSON.parse(Buffer.concat(parcalar).toString("utf8"));
    return { govde: g && typeof g === "object" && !Array.isArray(g) ? (g as Record<string, unknown>) : {} };
  } catch {
    return { govde: {} };
  }
}
