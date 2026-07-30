// Kira sözleşmesi şablonundaki {{...}} yer tutucularının form karşılıkları.
// Anahtarlar şablondaki adlarla BİREBİR aynı olmalı; değiştirilirse şablon
// doldurulamaz. (ArtisTipi, DepozitoTipi, OdemesekliOzel gibi anahtarlar
// şablonda yoktur — yalnızca formda kullanılıp sunucuda nihai metne çevrilir.)

export type AlanTipi =
  | "metin"
  | "uzunMetin"
  | "tarih"
  | "para"
  | "sayi"
  | "secim"
  | "iban";

export type Secenek = { deger: string; etiket: string };

export type Alan = {
  key: string;
  label: string;
  tip: AlanTipi;
  zorunlu?: boolean;
  ipucu?: string;
  /** Alanın altında sarı bilgi kutusu olarak gösterilir */
  not?: string;
  genisMi?: boolean;
  /** tip === "secim" için şıklar */
  secenekler?: Secenek[];
  /** Bu şık seçilince serbest metin kutusu açılır */
  serbestDeger?: string;
  /** Serbest metnin yazılacağı anahtar */
  serbestKey?: string;
  serbestEtiket?: string;
  /** Yalnızca bu koşul sağlanınca görünür */
  kosul?: { key: string; deger: string };
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
        ipucu: "Örn. Mesken, İşyeri, Dükkan, Depo, Fabrika",
      },
      {
        key: "Kullanımamacı",
        label: "Kullanım Amacı",
        tip: "metin",
        zorunlu: true,
        ipucu: "Örn. Mesken (konut), Ofis, Ticarethane, Depolama",
        not: "Sözleşmede iki yerde geçer. Kiracı burada yazan amaç dışında faaliyet gösteremez, bu yüzden mümkün olduğunca net yazın.",
      },
    ],
  },
  {
    baslik: "Kiraya Veren",
    alanlar: [
      { key: "Kirayaverenadsoyad", label: "Adı Soyadı", tip: "metin", zorunlu: true },
      { key: "Kirayaverentckimlikno", label: "T.C. Kimlik No", tip: "metin", zorunlu: true },
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
      { key: "Kirasuresi", label: "Kira Müddeti", tip: "metin", zorunlu: true, ipucu: "Örn. 1 yıl" },
      { key: "Kirabaslangıctarihi", label: "Kiranın Başlangıcı", tip: "tarih", zorunlu: true },
      {
        key: "Odemesekli",
        label: "Ödeme Şekli",
        tip: "secim",
        zorunlu: true,
        secenekler: [
          { deger: "Aylık peşin", etiket: "Aylık peşin" },
          { deger: "Yıllık peşin", etiket: "Yıllık peşin" },
          { deger: "OZEL", etiket: "Diğer" },
        ],
        serbestDeger: "OZEL",
        serbestKey: "OdemesekliOzel",
        serbestEtiket: "Ödeme şeklini yazın",
      },
      {
        key: "Odemegunu",
        label: "Ödeme Günü",
        tip: "metin",
        zorunlu: true,
        ipucu: "Örn. Her ayın 5'i",
      },
      {
        key: "ArtisTipi",
        label: "Kira Artış Bilgisi",
        tip: "secim",
        zorunlu: true,
        genisMi: true,
        secenekler: [
          { deger: "TUFE", etiket: "TÜFE (12 aylık ortalama)" },
          { deger: "TUFE_YIUFE", etiket: "TÜFE/2 + Yİ-ÜFE/2" },
          { deger: "OZEL", etiket: "Diğer (elle gir)" },
        ],
        serbestDeger: "OZEL",
        serbestKey: "Artis_Bilgisi",
        serbestEtiket: "Artış oranı",
        ipucu: "Sözleşmedeki ay, kira başlangıç tarihine göre otomatik yazılır",
        not: "Konut kiralarında artış oranı, TÜFE 12 aylık ortalamasını aşamaz (TBK m.344). TÜFE/2 + Yİ-ÜFE/2 seçilse dahi sonuç TÜFE'yi geçemez.",
      },
      {
        key: "DepozitoTipi",
        label: "Depozito",
        tip: "secim",
        zorunlu: true,
        genisMi: true,
        secenekler: [
          { deger: "KIRA", etiket: "Son güncel 1 aylık kira bedeli" },
          { deger: "TUTAR", etiket: "Belirli bir tutar" },
        ],
        not: "«Son güncel 1 aylık kira bedeli» seçerseniz, tahliyede o günkü güncel kira ne ise o iade edilir. Belirli bir tutar yazarsanız güncel kiraya bakılmaz, yalnızca yazdığınız rakam iade edilir.",
      },
      {
        key: "Depozitotutarı",
        label: "Depozito Tutarı",
        tip: "para",
        zorunlu: true,
        kosul: { key: "DepozitoTipi", deger: "TUTAR" },
      },
      {
        key: "Demirbaslar",
        label: "Kiralananda Bulunan Demirbaşlar",
        tip: "uzunMetin",
        genisMi: true,
        ipucu: "Örn. Kombi, ankastre set, klima. Boş bırakılabilir.",
      },
    ],
  },
  {
    baslik: "Ödeme Yapılacak Banka Hesabı",
    alanlar: [
      { key: "Bankaadı", label: "Banka Adı", tip: "metin" },
      { key: "Bankasubesi", label: "Şube", tip: "metin" },
      {
        key: "Bankaıbanno",
        label: "IBAN",
        tip: "iban",
        genisMi: true,
        ipucu: "Başındaki TR otomatik eklenir, kalan 24 haneyi yazın",
      },
    ],
  },
  {
    baslik: "Kefil",
    alanlar: [
      {
        key: "Kefilvar",
        label: "Sözleşmede kefil var mı?",
        tip: "secim",
        zorunlu: true,
        genisMi: true,
        secenekler: [
          { deger: "VAR", etiket: "Kefil var" },
          { deger: "YOK", etiket: "Kefil yok" },
        ],
        ipucu: "«Kefil yok» seçilirse kefille ilgili madde sözleşmeden tamamen çıkarılır",
      },
      {
        key: "Kefiladsoyad",
        label: "Kefil Adı Soyadı",
        tip: "metin",
        zorunlu: true,
        kosul: { key: "Kefilvar", deger: "VAR" },
      },
      {
        key: "Kefilinsorumluolduguyıl",
        label: "Kefilin Sorumlu Olduğu Süre (yıl)",
        tip: "sayi",
        zorunlu: true,
        kosul: { key: "Kefilvar", deger: "VAR" },
      },
      {
        key: "Kefilinsorumluoldugututar",
        label: "Kefilin Sorumlu Olduğu Azami Tutar",
        tip: "para",
        zorunlu: true,
        genisMi: true,
        kosul: { key: "Kefilvar", deger: "VAR" },
        not: "Türk Borçlar Kanunu'na göre bu tutarın ve diğer zorunlu unsurların mutlaka kefilin kendi el yazısıyla sözleşmeye yazılması şarttır. Aksi hâlde kefalet geçersizdir.",
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

/** Koşullu bir alan, o anki değerlere göre görünür mü? */
export function alanGorunurMu(alan: Alan, degerler: Record<string, string>) {
  if (!alan.kosul) return true;
  return degerler[alan.kosul.key] === alan.kosul.deger;
}
