// Abonelik paketleri (SubscriptionStatus). Saf: istemci ve testler de kullanabilir.
export const PAKETLER = ["TRIAL", "ACTIVE", "DANISMAN", "PASSIVE"] as const;
export type Paket = (typeof PAKETLER)[number];
export const paketMi = (d: unknown): d is Paket => PAKETLER.includes(d as Paket);
