import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  const requests = await prisma.contactRequest.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ requests });
}