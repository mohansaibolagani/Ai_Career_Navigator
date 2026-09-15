import { NextRequest, NextResponse } from "next/server";
import { createHash, randomBytes } from "crypto";
import {
  buildGoogleAuthUrl,
  googleDemoConfigured,
  googleOAuthConfigured,
} from "@/server/google";

export const dynamic = "force-dynamic";

/**
 * GET /api/auth/google?demo=1
 *  - demo=1 → bounce straight to the callback with the no-keys demo identity
 *    (only when GOOGLE_DEMO_EMAIL is set)
 *  - otherwise → 302 to Google's consent screen (requires credentials)
 */
export async function GET(req: NextRequest) {
  const demo = req.nextUrl.searchParams.get("demo") === "1";
  const origin = req.nextUrl.origin;

  if (demo) {
    if (!googleDemoConfigured()) {
      return NextResponse.redirect(`${origin}/login?error=google_demo_not_configured`);
    }
    const res = NextResponse.redirect(`${origin}/api/auth/google/callback?demo=1`);
    return res;
  }

  if (!googleOAuthConfigured()) {
    // No real credentials yet — fall back to the demo identity when enabled so
    // the button always works (adding real keys switches this to true OAuth).
    if (googleDemoConfigured()) {
      return NextResponse.redirect(`${origin}/api/auth/google/callback?demo=1`);
    }
    return NextResponse.redirect(`${origin}/login?error=google_not_configured`);
  }

  const redirectUri =
    process.env.GOOGLE_REDIRECT_URI ?? `${origin}/api/auth/google/callback`;
  const state = createHash("sha256")
    .update(randomBytes(16))
    .digest("hex")
    .slice(0, 32);

  const res = NextResponse.redirect(buildGoogleAuthUrl(redirectUri, state));
  res.cookies.set("g_state", state, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });
  return res;
}
