import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { cache } from "react";
import { prisma } from "@/lib/prisma";

const secretKey = process.env.SESSION_SECRET!;
const key = new TextEncoder().encode(secretKey);
const COOKIE_NAME = "kira_session";

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

type SessionPayload = {
  userId: string;
  role: "ADMIN" | "CUSTOMER";
  impersonatedBy?: string;
  // "Kullanıcı Ekle" ile davet edilen bir ekip üyesi giriş yaptığında oturum
  // hesap sahibinin userId'siyle açılır (veriler ortaktır). Kimin işlem
  // yaptığını ayırt edebilmek için üyenin kendi kimliği ayrıca taşınır.
  memberId?: string;
  memberEmail?: string;
  memberName?: string;
};

// Jetonun içinde ayrıca taşınan oturum sürümü (users.sessionVersion).
// Bu alanın olmadığı eski jetonlar sürüm 0 kabul edilir.
type TokenPayload = SessionPayload & { sv?: number };

export async function createSession(payload: SessionPayload) {
  // Sürüm her zaman veritabanından okunur; çağıranın göndermesine gerek yok.
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { sessionVersion: true },
  });

  const tokenPayload: TokenPayload = { ...payload, sv: user?.sessionVersion ?? 0 };
  const token = await new SignJWT(tokenPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(key);

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 gün
  });
}

// Aynı istek içinde getSession birden çok kez çağrılırsa veritabanına bir kez gidilir.
const oturumHalaGecerli = cache(
  async (userId: string, sv: number, memberId: string | undefined): Promise<boolean> => {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { sessionVersion: true },
    });
    // Hesap silinmiş ya da parola değişmiş/sıfırlanmış → eski oturum geçersiz.
    if (!user || user.sessionVersion !== sv) return false;

    if (memberId) {
      // Ekip üyesi hesaptan çıkarıldıysa oturumu da hemen düşer.
      const member = await prisma.accountMember.findUnique({
        where: { id: memberId },
        select: { ownerId: true },
      });
      if (!member || member.ownerId !== userId) return false;
    }

    return true;
  }
);

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, key);
    const oturum = payload as unknown as TokenPayload;
    if (!(await oturumHalaGecerli(oturum.userId, oturum.sv ?? 0, oturum.memberId))) {
      return null;
    }
    return oturum;
  } catch {
    return null;
  }
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
