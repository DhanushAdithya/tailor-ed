import { NextRequest, NextResponse } from "next/server";
import {
  computeInitials,
  getGoogleOAuthConfig,
  getSessionCookieOptions,
  OAUTH_REDIRECT_COOKIE_NAME,
  OAUTH_STATE_COOKIE_NAME,
  signSession,
} from "@/lib/auth";
import type { UserProfile } from "@/domain/types";

interface GoogleUserInfo {
  sub: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  email?: string;
  email_verified?: boolean;
}

interface GoogleTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  id_token?: string;
  scope?: string;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const error = searchParams.get("error");
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  const origin = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;

  if (error) {
    console.error("Google OAuth error parameter received:", error);
    return NextResponse.redirect(
      new URL(`/?auth_error=${encodeURIComponent(error)}`, origin),
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL("/?auth_error=missing_code", origin),
    );
  }

  const storedState = request.cookies.get(OAUTH_STATE_COOKIE_NAME)?.value;
  if (storedState && state && storedState !== state) {
    console.error("Google OAuth state mismatch:", { storedState, state });
    return NextResponse.redirect(
      new URL("/?auth_error=state_mismatch", origin),
    );
  }

  const config = getGoogleOAuthConfig();
  if (config.isPlaceholder) {
    return NextResponse.redirect(
      new URL("/?auth_notice=placeholder_config", origin),
    );
  }

  const cookieRedirectUri = request.cookies.get(OAUTH_REDIRECT_COOKIE_NAME)?.value;
  const redirectUri =
    cookieRedirectUri ||
    config.configuredRedirectUri ||
    `${origin}/api/auth/google/callback`;

  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: config.clientId,
        client_secret: config.clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error("Google token exchange failed:", errText);
      return NextResponse.redirect(
        new URL(
          `/?auth_error=token_exchange_failed&details=${encodeURIComponent(errText)}`,
          origin,
        ),
      );
    }

    const tokens = (await tokenRes.json()) as GoogleTokenResponse;

    const userinfoRes = await fetch(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
        },
      },
    );

    if (!userinfoRes.ok) {
      const errText = await userinfoRes.text();
      console.error("Google userinfo fetch failed:", errText);
      return NextResponse.redirect(
        new URL("/?auth_error=userinfo_failed", origin),
      );
    }

    const userInfo = (await userinfoRes.json()) as GoogleUserInfo;

    const name =
      userInfo.name ||
      [userInfo.given_name, userInfo.family_name].filter(Boolean).join(" ") ||
      "Google User";
    const email = userInfo.email || "user@google.com";
    const initials = computeInitials(name, email);

    const userProfile: UserProfile = {
      name,
      email,
      initials,
      avatarUrl: userInfo.picture,
    };

    const token = signSession(userProfile);
    const response = NextResponse.redirect(new URL("/", origin));

    response.cookies.set({
      ...getSessionCookieOptions(),
      value: token,
    });

    response.cookies.delete(OAUTH_STATE_COOKIE_NAME);
    response.cookies.delete(OAUTH_REDIRECT_COOKIE_NAME);

    return response;
  } catch (err) {
    console.error("Google OAuth callback unexpected error:", err);
    return NextResponse.redirect(
      new URL("/?auth_error=unexpected_callback_error", origin),
    );
  }
}
