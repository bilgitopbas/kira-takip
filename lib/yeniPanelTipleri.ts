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
  /** Kayıttaki il metni olduğu gibi (eşleme B aşamasında) */
  il: string;
  mulkSayisi: number;
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
  /** İli girilmemiş mülk sayısı */
  ilsizMulkSayisi: number;
};
