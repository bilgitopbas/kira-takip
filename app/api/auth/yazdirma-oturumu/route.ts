import { NextRequest, NextResponse } from "next/server";
import { createSession } from "@/lib/auth";
import { resolveAppUrl } from "@/lib/url";
import { yazdirmaJetonuTuket } from "@/lib/yazdirmaJetonu";

// Cihazın gerçek tarayıcısı bu adresi açar. Jeton tek kullanımlıktır;
// tüketilir, o tarayıcıda oturum açılır ve rapor sayfasına yönlendirilir.
// Hedef yol jetonun içinden gelir, URL'den değil — açık yönlendirme yok.
export async function GET(req: NextRequest) {
  const jeton = req.nextUrl.searchParams.get("t");
  const kayit = yazdirmaJetonuTuket(jeton);
  const taban = resolveAppUrl(req);

  if (!kayit) {
    return NextResponse.redirect(`${taban}/login?yazdirma=suresi-doldu`);
  }

  await createSession({
    userId: kayit.userId,
    role: kayit.role,
    memberId: kayit.memberId,
    memberEmail: kayit.memberEmail,
    memberName: kayit.memberName,
  });

  return NextResponse.redirect(`${taban}${kayit.yol}`);
}
