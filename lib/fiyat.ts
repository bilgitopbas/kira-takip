// Fiyat sabitleri — hiçbir şey import etmez, böylece hem sunucu hem istemci
// tarafından güvenle kullanılabilir. (lib/access.ts Prisma'ya bağlı olduğu
// için istemci bileşenlerinden import edilemez.)

export const PRICE_PER_PROPERTY = 75;

export function calculatePlanPrice(propertyCount: number) {
  return propertyCount * PRICE_PER_PROPERTY;
}
