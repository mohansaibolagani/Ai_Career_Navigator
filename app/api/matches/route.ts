import { NextRequest, NextResponse } from "next/server";
import { resolveSession, updateProfile } from "@/server/auth";
import { computeMatches, computeSkillGap, personalizeRoadmap } from "@/lib/engine";
import { CAREERS } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = resolveSession(req.cookies.get("acn_session")?.value);
  if (!user || !user.profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const profile = user.profile;
  const matches = computeMatches(profile);
  const target = CAREERS.find((c) => c.id === profile.targetCareerId);
  return NextResponse.json({
    matches,
    skillGap: target ? computeSkillGap(profile, target) : null,
    roadmap: target ? personalizeRoadmap(profile, target) : null,
  });
}

/** Select target career */
export async function POST(req: NextRequest) {
  const user = resolveSession(req.cookies.get("acn_session")?.value);
  if (!user || !user.profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { careerId } = await req.json();
  if (!CAREERS.some((c) => c.id === careerId)) {
    return NextResponse.json({ error: "Unknown career" }, { status: 400 });
  }
  updateProfile(user.id, { ...user.profile, targetCareerId: careerId });
  return NextResponse.json({ ok: true, targetCareerId: careerId });
}
