import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { mulkLimitiBelirle } from "@/lib/adminIslemleri";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 403 });
  }

  const { id } = await params;
  const { propertyCount } = await req.json();
  const count = Number(propertyCount);

  if (!count || count < 1) {
    return NextResponse.json({ error: "Geçerli bir mülk sayısı girin." }, { status: 400 });
  }

  const subscription = await mulkLimitiBelirle(id, count);

  return NextResponse.json({ success: true, subscription });
}
