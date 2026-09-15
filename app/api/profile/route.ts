import { NextRequest, NextResponse } from "next/server";
import { resolveSession, updateProfile } from "@/server/auth";
import type { StudentProfile } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = resolveSession(req.cookies.get("acn_session")?.value);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ profile: user.profile });
}

export async function PUT(req: NextRequest) {
  const user = resolveSession(req.cookies.get("acn_session")?.value);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const existing = user.profile;
  const profile: StudentProfile = {
    id: user.id,
    name: body.name ?? existing?.name ?? user.name,
    email: user.email,
    degree: body.degree ?? existing?.degree ?? "B.Tech",
    branch: body.branch ?? existing?.branch ?? "CSE",
    college: body.college ?? existing?.college ?? "",
    gradYear: body.gradYear ?? existing?.gradYear ?? 2027,
    interests: body.interests ?? existing?.interests ?? [],
    skills: body.skills ?? existing?.skills ?? {},
    targetCareerId: body.targetCareerId ?? existing?.targetCareerId ?? null,
    onboarded: body.onboarded ?? existing?.onboarded ?? false,
    language: body.language ?? existing?.language ?? "en",
    createdAt: existing?.createdAt ?? new Date().toISOString(),
  };
  updateProfile(user.id, profile);
  return NextResponse.json({ profile });
}
