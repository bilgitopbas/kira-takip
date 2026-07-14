import { NextRequest, NextResponse } from "next/server";
import { resolveAppUrl } from "@/lib/url";
import { createOAuthState } from "@/lib/googleOAuthState";

export async function GET(req: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: "Google girişi henüz yapılandırılmadı." }, { status: 500 });
  }

  const state = createOAuthState();
  const redirectUri = `${resolveAppUrl(req)}/api/auth/google/callback`;

  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", "openid email profile");
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("prompt", "select_account");

  return NextResponse.redirect(authUrl.toString());
}
