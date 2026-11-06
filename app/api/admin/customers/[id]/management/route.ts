import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { yonetimTercihiDegistir } from "@/lib/adminIslemleri";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  const { id } = await params;
  const { wantsManagement } = await req.json();

  const user = await yonetimTercihiDegistir(id, Boolean(wantsManagement));

  return NextResponse.json({ success: true, wantsManagement: user.wantsManagement });
}