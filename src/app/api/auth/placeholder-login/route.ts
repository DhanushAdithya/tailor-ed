import { NextRequest, NextResponse } from "next/server";
import {
  computeInitials,
  getSessionCookieOptions,
  isGoogleAuthPlaceholder,
  signSession,
} from "@/lib/auth";
import type { UserProfile } from "@/domain/types";

export async function POST(request: NextRequest) {
  // Only allow placeholder login if credentials are placeholders or if explicitly testing
  const isPlaceholder = isGoogleAuthPlaceholder();

  let body: { name?: string; email?: string } = {};
  try {
    body = await request.json();
  } catch {
    // Body is optional
  }

  const name = body.name?.trim() || "Google Account (Placeholder)";
  const email = body.email?.trim() || "explorer.demo@gmail.com";
  const initials = computeInitials(name, email);

  const user: UserProfile = {
    name,
    email,
    initials,
  };

  const token = signSession(user);
  const response = NextResponse.json({
    success: true,
    user,
    isPlaceholderMode: isPlaceholder,
  });

  response.cookies.set({
    ...getSessionCookieOptions(),
    value: token,
  });

  return response;
}
