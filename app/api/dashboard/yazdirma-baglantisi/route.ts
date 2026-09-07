import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { resolveAppUrl } from "@/lib/url";
import { guvenliYolMu, yazdirmaJetonuOlustur } from "@/lib/yazdirmaJetonu";

// Uygulama, raporu cihazın gerçek tarayıcısında açabilmek için buradan
// tek kullanımlık bir bağlantı alır. İstek uygulamanın KENDİ WebView'ından
// gelir, yani oturum çerezi burada geçerlidir.
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Oturum bulunamadı." }, { status: 401 });
  }

  let govde: { yol?: unknown };
  try {
    govde = await req.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  if (!guvenliYolMu(govde.yol)) {
    return NextResponse.json({ error: "Geçersiz sayfa adresi." }, { status: 400 });
  }

  const jeton = yazdirmaJetonuOlustur({
    userId: session.userId,
    role: session.role,
    memberId: session.memberId,
    memberEmail: session.memberEmail,
    memberName: session.memberName,
    yol: govde.yol,
  });

  const taban = resolveAppUrl(req);
  return NextResponse.json({ url: `${taban}/api/auth/yazdirma-oturumu?t=${jeton}` });
}
