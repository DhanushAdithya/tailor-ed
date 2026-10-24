import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import {
  getGoogleOAuthConfig,
  getOAuthCookieOptions,
  OAUTH_REDIRECT_COOKIE_NAME,
  OAUTH_STATE_COOKIE_NAME,
} from "@/lib/auth";

export async function GET(request: NextRequest) {
  const config = getGoogleOAuthConfig();

  if (config.isPlaceholder) {
    const redirectUrl = new URL(
      "/?auth_notice=placeholder_config",
      request.nextUrl.origin,
    );
    return NextResponse.redirect(redirectUrl);
  }

  const origin = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
  const redirectUri =
    config.configuredRedirectUri || `${origin}/api/auth/google/callback`;
  const state = crypto.randomBytes(32).toString("hex");

  const googleAuthUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  googleAuthUrl.searchParams.set("client_id", config.clientId);
  googleAuthUrl.searchParams.set("redirect_uri", redirectUri);
  googleAuthUrl.searchParams.set("response_type", "code");
  googleAuthUrl.searchParams.set("scope", "openid email profile");
  googleAuthUrl.searchParams.set("state", state);
  googleAuthUrl.searchParams.set("prompt", "select_account");
  googleAuthUrl.searchParams.set("access_type", "online");

  const response = NextResponse.redirect(googleAuthUrl);
  response.cookies.set({
    ...getOAuthCookieOptions(),
    name: OAUTH_STATE_COOKIE_NAME,
    value: state,
  });
  response.cookies.set({
    ...getOAuthCookieOptions(),
    name: OAUTH_REDIRECT_COOKIE_NAME,
    value: redirectUri,
  });

  return response;
}
