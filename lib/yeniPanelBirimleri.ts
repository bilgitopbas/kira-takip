// Yeni panelin birim (mülk) listesi ve "Bugün" listeleri — sunucu tarafı.
//
// YETKİ: Tüm sorgular yalnız `ownerId` (oturumdaki session.userId; ekip
// üyesinde hesap sahibinin kimliği) ile süzülür — klasik panelle aynı kapsam.
// Bağlı mülkler (TenantProperty) üzerinden gelen kiracılarda da kiracının
// birincil mülkünün aynı sahibe ait olması ayrıca şart koşulur.
//
// VERİ AZALTMA: Kiracıdan yalnız ad, aylık kira, başlangıç, puan ve borç
// tutarları alınır. TC kimlik/vergi no, telefon, e-posta, adres SEÇİLMEZ.
import { prisma } from "@/lib/prisma";
import { binaAnahtariOlustur, binaCoz } from "@/lib/binaEslestir";
import { ilCoz } from "@/lib/iller";
import { birimDurumuHesapla } from "@/lib/birimDurumu";
import { getEffectiveDebtStatus } from "@/lib/debtStatus";
import type { BugunListeleri, BugunSatiri, PanelBirimi } from "@/lib/yeniPanelTipleri";

const GUN = 24 * 60 * 60 * 1000;
const VADE_UFKU_GUN = 14;
const SOZLESME_UFKU_GUN = 60;
const ARTIS_UFKU_GUN = 45;

function isoGun(d: Date | null | undefined): string | null {
  if (!d) return null;
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
}

