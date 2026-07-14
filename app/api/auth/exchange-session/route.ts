import { NextRequest, NextResponse } from "next/server";
import { createSession } from "@/lib/auth";
import { consumeSessionExchangeToken } from "@/lib/googleOAuthState";

// Native Google OAuth akışının son adımı: uygulama, özel URL şemasıyla aldığı
// tek kullanımlık jetonu KENDİ WebView'ından burava gönderir; bu istek
// WebView'ın kendi fetch'i olduğu için Set-Cookie burada doğru cookie
// deposuna (uygulamanın kendisine) yazılır.
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  const entry = consumeSessionExchangeToken(token);

  if (!entry) {
    return NextResponse.json({ error: "Geçersiz veya süresi dolmuş oturum jetonu." }, { status: 400 });
  }

  await createSession({ userId: entry.userId, role: entry.role });
  return NextResponse.json({ success: true });
}
