// Yeni panelin istemciye giden veri biçimi. Bu dosya Prisma'yı içe aktarmaz;
// istemci bileşenleri güvenle kullanabilir.

export type GecikenBorc = {
  id: string;
  tenantId: string;
  tenantName: string;
  propertyTitle: string;
  year: number;
  month: number;
  remaining: number;
};

export type IlOzeti = {
  /** 81 ilden biri (lib/iller.ts) */
  il: string;
  mulkSayisi: number;
};

/**
 * Birim (= mülk) durumu. Kural (Lider/kullanıcı onayı, 19 Eki 2026):
 *  - bos:      oturan (LIVING) kiracı yok
 *  - gecikmis: vadesi geçmiş, tamamı ödenmemiş herhangi bir borç var
 *  - odendi:   bu ayı kapsayan borç tamamen ödendi
 *  - bekliyor: bu ayı kapsayan borç kısmen ödendi ya da vadesi gelmedi;
 *              bu ay için hiç borç kaydı yoksa da "bekliyor" (borcKaydiYok=true)
 * "Kira girilmemiş" (monthlyRent boş) ayrı bir etikettir; durumu değiştirmez.
 */
export type BirimDurumu = "odendi" | "bekliyor" | "gecikmis" | "bos";

export type PanelKiracisi = {
  id: string;
  fullName: string;
  monthlyRent: number | null;
  /** ISO tarih (yyyy-mm-dd) */
  contractStart: string | null;
  rating: number | null;
};

export type PanelBirimi = {
  id: string;
  title: string;
  address: string;
  city: string | null;
  district: string | null;
  propertyType: string | null;
  isOccupied: boolean;
  /** 81 ilden eşlenen il; eşleşmezse null */
  il: string | null;
  bina: {
    anahtar: string;
    ad: string;
    blok: string | null;
    birimNo: string | null;
    guven: "yuksek" | "dusuk";
    kaynak: "baslik" | "adres" | "yok";
  };
  /** Oturan kiracı (birden fazlaysa ilki); yoksa null */
  kiraci: PanelKiracisi | null;
  oturanKiraciSayisi: number;
  durum: BirimDurumu;
  kiraGirilmemis: boolean;
  borcKaydiYok: boolean;
  /** Vadesi geçmiş, ödenmemiş toplam */
  gecikmisBorc: number;
  /** En eski gecikmiş borcun üzerinden geçen gün */
  gecikmeGun: number;
  /** Bu ayın borcunun vadesi (yyyy-mm-dd), varsa */
  buAyVade: string | null;
};

export type BugunSatiri = {
  birimId: string;
  tenantId: string;
  tenantName: string;
  propertyTitle: string;
  /** yyyy-mm-dd */
  tarih: string;
  tutar?: number;
};

export type BugunListeleri = {
  vadesiGelenler: BugunSatiri[];
  sozlesmeYenilemeleri: BugunSatiri[];
  kiraArtislari: BugunSatiri[];
};

export type PanelOzeti = {
  mulkSayisi: number;
  doluSayisi: number;
  bosSayisi: number;
  kiraciSayisi: number;
  buAyTahsilat: number;
  buYilTahsilat: number;
  /** Bu ayın borcuna göre tahsilat yüzdesi; bu ay borç yoksa null */
  tahsilatOrani: number | null;
  gecikmisSayisi: number;
  gecikmisTutar: number;
  gecikenler: GecikenBorc[];
  mulkTipleri: { label: string; value: number }[];
  iller: IlOzeti[];
  /** İli girilmemiş ya da 81 ilden birine eşlenemeyen mülk sayısı */
  ilsizMulkSayisi: number;
};
