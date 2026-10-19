// Türkiye'nin 81 ili (plaka kodu sırasıyla) ve serbest yazılmış il metnini
// bu listeye eşleme. Mülk kayıtlarındaki `city` alanı elle yazıldığı için
// "KONYA ", "konya", "K.Maraş" gibi biçimler görülür; kayıt DEĞİŞTİRİLMEZ,
// yalnız okurken eşlenir. Eşleşmeyen metin null döner (kullanıcı düzeltir).

export const ILLER = [
  "Adana", "Adıyaman", "Afyonkarahisar", "Ağrı", "Amasya", "Ankara", "Antalya", "Artvin",
  "Aydın", "Balıkesir", "Bilecik", "Bingöl", "Bitlis", "Bolu", "Burdur", "Bursa",
  "Çanakkale", "Çankırı", "Çorum", "Denizli", "Diyarbakır", "Edirne", "Elazığ", "Erzincan",
  "Erzurum", "Eskişehir", "Gaziantep", "Giresun", "Gümüşhane", "Hakkari", "Hatay", "Isparta",
  "Mersin", "İstanbul", "İzmir", "Kars", "Kastamonu", "Kayseri", "Kırklareli", "Kırşehir",
  "Kocaeli", "Konya", "Kütahya", "Malatya", "Manisa", "Kahramanmaraş", "Mardin", "Muğla",
  "Muş", "Nevşehir", "Niğde", "Ordu", "Rize", "Sakarya", "Samsun", "Siirt",
  "Sinop", "Sivas", "Tekirdağ", "Tokat", "Trabzon", "Tunceli", "Şanlıurfa", "Uşak",
  "Van", "Yozgat", "Zonguldak", "Aksaray", "Bayburt", "Karaman", "Kırıkkale", "Batman",
  "Şırnak", "Bartın", "Ardahan", "Iğdır", "Yalova", "Karabük", "Kilis", "Osmaniye",
  "Düzce",
] as const;

export type Il = (typeof ILLER)[number];

/** Plaka kodu (1-81) */
export function plakaKodu(il: Il): number {
  return ILLER.indexOf(il) + 1;
}

/**
 * Karşılaştırma anahtarı: Türkçe-duyarlı küçük harf, Türkçe harfler ASCII'ye
 * katlanır, harf/rakam dışı her şey atılır. "İSTANBUL", "istanbul",
 * "Istanbul" ve "İstanbul " aynı anahtarı verir.
 */
export function katla(metin: string): string {
  return metin
    .toLocaleLowerCase("tr-TR")
    .replace(/ç/g, "c")
    .replace(/ğ/g, "g")
    .replace(/ı/g, "i")
    .replace(/i̇/g, "i")
    .replace(/ö/g, "o")
    .replace(/ş/g, "s")
    .replace(/ü/g, "u")
    .replace(/[âà]/g, "a")
    .replace(/[îì]/g, "i")
    .replace(/[ûù]/g, "u")
    .replace(/[^a-z0-9]/g, "");
}

// Yaygın kısaltma ve eski adlar
const TAKMA_ADLAR: Record<string, Il> = {
  afyon: "Afyonkarahisar",
  maras: "Kahramanmaraş",
  kmaras: "Kahramanmaraş",
  urfa: "Şanlıurfa",
  surfa: "Şanlıurfa",
  icel: "Mersin",
  antep: "Gaziantep",
  gantep: "Gaziantep",
  hakkari: "Hakkari",
  dersim: "Tunceli",
};

const ANAHTARDAN_ILE = new Map<string, Il>(ILLER.map((il) => [katla(il), il]));

/**
 * Serbest il metnini 81 ilden birine eşler; eşleşmezse null.
 * "Konya / Selçuklu", "Selçuklu-Konya" gibi bileşik yazımlarda parçalar
 * tek tek denenir. İlçe adından il çıkarımı YAPILMAZ.
 */
export function ilCoz(metin: string | null | undefined): Il | null {
  if (!metin) return null;
  const tum = katla(metin);
  if (!tum) return null;
  const dogrudan = ANAHTARDAN_ILE.get(tum) ?? TAKMA_ADLAR[tum];
  if (dogrudan) return dogrudan;

  const parcalar = metin.split(/[\/,\-–()|]+|\s{2,}/).map(katla).filter(Boolean);
  if (parcalar.length > 1) {
    const bulunan = new Set<Il>();
    for (const p of parcalar) {
      const il = ANAHTARDAN_ILE.get(p) ?? TAKMA_ADLAR[p];
      if (il) bulunan.add(il);
    }
    // Yalnız tek bir il bulunduysa güvenle eşle
    if (bulunan.size === 1) return [...bulunan][0];
  }
  return null;
}
