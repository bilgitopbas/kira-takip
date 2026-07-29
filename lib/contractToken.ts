import { SignJWT, jwtVerify } from "jose";

// Mobil uygulamada sözleşme bağlantısı Safari'de açılıyor; Safari'nin
// uygulamanın oturum çerezi olmadığı için istek yetkisiz kalıyordu.
// Bu yüzden kiracı verisiyle birlikte, yalnızca O kiracının sözleşmesini
// açmaya yarayan, kısa ömürlü ve imzalı bir jeton gönderiliyor.
// Sunucuda saklama gerektirmez (imza doğrulaması yeterli).

const key = new TextEncoder().encode(process.env.SESSION_SECRET!);
const AMAC = "contract-access";

export async function createContractToken(tenantId: string) {
  return new SignJWT({ tenantId, purpose: AMAC })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30m")
    .sign(key);
}

export async function verifyContractToken(token: string, tenantId: string) {
  try {
    const { payload } = await jwtVerify(token, key);
    return payload.purpose === AMAC && payload.tenantId === tenantId;
  } catch {
    return false;
  }
}
