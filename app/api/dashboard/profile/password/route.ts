import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, createSession } from "@/lib/auth";
import { verifyPassword, hashPassword } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
  }

  // Ekip üyesinin oturumu hesap sahibinin userId'sini taşır; bu uç sahibin
  // parolasını değiştirir. Üye, sahibin parolasını değiştirememeli.
  if (session.memberId) {
    return NextResponse.json(
      { error: "Şifre değişikliğini yalnızca hesap sahibi yapabilir." },
      { status: 403 }
    );
  }

  const { currentPassword, newPassword } = await req.json();

  if (!newPassword) {
    return NextResponse.json({ error: "Yeni şifre zorunludur." }, { status: 400 });
  }

  if (newPassword.length < 6) {
    return NextResponse.json({ error: "Yeni şifre en az 6 karakter olmalıdır." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) {
    return NextResponse.json({ error: "Kullanıcı bulunamadı." }, { status: 404 });
  }

  if (user.passwordHash) {
    if (!currentPassword) {
      return NextResponse.json({ error: "Mevcut şifre zorunludur." }, { status: 400 });
    }
    const valid = await verifyPassword(currentPassword, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Mevcut şifre hatalı." }, { status: 400 });
    }
  }

  const passwordHash = await hashPassword(newPassword);
  // Oturum sürümünü artır: diğer cihazlardaki açık oturumlar kapanır.
  await prisma.user.update({
    where: { id: session.userId },
    data: { passwordHash, sessionVersion: { increment: 1 } },
  });

  // Şifreyi değiştiren bu cihaz oturumda kalsın: yeni sürümle oturumu yenile.
  await createSession({
    userId: session.userId,
    role: session.role,
    impersonatedBy: session.impersonatedBy,
  });

  return NextResponse.json({ success: true });
}
