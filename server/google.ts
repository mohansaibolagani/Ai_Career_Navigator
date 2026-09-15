/**
 * Google OAuth helper: builds the consent URL and exchanges the code for an
 * id_token whose email/name we trust. Credentials come from env only:
 *   GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET (+ optional GOOGLE_REDIRECT_URI)
 * set GOOGLE_DEMO_EMAIL / GOOGLE_DEMO_NAME to also enable a no-keys demo
 * fallback so the flow can be shown without real Google credentials.
 */
export function googleOAuthConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
  );
}

export function googleDemoConfigured(): boolean {
  return Boolean(process.env.GOOGLE_DEMO_EMAIL);
}

export function buildGoogleAuthUrl(redirectUri: string, state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID ?? "",
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    access_type: "online",
    include_granted_scopes: "true",
    prompt: "select_account",
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export interface GoogleProfile {
  email: string;
  name: string;
  picture?: string;
}

export async function exchangeGoogleCode(
  code: string,
  redirectUri: string
): Promise<GoogleProfile> {
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID ?? "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });
  if (!tokenRes.ok) {
    throw new Error(`Google token exchange failed (${tokenRes.status})`);
  }
  const tokens = (await tokenRes.json()) as { id_token?: string };
  if (!tokens.id_token) throw new Error("Google response missing id_token");
  const payload = JSON.parse(
    Buffer.from(tokens.id_token.split(".")[1], "base64url").toString("utf-8")
  ) as { email?: string; name?: string; email_verified?: boolean };
  if (!payload.email) throw new Error("Google account has no email");
  if (payload.email_verified === false) {
    throw new Error("Google account email is not verified");
  }
  return { email: payload.email, name: payload.name ?? payload.email.split("@")[0] };
}
