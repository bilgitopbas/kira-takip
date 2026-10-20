// Kiracının "Toplam Borç"u — kiracı detayındaki "Toplam Fark Borç (Tüm
// Yıllar)" ile AYNI hesap: vadesi gelmemiş ve hiç ödenmemiş ("Bekliyor")
// borçlar hariç, tüm borçların tutarı eksi bu borçlara yapılan ödemeler.
// Artı = borçlu, eksi = fazla ödeme, 0 = fark yok.
//
// Saf hesap (toplamFarkBorc) detay sayfasında; aynı kuralın toplu sorgu
// karşılığı (toplamBorclar) klasik kiracı listesi ve yeni panel kartında
// kullanılır. Böylece üç yer de aynı değeri gösterir.
import type { PrismaClient } from "@/app/generated/prisma";
import { getEffectiveDebtStatus, getTotalPaid } from "@/lib/debtStatus";

type Tutar = number | string | { toString(): string };

export function toplamFarkBorc(borclar: { amount: Tutar; dueDate: Date | string; payments?: { amount: Tutar }[] }[]): number {
  const vadesiGelen = borclar.filter((d) => getEffectiveDebtStatus(d) !== "PENDING");
  const tutar = vadesiGelen.reduce((t, d) => t + Number(d.amount), 0);
  const odenen = vadesiGelen.reduce((t, d) => t + getTotalPaid(d.payments), 0);
  return Math.round((tutar - odenen) * 100) / 100;
}

/**
 * Bugünün başı (00:00). getEffectiveDebtStatus ile aynı: çalıştığı makinenin
 * yerel saatine göre. Sunucuda Türkiye saati için Europe/Istanbul gün başı
 * verilir (detay sayfası tarayıcıda Türkiye saatiyle hesaplar).
 */
export function bugunBasi(simdi: Date = new Date()): Date {
  const p = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul", year: "numeric", month: "2-digit", day: "2-digit" }).format(simdi);
  const [y, a, g] = p.split("-").map(Number);
  // Türkiye 2016'dan beri sabit UTC+3
  return new Date(Date.UTC(y, a - 1, g) - 3 * 60 * 60 * 1000);
}

/**
 * Birden çok kiracının toplam borcu, iki toplu sorguyla (N+1 yok):
 * "Bekliyor" olmayan borç = vadesi geçmiş YA DA en az bir artı ödemesi olan.
 */
export async function toplamBorclar(
  prisma: Pick<PrismaClient, "debt" | "payment">,
  kiraciIdleri: string[],
  simdi: Date = new Date()
): Promise<Map<string, number>> {
  const sonuc = new Map<string, number>();
  const idler = [...new Set(kiraciIdleri)];
  if (idler.length === 0) return sonuc;
  const bugun = bugunBasi(simdi);
  const vadesiGelen = { OR: [{ dueDate: { lt: bugun } }, { payments: { some: { amount: { gt: 0 } } } }] };

  const [borclar, odemeler] = await Promise.all([
    prisma.debt.groupBy({
      by: ["tenantId"],
      where: { tenantId: { in: idler }, ...vadesiGelen },
      _sum: { amount: true },
    }),
    prisma.payment.groupBy({
      by: ["tenantId"],
      where: { debt: { is: { tenantId: { in: idler }, ...vadesiGelen } } },
      _sum: { amount: true },
    }),
  ]);
  for (const b of borclar) sonuc.set(b.tenantId, Number(b._sum.amount ?? 0));
  for (const o of odemeler) sonuc.set(o.tenantId, (sonuc.get(o.tenantId) ?? 0) - Number(o._sum.amount ?? 0));
  for (const [k, v] of sonuc) sonuc.set(k, Math.round(v * 100) / 100);
  return sonuc;
}

/** Kartlardaki gösterim: borç varsa kırmızı, fazla ödeme yeşil, yoksa "Borç yok" */
export function borcGorunumu(tutar: number): { metin: string; sinif: string } {
  if (tutar > 0) return { metin: `${tutar.toLocaleString("tr-TR")} ₺`, sinif: "bg-red-50 text-red-600" };
  if (tutar < 0) return { metin: `Fazla ödeme +${Math.abs(tutar).toLocaleString("tr-TR")} ₺`, sinif: "bg-emerald-50 text-emerald-600" };
  return { metin: "Borç yok", sinif: "bg-emerald-50 text-emerald-700" };
}

/** Kira ödeme tarihi: detay sayfasıyla aynı biçim (gg.aa.yyyy, tr-TR) */
export function odemeTarihiMetni(tarih: Date | string | null | undefined): string | null {
  return tarih ? new Date(tarih).toLocaleDateString("tr-TR", { timeZone: "Europe/Istanbul" }) : null;
}
