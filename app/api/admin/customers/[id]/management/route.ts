import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

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

  const user = await prisma.user.update({
    where: { id },
    data: { wantsManagement: Boolean(wantsManagement) },
  });

  return NextResponse.json({ success: true, wantsManagement: user.wantsManagement });
}