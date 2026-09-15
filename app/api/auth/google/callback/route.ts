import { NextRequest, NextResponse } from "next/server";
import { upsertOAuthUser, createSession, verifyUser, updateProfile } from "@/server/auth";
import { exchangeGoogleCode, googleDemoConfigured } from "@/server/google";
import { buildDemoProfile } from "@/lib/data";

export const dynamic = "force-dynamic";

const COOKIE = "acn_session";

/**
 * GET /api/auth/google/callback?code=...&state=...
 *  - demo=1  → sign in as the configured demo Google user (no keys needed)
 *  - real    → exchange the code with Google, verify state cookie, upsert user
 * Redirects to /dashboard when the user already has a profile, else /onboarding.
 */
export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin;
  const fail = (reason: string) =>
    NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(reason)}`);

  const isDemo = req.nextUrl.searchParams.get("demo") === "1";

  if (isDemo) {
    if (!googleDemoConfigured()) return fail("google_demo_not_configured");
    const email = process.env.GOOGLE_DEMO_EMAIL!;
    const name = process.env.GOOGLE_DEMO_NAME ?? email.split("@")[0];
    let user = verifyUser(email, "demo1234");
    if (!user || user.provider !== "google") {
      user = upsertOAuthUser(email, name);
    }
    if (!user.profile && process.env.GOOGLE_DEMO_SEED_PROFILE === "1") {
      updateProfile(user.id, buildDemoProfile());
      user = upsertOAuthUser(email, name);
    }
    const token = createSession(user.id);
    const res = NextResponse.redirect(`${origin}/dashboard`);
    res.cookies.set(COOKIE, token, { httpOnly: true, sameSite: "lax", path: "/" });
    return res;
  }

  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  if (!code) return fail("google_code_missing");
  if (!state || state !== req.cookies.get("g_state")?.value) {
    return fail("google_state_mismatch");
  }

  try {
    const redirectUri =
      process.env.GOOGLE_REDIRECT_URI ?? `${origin}/api/auth/google/callback`;
    const profile = await exchangeGoogleCode(code, redirectUri);
    const user = upsertOAuthUser(profile.email, profile.name);
    const token = createSession(user.id);
    const res = NextResponse.redirect(
      user.profile ? `${origin}/dashboard` : `${origin}/onboarding`
    );
    res.cookies.set(COOKIE, token, { httpOnly: true, sameSite: "lax", path: "/" });
    res.cookies.set("g_state", "", { path: "/", maxAge: 0 });
    return res;
  } catch (err) {
    const message = err instanceof Error ? err.message : "google_failed";
    return fail(message);
  }
}
