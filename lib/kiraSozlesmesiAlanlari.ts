// Kira sözleşmesi şablonundaki {{...}} yer tutucularının form karşılıkları.
// Anahtarlar şablondaki adlarla BİREBİR aynı olmalı; değiştirilirse şablon
// doldurulamaz.

export type AlanTipi = "metin" | "uzunMetin" | "tarih" | "para" | "sayi";

export type Alan = {
  key: string;
  label: string;
  tip: AlanTipi;
  zorunlu?: boolean;
  ipucu?: string;
  genisMi?: boolean;
};

export type Bolum = {
  baslik: string;
  aciklama?: string;
  alanlar: Alan[];
};

export const SOZLESME_BOLUMLERI: Bolum[] = [
  {
    baslik: "Taşınmaz Bilgileri",
    alanlar: [
      {
        key: "Tasınmazadresi",
        label: "Kiralanan Taşınmazın Adresi",
        tip: "uzunMetin",
        zorunlu: true,
        genisMi: true,
      },
      {
        key: "Kiralananseyincinsi",
        label: "Kiralanan Şeyin Cinsi",
        tip: "metin",
        zorunlu: true,
        ipucu: "Örn. Mesken, İşyeri, Dükkan, Depo",
      },
      {
        key: "Kullanımamacı",
        label: "Kullanım Amacı",
        tip: "metin",
        zorunlu: true,
        ipucu: "Sözleşmede iki yerde geçer",
      },
    ],
  },
  {
    baslik: "Kiraya Veren",
    alanlar: [
      { key: "Kirayaverenadsoyad", label: "Adı Soyadı", tip: "metin", zorunlu: true },
      {
        key: "Kirayaverentckimlikno",
        label: "T.C. Kimlik No",
        tip: "metin",
        zorunlu: true,
      },
      {
        key: "Kirayaverenadresbilgileri",
        label: "Adresi",
        tip: "uzunMetin",
        zorunlu: true,
        genisMi: true,
      },
    ],
  },
  {
    baslik: "Kiracı",
    alanlar: [
      { key: "Kiracıadsoyad", label: "Adı Soyadı", tip: "metin", zorunlu: true },
      { key: "Kiracıtckimlikno", label: "T.C. Kimlik No", tip: "metin", zorunlu: true },
      {
        key: "Kiracıadresbilgileri",
        label: "İkametgâh Adresi",
        tip: "uzunMetin",
        zorunlu: true,
        genisMi: true,
      },
    ],
  },
  {
    baslik: "Kira Koşulları",
    alanlar: [
      { key: "Aylıkkirabedeli", label: "Bir Aylık Kira Bedeli", tip: "para", zorunlu: true },
      {
        key: "Yıllıkkirabedeli",
        label: "Bir Senelik Kira Bedeli",
        tip: "para",
        zorunlu: true,
        ipucu: "Aylık tutardan otomatik hesaplanır, değiştirebilirsiniz",
      },
      {
        key: "Kirasuresi",
        label: "Kira Müddeti",
        tip: "metin",
        zorunlu: true,
        ipucu: "Örn. 1 yıl",
      },
      { key: "Kirabaslangıctarihi", label: "Kiranın Başlangıcı", tip: "tarih", zorunlu: true },
      {
        key: "Odemesekli",
        label: "Ödeme Şekli",
        tip: "metin",
        zorunlu: true,
        ipucu: "Örn. Banka havalesi ile peşin",
      },
      {
        key: "Odemegunu",
        label: "Ödeme Günü",
        tip: "metin",
        zorunlu: true,
        ipucu: "Örn. Her ayın 5'i",
      },
      {
        key: "Artis_Bilgisi",
        label: "Kira Artış Bilgisi",
        tip: "metin",
        ipucu: "Örn. TÜFE 12 aylık ortalamasına göre",
      },
      { key: "Depozitotutarı", label: "Depozito Tutarı", tip: "para" },
      {
        key: "Demirbaslar",
        label: "Kiralananda Bulunan Demirbaşlar",
        tip: "uzunMetin",
        genisMi: true,
        ipucu: "Boş bırakılırsa sözleşmede boş görünür",
      },
    ],
  },
  {
    baslik: "Ödeme Yapılacak Banka Hesabı",
    alanlar: [
      { key: "Bankaadı", label: "Banka Adı", tip: "metin" },
      { key: "Bankasubesi", label: "Şube", tip: "metin" },
      { key: "Bankaıbanno", label: "IBAN", tip: "metin", genisMi: true },
    ],
  },
  {
    baslik: "Kefil",
    aciklama: "Sözleşmede kefil yoksa bu bölümü boş bırakabilirsiniz.",
    alanlar: [
      { key: "Kefiladsoyad", label: "Kefil Adı Soyadı", tip: "metin" },
      {
        key: "Kefilinsorumluolduguyıl",
        label: "Kefilin Sorumlu Olduğu Süre (yıl)",
        tip: "sayi",
      },
      {
        key: "Kefilinsorumluolduguaylıkkirabedeli",
        label: "Kefilin Sorumlu Olduğu Aylık Kira Sayısı",
        tip: "sayi",
        ipucu: "Örn. 12 yazarsanız 12 aylık kira bedeli ile sınırlı olur",
      },
    ],
  },
  {
    baslik: "Diğer",
    alanlar: [
      {
        key: "Yetkilikılınansehirmahkemesi",
        label: "Yetkili Mahkeme / İcra Dairesi (şehir)",
        tip: "metin",
        zorunlu: true,
        ipucu: "Örn. İstanbul",
      },
      { key: "Duzenlenmetarihi", label: "Düzenlenme Tarihi", tip: "tarih", zorunlu: true },
    ],
  },
];

export const TUM_ALANLAR: Alan[] = SOZLESME_BOLUMLERI.flatMap((b) => b.alanlar);
