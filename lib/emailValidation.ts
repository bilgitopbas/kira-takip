import dns from "dns/promises";

const EMAIL_FORMAT = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmailFormat(email: string): boolean {
  return EMAIL_FORMAT.test(email);
}

// E-posta adresinin alan adının gerçekten mail alabildiğini (MX kaydı var mı) kontrol eder.
// "gmial.com" gibi yazım hataları veya var olmayan alan adlarını yakalar.
// DNS sorgusu takılırsa kayıt akışını bloklamasın diye kısa bir zaman aşımıyla sarmalanır.
export async function domainAcceptsMail(email: string): Promise<boolean> {
  const domain = email.split("@")[1];
  if (!domain) return false;

  try {
    const records = await Promise.race([
      dns.resolveMx(domain),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timeout")), 4000)),
    ]);
    return records.length > 0;
  } catch {
    return false;
  }
}
