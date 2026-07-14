import dns from "dns/promises";

const EMAIL_FORMAT = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmailFormat(email: string): boolean {
  return EMAIL_FORMAT.test(email);
}

// E-posta adresinin alan adının gerçekten mail alabildiğini (MX kaydı var mı) kontrol eder.
// "gmial.com" gibi yazım hataları veya var olmayan alan adlarını yakalar.
// DNS sunucusundan kesin "böyle bir alan adı / MX kaydı yok" cevabı gelirse
// reddedilir; zaman aşımı veya geçici sunucu hatası gibi belirsiz durumlarda
// kullanıcıyı gereksiz yere bloklamamak için akışa izin verilir (fail-open).
export async function domainAcceptsMail(email: string): Promise<boolean> {
  const domain = email.split("@")[1];
  if (!domain) return false;

  try {
    const records = await Promise.race([
      dns.resolveMx(domain),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timeout")), 8000)),
    ]);
    return records.length > 0;
  } catch (err) {
    const code = (err as NodeJS.ErrnoException)?.code;
    if (code === "ENOTFOUND" || code === "ENODATA") {
      // Alan adının hiç MX kaydı yok; A kaydına düşüp mail alabiliyor mu diye bak
      // (RFC 5321 fallback) — yoksa gerçekten geçersiz bir alan adıdır.
      try {
        const addresses = await dns.resolve4(domain);
        return addresses.length > 0;
      } catch {
        return false;
      }
    }
    // Zaman aşımı, SERVFAIL, ağ hatası vb. — kayıt akışını bloklama.
    return true;
  }
}
