import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const secretKey = process.env.SESSION_SECRET!;
const key = new TextEncoder().encode(secretKey);
const COOKIE_NAME = "kira_session";

const PROTECTED_CUSTOMER_PATHS = ["/dashboard"];
const PROTECTED_ADMIN_PATHS = ["/admin"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isCustomerPath = PROTECTED_CUSTOMER_PATHS.some((p) => pathname.startsWith(p));
  const isAdminPath = PROTECTED_ADMIN_PATHS.some((p) => pathname.startsWith(p));

  if (!isCustomerPath && !isAdminPath) {
    return NextResponse.next();
  }

  const token = req.cookies.get(COOKIE_NAME)?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  try {
    const { payload } = await jwtVerify(token, key);
    const role = payload.role as string;

    if (isAdminPath && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL("/login", req.url));
  }
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
};