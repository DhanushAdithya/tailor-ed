import { NextRequest, NextResponse } from "next/server";
import {
  isGoogleAuthPlaceholder,
  SESSION_COOKIE_NAME,
  verifySession,
} from "@/lib/auth";

export async function GET(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const user = token ? verifySession(token) : null;
  const isPlaceholderConfig = isGoogleAuthPlaceholder();

  return NextResponse.json({
    user,
    isPlaceholderConfig,
  });
}
