import { createHash, hkdfSync, randomBytes } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";

// Mobil uygulama jetonları. Veritabanına bakmaz; lib/auth.ts ve testler kullanır.
//
// Erişim jetonu: 5 dk geçerli JWT. Yenileme jetonu: rastgele 256 bit; veritabanında
// yalnız özeti durur. Anahtar SESSION_SECRET'tan türetilir: yeni ortam değişkeni
// gerekmez, ama web çerezi ile mobil jeton birbirinin yerine geçemez.

export const ERISIM_SURESI_SN = 5 * 60;
// Yöneticinin müşteri paneline girme jetonu: yenilenmez, süre dolunca uygulama admin paneline döner
export const VEKALET_SURESI_SN = 30 * 60;
export const YENILEME_SURESI_MS = 60 * 24 * 60 * 60 * 1000;
const JETON_TURU = "mobil-erisim";
const TURETME_ETIKETI = "mizan-mobil-erisim-v1";

export type MobilJetonIcerigi = {
  userId: string;
  role: "ADMIN" | "CUSTOMER";
  sv: number;
  oturumId: string;
  memberId?: string;
  memberEmail?: string;
  memberName?: string;
  // Yalnız vekalet jetonunda: paneline girilen hesabı açan yöneticinin userId'si.
  // oturumId o zaman yöneticinin mobil oturumudur.
  impersonatedBy?: string;
};

let onbellek: { gizli: string; anahtar: Uint8Array } | null = null;
function imzaAnahtari(): Uint8Array {
  const gizli = process.env.SESSION_SECRET;
  if (!gizli) throw new Error("SESSION_SECRET tanımlı değil");
  if (onbellek?.gizli !== gizli) {
    onbellek = { gizli, anahtar: new Uint8Array(hkdfSync("sha256", gizli, "", TURETME_ETIKETI, 32)) };
  }
  return onbellek.anahtar;
}

export async function erisimJetonuUret(icerik: MobilJetonIcerigi, simdi = Date.now(), sureSn = ERISIM_SURESI_SN) {
  const iat = Math.floor(simdi / 1000);
  const jeton = await new SignJWT({ tur: JETON_TURU, ...icerik })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt(iat)
    .setExpirationTime(iat + sureSn)
    .sign(imzaAnahtari());
  return { jeton, bitis: new Date((iat + sureSn) * 1000) };
}

/** Geçersiz, süresi dolmuş ya da başka türden (ör. web çerezi) jetonda null */
export async function erisimJetonuCoz(jeton: string | null, simdi = Date.now()): Promise<MobilJetonIcerigi | null> {
  if (!jeton || jeton.length > 4096) return null;
  try {
    const { payload: y } = await jwtVerify(jeton, imzaAnahtari(), {
      algorithms: ["HS256"],
      currentDate: new Date(simdi),
    });
    if (
      y.tur !== JETON_TURU ||
      typeof y.userId !== "string" ||
      (y.role !== "ADMIN" && y.role !== "CUSTOMER") ||
      typeof y.sv !== "number" ||
      typeof y.oturumId !== "string"
    ) {
      return null;
    }
    return {
      userId: y.userId,
      role: y.role,
      sv: y.sv,
      oturumId: y.oturumId,
      ...(typeof y.memberId === "string" ? { memberId: y.memberId } : {}),
      ...(typeof y.memberEmail === "string" ? { memberEmail: y.memberEmail } : {}),
      ...(typeof y.memberName === "string" ? { memberName: y.memberName } : {}),
      ...(typeof y.impersonatedBy === "string" ? { impersonatedBy: y.impersonatedBy } : {}),
    };
  } catch {
    return null;
  }
}

/** "Bearer x" → "x". Başka şema ya da boş başlıkta null */
export function bearerAyikla(yetkiBasligi: string | null | undefined): string | null {
  if (!yetkiBasligi || !yetkiBasligi.startsWith("Bearer ")) return null;
  return yetkiBasligi.slice(7).trim() || null;
}

export const yenilemeJetonuUret = () => randomBytes(32).toString("base64url");
export const jetonOzeti = (jeton: string) => createHash("sha256").update(jeton).digest("hex");
