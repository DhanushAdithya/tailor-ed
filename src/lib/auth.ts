import crypto from "node:crypto";
import type { UserProfile } from "@/domain/types";

export interface SessionPayload {
  user: UserProfile;
  iat: number;
  exp: number;
}

export const SESSION_COOKIE_NAME = "tailor_ed_session";
export const OAUTH_STATE_COOKIE_NAME = "tailor_ed_oauth_state";
export const OAUTH_REDIRECT_COOKIE_NAME = "tailor_ed_oauth_redirect_uri";

const DEFAULT_AUTH_SECRET =
  "epistemic-os-dev-auth-secret-change-in-production-min-32-chars";

export function getAuthSecret(): string {
  return process.env.AUTH_SECRET || DEFAULT_AUTH_SECRET;
}

export function isGoogleAuthPlaceholder(): boolean {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim() || "";
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim() || "";

  if (!clientId || !clientSecret) return true;
  if (
    clientId.includes("your-google-client-id") ||
    clientSecret.includes("your-google-client-secret") ||
    clientId.startsWith("placeholder")
  ) {
    return true;
  }
  return false;
}

export function getGoogleOAuthConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim() || "";
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim() || "";
  const isPlaceholder = isGoogleAuthPlaceholder();
  const configuredRedirectUri = process.env.GOOGLE_REDIRECT_URI?.trim() || "";

  return {
    clientId,
    clientSecret,
    isPlaceholder,
    configuredRedirectUri,
  };
}

export function computeInitials(name: string, email?: string): string {
  const clean = name.trim();
  if (clean) {
    const parts = clean.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    if (parts.length === 1 && parts[0].length >= 1) {
      return parts[0].slice(0, Math.min(2, parts[0].length)).toUpperCase();
    }
  }
  if (email && email.length >= 2) {
    return email.slice(0, 2).toUpperCase();
  }
  return "GU";
}

export function signSession(
  user: UserProfile,
  expiresInSeconds = 60 * 60 * 24 * 7,
): string {
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + expiresInSeconds;
  const payload: SessionPayload = { user, iat, exp };

  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", getAuthSecret())
    .update(payloadB64)
    .digest("base64url");

  return `${payloadB64}.${signature}`;
}

export function verifySession(token: string): UserProfile | null {
  if (!token || !token.includes(".")) return null;
  const [payloadB64, signature] = token.split(".");
  if (!payloadB64 || !signature) return null;

  const expectedSignature = crypto
    .createHmac("sha256", getAuthSecret())
    .update(payloadB64)
    .digest("base64url");

  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expectedSignature);
  if (sigBuf.length !== expBuf.length) return null;
  if (!crypto.timingSafeEqual(sigBuf, expBuf)) return null;

  try {
    const json = Buffer.from(payloadB64, "base64url").toString("utf-8");
    const payload = JSON.parse(json) as SessionPayload;
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return null;
    }
    return payload.user;
  } catch {
    return null;
  }
}

function isSecureCookie(): boolean {
  if (process.env.NODE_ENV !== "production") return false;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
  return appUrl.startsWith("https://");
}

export function getSessionCookieOptions(maxAgeSeconds = 60 * 60 * 24 * 7) {
  return {
    name: SESSION_COOKIE_NAME,
    httpOnly: true,
    secure: isSecureCookie(),
    sameSite: "lax" as const,
    path: "/",
    maxAge: maxAgeSeconds,
  };
}

export function getOAuthCookieOptions(maxAgeSeconds = 600) {
  return {
    httpOnly: true,
    secure: isSecureCookie(),
    sameSite: "lax" as const,
    path: "/",
    maxAge: maxAgeSeconds,
  };
}
