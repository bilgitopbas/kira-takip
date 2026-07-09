import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getRentIncreaseRates } from "@/lib/rentIncrease";
import { getAccessStateForUser } from "@/lib/access";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
  }

  const access = await getAccessStateForUser(session.userId);
  if (!access || access.state === "LOCKED") {
    return NextResponse.json(
      { error: "Deneme ve ek süreniz sona erdi. Hesaplama yapabilmek için Mizan Pro'ya geçmeniz gerekiyor." },
      { status: 403 }
    );
  }

  const year = Number(req.nextUrl.searchParams.get("year"));
  const month = Number(req.nextUrl.searchParams.get("month"));

  if (!year || !month || month < 1 || month > 12) {
    return NextResponse.json({ error: "Geçerli bir yıl ve ay belirtin." }, { status: 400 });
  }

  const rates = await getRentIncreaseRates(year, month);
  return NextResponse.json(rates);
}
