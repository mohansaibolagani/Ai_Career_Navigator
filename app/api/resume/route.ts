import { NextRequest, NextResponse } from "next/server";
import { resolveSession } from "@/server/auth";
import { computeSkillGap } from "@/lib/engine";
import { CAREERS } from "@/lib/data";
import { analyzeResumeWithAI } from "@/server/ai";
import { extractDocxText, extractPdfText } from "@/server/extract";
import type { ResumeAnalysis } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const user = resolveSession(req.cookies.get("acn_session")?.value);
  if (!user || !user.profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }
  const maxBytes = 8 * 1024 * 1024;
  if (file.size > maxBytes) {
    return NextResponse.json({ error: "File too large (max 8MB)" }, { status: 400 });
  }
  const name = file.name.toLowerCase();
  let text = "";
  try {
    if (name.endsWith(".pdf")) {
      text = await extractPdfText(Buffer.from(await file.arrayBuffer()));
    } else if (name.endsWith(".docx")) {
      text = await extractDocxText(Buffer.from(await file.arrayBuffer()));
    } else if (name.endsWith(".doc") || name.endsWith(".txt")) {
      text = Buffer.from(await file.arrayBuffer()).toString("utf-8");
    } else {
      return NextResponse.json(
        { error: "Unsupported file type. Upload PDF, DOCX or TXT." },
        { status: 400 }
      );
    }
  } catch (err) {
    console.error("Extraction failed:", err);
    return NextResponse.json(
      { error: "Could not read the file. Try exporting as PDF or DOCX." },
      { status: 400 }
    );
  }

  if (text.replace(/\s/g, "").length < 80) {
    return NextResponse.json(
      { error: "Extracted text is too short — is this a resume? Scanned image PDFs aren't supported yet." },
      { status: 400 }
    );
  }

  const profile = user.profile;
  const career = CAREERS.find((c) => c.id === profile.targetCareerId);
  const gap = career ? computeSkillGap(profile, career) : null;

  const partial = (await analyzeResumeWithAI({ text, profile, gap })) ?? {};
  const analysis: ResumeAnalysis = {
    fileName: file.name,
    uploadedAt: new Date().toISOString(),
    resumeScore: partial.resumeScore ?? 50,
    atsScore: partial.atsScore ?? 50,
    careerAlignment: partial.careerAlignment ?? 50,
    wordCount: partial.wordCount ?? 0,
    strengths: partial.strengths ?? [],
    weaknesses: partial.weaknesses ?? [],
    missingSkills: partial.missingSkills ?? [],
    missingKeywords: partial.missingKeywords ?? [],
    suggestions: partial.suggestions ?? [],
    skillsDetected: partial.skillsDetected ?? [],
    sectionsFound: partial.sectionsFound ?? [],
    aiSummary: partial.aiSummary,
  };
  return NextResponse.json({ analysis });
}
