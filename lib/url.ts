import { NextRequest } from "next/server";

export function resolveAppUrl(req: NextRequest) {
  return process.env.APP_URL?.replace(/\/$/, "") || req.nextUrl.origin;
}
