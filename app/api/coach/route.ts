import { NextRequest, NextResponse } from "next/server";
import { resolveSession } from "@/server/auth";
import { computeSkillGap } from "@/lib/engine";
import { CAREERS } from "@/lib/data";
import { coachReply } from "@/server/ai";
import type { ChatMessage } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const user = await resolveSession(req.cookies.get("acn_session")?.value);
  if (!user || !user.profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { question, history } = await req.json();
  if (!question || typeof question !== "string") {
    return NextResponse.json({ error: "Question required" }, { status: 400 });
  }
  const profile = user.profile;
  const career = CAREERS.find((c) => c.id === profile.targetCareerId);
  const gap = career ? computeSkillGap(profile, career) : null;
  const reply = await coachReply(
    profile,
    (history ?? []) as ChatMessage[],
    question,
    gap
  );
  return NextResponse.json({ reply });
}
