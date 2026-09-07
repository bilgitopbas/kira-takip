import { randomBytes } from "crypto";

// Uygulama içindeki WebView `window.print()` desteklemiyor (iOS'ta hiç, Android
// WebView'da da güvenilir değil). Çözüm: raporu cihazın gerçek tarayıcısında
// açmak. Ancak tarayıcının kendi çerez deposu ayrı olduğu için oturum oradan
// görünmüyor — bu yüzden tek kullanımlık, kısa ömürlü bir devretme jetonu
// üretiliyor.
//
// Güvenlik notları:
//  - Jeton TEK KULLANIMLIK; okunduğu anda siliniyor.
//  - 10 dakika sonra kendiliğinden geçersiz.
//  - Hedef yol jetonun İÇİNDE saklanıyor, URL'den gelmiyor; böylece açık
//    yönlendirme (open redirect) mümkün değil.
//  - Jeton yalnızca zaten giriş yapmış kullanıcının kendi oturumunu kendi
//    tarayıcısına taşır; yetki yükseltmesi yoktur.

const TTL_MS = 10 * 60 * 1000;

type Kayit = {
  userId: string;
  role: "ADMIN" | "CUSTOMER";
  memberId?: string;
  memberEmail?: string;
  memberName?: string;
  yol: string;
  sonKullanma: number;
};

const jetonlar = new Map<string, Kayit>();

/** Yalnızca uygulama içi göreli yollara izin verilir. */
export function guvenliYolMu(yol: unknown): yol is string {
  return (
    typeof yol === "string" &&
    yol.startsWith("/") &&
    !yol.startsWith("//") &&
    !yol.includes("\\") &&
    yol.length <= 300
  );
}

export function yazdirmaJetonuOlustur(kayit: Omit<Kayit, "sonKullanma">): string {
  const jeton = randomBytes(24).toString("hex");
  jetonlar.set(jeton, { ...kayit, sonKullanma: Date.now() + TTL_MS });
  return jeton;
}

export function yazdirmaJetonuTuket(jeton: string | null): Kayit | null {
  if (!jeton) return null;
  const kayit = jetonlar.get(jeton);
  jetonlar.delete(jeton); // tek kullanımlık
  if (!kayit || Date.now() > kayit.sonKullanma) return null;
  return kayit;
}

// Süresi geçmiş jetonları periyodik temizle (bellekte birikmesin)
setInterval(() => {
  const simdi = Date.now();
  for (const [jeton, kayit] of jetonlar) {
    if (simdi > kayit.sonKullanma) jetonlar.delete(jeton);
  }
}, TTL_MS).unref?.();
