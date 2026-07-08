import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getRentIncreaseRates } from "@/lib/rentIncrease";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
  }

  const year = Number(req.nextUrl.searchParams.get("year"));
  const month = Number(req.nextUrl.searchParams.get("month"));

  if (!year || !month || month < 1 || month > 12) {
    return NextResponse.json({ error: "Geçerli bir yıl ve ay belirtin." }, { status: 400 });
  }

  const rates = await getRentIncreaseRates(year, month);
  return NextResponse.json(rates);
}
