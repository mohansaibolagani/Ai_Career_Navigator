import { NextRequest, NextResponse } from "next/server";
import {
  createUser,
  verifyUser,
  createSession,
  resolveSession,
  updateProfile,
} from "@/server/auth";
import { buildDemoProfile } from "@/lib/data";

export const dynamic = "force-dynamic";

const COOKIE = "acn_session";

async function me(req: NextRequest) {
  const user = resolveSession(req.cookies.get(COOKIE)?.value);
  if (!user) return NextResponse.json({ user: null });
  return NextResponse.json({ user: { id: user.id, email: user.email, name: user.name, profile: user.profile } });
}

export async function GET(req: NextRequest) {
  return me(req);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const action = body.action as string;

  try {
    if (action === "signup") {
      const { email, name, password } = body;
      if (!email || !password || !name) {
        return NextResponse.json({ error: "Name, email and password are required" }, { status: 400 });
      }
      if (String(password).length < 6) {
        return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
      }
      const user = createUser(String(email), String(name), String(password));
      const token = createSession(user.id);
      const res = NextResponse.json({ user: { id: user.id, email: user.email, name: user.name, profile: user.profile } });
      res.cookies.set(COOKIE, token, { httpOnly: true, sameSite: "lax", path: "/" });
      return res;
    }

    if (action === "login") {
      const user = verifyUser(String(body.email ?? ""), String(body.password ?? ""));
      if (!user) return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
      const token = createSession(user.id);
      const res = NextResponse.json({ user: { id: user.id, email: user.email, name: user.name, profile: user.profile } });
      res.cookies.set(COOKIE, token, { httpOnly: true, sameSite: "lax", path: "/" });
      return res;
    }

    if (action === "demo") {
      // Instant demo: local account seeded with the sample student
      const email = "ananya.sharma@demo.edu";
      let user = verifyUser(email, "demo1234");
      if (!user) {
        user = createUser(email, "Ananya Sharma", "demo1234");
      }
      if (!user.profile) {
        updateProfile(user.id, buildDemoProfile());
        user = verifyUser(email, "demo1234")!;
      }
      const token = createSession(user.id);
      const res = NextResponse.json({ user: { id: user.id, email: user.email, name: user.name, profile: user.profile } });
      res.cookies.set(COOKIE, token, { httpOnly: true, sameSite: "lax", path: "/" });
      return res;
    }

    if (action === "logout") {
      const res = NextResponse.json({ ok: true });
      res.cookies.set(COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
      return res;
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Authentication failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