function gunBasi(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

/** Tarihin bugünden sonraki ilk yıl dönümü (bugün dahil) */
function sonrakiYilDonumu(tarih: Date, bugun: Date): Date {
  const t = new Date(bugun.getFullYear(), tarih.getMonth(), tarih.getDate());
  if (t < gunBasi(bugun)) t.setFullYear(t.getFullYear() + 1);
  return t;
}

export async function panelBirimleriGetir(
  ownerId: string,
  bugun: Date = new Date()
): Promise<{ birimler: PanelBirimi[]; bugun: BugunListeleri }> {
  // Gecikmiş borçlar her yaştan olabilir; ödenmiş borçlardan yalnız bu ayı
  // kapsayabilecek olanlar gerekir (yıllık peşin için 12 ay geriye bakılır).
  const kapsamBaslangici = new Date(bugun.getFullYear(), bugun.getMonth() - 12, 1);
  const kiraciSecimi = {
    id: true,
    fullName: true,
    monthlyRent: true,
    contractStart: true,
    contractEnd: true,
    rentRevisionDate: true,
    rating: true,
    debts: {
      where: {
        OR: [{ status: { not: "PAID" as const }, dueDate: { lt: bugun } }, { dueDate: { gte: kapsamBaslangici } }],
      },
      select: {
        amount: true,
        dueDate: true,
        year: true,
        month: true,
        periodMonths: true,
        payments: { select: { amount: true } },
      },
    },
  };

  const mulkler = await prisma.property.findMany({
    where: { ownerId },
    select: {
      id: true,
      title: true,
      address: true,
      city: true,
      district: true,
      propertyType: true,
      isOccupied: true,
      block: true,
      unitNo: true,
      building: { select: { id: true, name: true, city: true, district: true, lat: true, lng: true, locationVerified: true } },
      tenants: {
        where: { occupancyStatus: "LIVING" },
        select: kiraciSecimi,
        orderBy: { createdAt: "asc" },
      },
      tenantLinks: {
        where: { tenant: { occupancyStatus: "LIVING", property: { ownerId } } },
        select: { tenant: { select: kiraciSecimi } },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const birimler: PanelBirimi[] = [];
  const vadesiGelenler: BugunSatiri[] = [];
  const sozlesmeYenilemeleri: BugunSatiri[] = [];
  const kiraArtislari: BugunSatiri[] = [];
  const bugunBasi = gunBasi(bugun);
  const gorulenKiraci = new Set<string>();

  // Kayıtlı binalar (il + ad anahtarıyla): bağlanmamış mülkün önerisi aynı
  // ildeki aynı adlı kayıtlı binaya denk gelirse o binada gösterilir.
  const kayitliAnahtarla = new Map<string, NonNullable<(typeof mulkler)[number]["building"]>>();
  for (const m of mulkler) {
    if (m.building) kayitliAnahtarla.set(binaAnahtariOlustur(m.building.city, m.building.name), m.building);
  }

  for (const m of mulkler) {
    // Birincil kiracılar + bağlı mülk üzerinden gelenler (tekrarsız)
    const kiracilar = [...m.tenants, ...m.tenantLinks.map((l) => l.tenant)].filter(
      (t, i, dizi) => dizi.findIndex((x) => x.id === t.id) === i
    );

    const durum = birimDurumuHesapla(kiracilar.map((t) => t.debts), bugun);
    const cozum = binaCoz(m);
    const ilk = kiracilar[0] ?? null;
    // Binalarım ekranında kaydedilmiş bina önerinin yerine geçer
    const kayitli = m.building ?? kayitliAnahtarla.get(cozum.binaAnahtari) ?? null;
    const bagli = !!m.building;
    const kayitliIl = kayitli ? ilCoz(kayitli.city) ?? cozum.il : cozum.il;

    birimler.push({
      id: m.id,
      title: m.title,
      address: m.address,
      city: m.city,
      propertyType: m.propertyType,
      isOccupied: m.isOccupied,
      // Kayıtlı binanın ilçesi, mülkün kendi ilçe metninin önüne geçer
      district: kayitli?.district ?? m.district,
      il: kayitliIl,
      bina: kayitli
        ? {
            anahtar: `b:${kayitli.id}`,
            ad: kayitli.name,
            // Bağlı mülkte kayıtlı blok/no; yalnız ad eşleşmesiyle gelende öneri
            blok: bagli ? m.block : cozum.blok,
            birimNo: bagli ? m.unitNo : cozum.birimNo,
            guven: bagli ? "yuksek" : cozum.guven,
            kaynak: "kayit",
            binaId: kayitli.id,
            konum:
              kayitli.lat !== null && kayitli.lng !== null
                ? { lat: kayitli.lat, lng: kayitli.lng, dogrulandi: kayitli.locationVerified }
                : null,
          }
        : {
            anahtar: cozum.binaAnahtari,
            ad: cozum.binaAdi,
            blok: cozum.blok,
            birimNo: cozum.birimNo,
            guven: cozum.guven,
            kaynak: cozum.kaynak,
            binaId: null,
            konum: null,
          },
      kiraci: ilk
        ? {
            id: ilk.id,
            fullName: ilk.fullName,
            monthlyRent: ilk.monthlyRent === null ? null : Number(ilk.monthlyRent),
            contractStart: isoGun(ilk.contractStart),
            rating: ilk.rating,
          }
        : null,
      oturanKiraciSayisi: kiracilar.length,
      durum: durum.durum,
      kiraGirilmemis: !!ilk && ilk.monthlyRent === null,
      borcKaydiYok: durum.borcKaydiYok,
      gecikmisBorc: durum.gecikmisBorc,
      gecikmeGun: durum.gecikmeGun,
      buAyVade: isoGun(durum.buAyVade),
    });

    // "Bugün" listeleri — bir kiracı birden çok mülke bağlıysa bir kez yazılır
    for (const t of kiracilar) {
      if (gorulenKiraci.has(t.id)) continue;
      gorulenKiraci.add(t.id);

      for (const b of t.debts) {
        const vade = gunBasi(new Date(b.dueDate));
        const fark = (vade.getTime() - bugunBasi.getTime()) / GUN;
        if (fark >= 0 && fark <= VADE_UFKU_GUN && getEffectiveDebtStatus(b) !== "PAID") {
          const odenen = b.payments.reduce((s, p) => s + Number(p.amount), 0);
          vadesiGelenler.push({
            birimId: m.id,
            tenantId: t.id,
            tenantName: t.fullName,
            propertyTitle: m.title,
            tarih: isoGun(vade)!,
            tutar: Math.max(0, Number(b.amount) - odenen),
          });
        }
      }

      if (t.contractEnd) {
        const fark = (gunBasi(t.contractEnd).getTime() - bugunBasi.getTime()) / GUN;
        if (fark >= 0 && fark <= SOZLESME_UFKU_GUN) {
          sozlesmeYenilemeleri.push({ birimId: m.id, tenantId: t.id, tenantName: t.fullName, propertyTitle: m.title, tarih: isoGun(t.contractEnd)! });
        }
      }

      if (t.rentRevisionDate) {
        const sonraki = sonrakiYilDonumu(new Date(t.rentRevisionDate), bugun);
        const fark = (sonraki.getTime() - bugunBasi.getTime()) / GUN;
        if (fark <= ARTIS_UFKU_GUN) {
          kiraArtislari.push({ birimId: m.id, tenantId: t.id, tenantName: t.fullName, propertyTitle: m.title, tarih: isoGun(sonraki)! });
        }
      }
    }
  }

  const tariheGore = (a: BugunSatiri, b: BugunSatiri) => a.tarih.localeCompare(b.tarih);
  return {
    birimler,
    bugun: {
      vadesiGelenler: vadesiGelenler.sort(tariheGore),
      sozlesmeYenilemeleri: sozlesmeYenilemeleri.sort(tariheGore),
      kiraArtislari: kiraArtislari.sort(tariheGore),
    },
  };
}
