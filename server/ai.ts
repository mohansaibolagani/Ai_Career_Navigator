import type {
  ChatMessage,
  ResumeAnalysis,
  StudentProfile,
  SkillLevel,
} from "../lib/types";
import type { SkillGapReport } from "../lib/engine";
import { CAREERS } from "../lib/data";

/**
 * AI provider layer.
 * Works with any OpenAI-compatible chat completions endpoint via env vars:
 *   OPENAI_API_KEY + OPENAI_BASE_URL (OpenAI, Azure, OpenRouter, Groq, Ollama...)
 * Keys are read ONLY from process.env on the server — never bundled to the client.
 * When no key is configured the app degrades gracefully to a deterministic
 * rule-based coach so the whole product still works offline (hackathon demo).
 */

const MODEL = process.env.AI_MODEL || "gpt-4o-mini";

export function aiEnabled(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}

interface Msg {
  role: "system" | "user" | "assistant";
  content: string;
}

async function chatCompletion(
  messages: Msg[],
  opts: { json?: boolean; maxTokens?: number } = {}
): Promise<string | null> {
  if (!aiEnabled()) return null;
  const base = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
  try {
    const res = await fetch(`${base.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        max_tokens: opts.maxTokens ?? 900,
        temperature: 0.6,
        ...(opts.json ? { response_format: { type: "json_object" } } : {}),
      }),
    });
    if (!res.ok) {
      console.error("AI provider error:", res.status, await res.text());
      return null;
    }
    const data = await res.json();
    return data.choices?.[0]?.message?.content ?? null;
  } catch (err) {
    console.error("AI provider unreachable:", err);
    return null;
  }
}

// ---------- Career coach ----------

export function profileContext(profile: StudentProfile): string {
  const skills = Object.entries(profile.skills)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `${k}: L${v}/5`)
    .join(", ");
  const career = CAREERS.find((c) => c.id === profile.targetCareerId);
  return [
    `Student: ${profile.name}`,
    `Degree: ${profile.degree} ${profile.branch} (graduating ${profile.gradYear})`,
    `College: ${profile.college}`,
    `Interests: ${profile.interests.join(", ") || "not set"}`,
    `Skills: ${skills || "none listed"}`,
    `Target career: ${career ? career.title : "not selected yet"}`,
  ].join("\n");
}

const LANGUAGE_NAMES: Record<string, string> = {
  en: "English",
  te: "Telugu",
  hi: "Hindi",
  ta: "Tamil",
  kn: "Kannada",
  ml: "Malayalam",
  bn: "Bengali",
  mr: "Marathi",
};

export async function coachReply(
  profile: StudentProfile,
  history: ChatMessage[],
  question: string,
  skillGap: SkillGapReport | null
): Promise<string> {
  const lang = LANGUAGE_NAMES[profile.language] || "English";
  const system: Msg = {
    role: "system",
    content: `You are the AI Career Coach inside "AI Career Navigator Agent", helping Indian undergraduate students.

Student context:
${profileContext(profile)}

${
  skillGap
    ? `Current skill gaps for ${skillGap.target.title} (priority order): ${skillGap.priority
        .map((p) => `${p.name} (needs L${p.needed}, has L${p.level})`)
        .join("; ")}. Readiness: ${skillGap.readiness}%.`
    : "Target career not selected yet."
}

Rules:
- Reply ONLY in ${lang}. Keep technical terms (Python, SQL, Machine Learning, GitHub, Docker, Excel, Figma etc.) in English.
- Be concise (under 130 words), practical and encouraging. Give concrete next actions.
- Base advice on the student's actual skill levels and roadmap — never generic filler.`,
  };
  const messages: Msg[] = [
    system,
    ...history.slice(-8).map((m) => ({
      role: m.role === "user" ? ("user" as const) : ("assistant" as const),
      content: m.content,
    })),
    { role: "user" as const, content: question },
  ];
  const reply = await chatCompletion(messages, { maxTokens: 500 });
  if (reply) return reply.trim();
  return fallbackCoachReply(profile, question, skillGap, lang);
}

export function fallbackCoachReply(
  profile: StudentProfile,
  question: string,
  gap: SkillGapReport | null,
  lang: string
): string {
  if (lang !== "English") {
    return `[Demo mode — AI key not configured. Reply would appear in ${lang}.]\n\n` +
      fallbackCoachReply(profile, question, gap, "English");
  }
  const q = question.toLowerCase();
  const career = gap?.target;
  const next = gap?.priority[0]?.name;

  if (gap && (q.includes("learn next") || q.includes("what should i") || q.includes("next step") || q.includes("start"))) {
    return `Based on your ${career?.title} roadmap, your next priority is ${next}. ` +
      `You're currently at level ${gap.priority[0]?.level ?? 0}/5 while the role needs level ${gap.priority[0]?.needed ?? 3}. ` +
      `Block 45 minutes daily this week for it, then start one recommended project to apply it immediately.`;
  }
  if (q.includes("internship") || q.includes("apply") || q.includes("placement")) {
    const strong = gap?.strong ?? [];
    const weak = gap?.priority.slice(0, 2).map((p) => p.name) ?? [];
    return `Your profile shows real strength in ${strong.slice(0, 2).join(" and ") || "your core subjects"}, ` +
      `but ${weak.join(" and ") || "a couple of key skills"} still need work before internship applications stand out. ` +
      `Complete one intermediate project in your target area first — recruiters shortlist projects before marks. Aim to apply once your readiness crosses 60%.`;
  }
  if (q.includes("resume")) {
    return `Anchor your resume to ${career?.title ?? "your target role"}: top section = skills matching the role, ` +
      `then 2 projects with metrics, then education. Use the Resume Analyzer here after every change — target an ATS score above 75.`;
  }
  if (q.includes("roadmap") || q.includes("plan") || q.includes("goal")) {
    return `Your ${career?.title ?? "career"} roadmap has ${career?.roadmap.length ?? 5} stages. ` +
      `Finish the current stage's tasks before jumping ahead — consistency beats intensity. Re-check your Skill Gap page weekly; it updates as you log skills.`;
  }
  return `Great question. Right now your fastest win is ${next ?? "building one solid project"} — it moves both your skill gap and your resume. ` +
    `Ask me about your roadmap, internships, resume or specific skills anytime. (Demo mode: add OPENAI_API_KEY for full AI replies.)`;
}

// ---------- Resume analysis ----------

export interface ResumeAIInput {
  text: string;
  profile: StudentProfile;
  gap: SkillGapReport | null;
}

export async function analyzeResumeWithAI(input: ResumeAIInput): Promise<Partial<ResumeAnalysis> | null> {
  const base = baseResumeAnalysis(input);
  const reply = await chatCompletion(
    [
      {
        role: "system",
        content:
          "You are a technical recruiter and ATS expert analyzing an Indian undergraduate student's resume for their target career. Respond with JSON only.",
      },
      {
        role: "user",
        content: `Target career: ${input.gap?.target.title ?? input.profile.targetCareerId ?? "unknown"}
Skills the role needs: ${input.gap?.target.requiredSkills.map((s) => s.name).join(", ") ?? "n/a"}

Resume text (first 6000 chars):
${input.text.slice(0, 6000)}

Return JSON with keys: strengths (string[]), weaknesses (string[]), missingKeywords (string[]), suggestions (string[]), aiSummary (string, 2 sentences).`,
      },
    ],
    { json: true, maxTokens: 800 }
  );
  if (!reply) return base;
  try {
    const parsed = JSON.parse(reply);
    return { ...base, ...parsed };
  } catch {
    return base;
  }
}

function baseResumeAnalysis(input: ResumeAIInput): Partial<ResumeAnalysis> {
  const text = input.text;
  const lower = text.toLowerCase();
  const words = text.split(/\s+/).filter(Boolean).length;
  const career = input.gap?.target;
  const requiredSkills = career?.requiredSkills.map((s) => s.name) ?? [];

  const sectionChecks: Array<[string, RegExp]> = [
    ["Contact info", /(email|@|phone|\+91|linkedin)/i],
    ["Education", /(education|b\.?tech|b\.?e\.|bca|b\.?sc|bba|b\.?com|cgpa|university|college)/i],
    ["Skills", /(skills|technologies|technical)/i],
    ["Projects", /(project)/i],
    ["Experience/Internship", /(internship|experience|employment)/i],
    ["Achievements", /(achievement|award|certificat|hackathon)/i],
  ];
  const sectionsFound = sectionChecks.filter(([, re]) => re.test(lower)).map(([n]) => n);

  const skillsDetected = requiredSkills.filter((s) =>
    lower.includes(s.toLowerCase().split(" ")[0])
  );

  const missingSkills = requiredSkills.filter(
    (s) => !skillsDetected.includes(s)
  );
  const missingKeywords = Array.from(
    new Set(
      [
        ...career?.projects.slice(0, 2) ?? [],
        ...(career ? ["GitHub", "teamwork", "problem solving"] : []),
      ].filter((k) => !lower.includes(k.toLowerCase()))
    )
  ).slice(0, 6);

  // Scores
  const sectionScore = (sectionsFound.length / sectionChecks.length) * 30;
  const skillScore = requiredSkills.length
    ? (skillsDetected.length / requiredSkills.length) * 30
    : 15;
  const lengthScore = words >= 300 ? 15 : words >= 180 ? 10 : 5;
  const metricScore = /\d+\s?(%|percent|users|k|lpa|₹)/i.test(text) ? 10 : 4;
  const linkScore = /(github\.com|linkedin\.com)/i.test(text) ? 10 : 3;
  const atsScore = Math.round(sectionScore + 20 + (linkScore > 5 ? 10 : 4) + (words > 150 ? 10 : 5));
  const resumeScore = Math.min(
    96,
    Math.round(sectionScore + skillScore + lengthScore + metricScore + linkScore)
  );
  const careerAlignment = requiredSkills.length
    ? Math.round((skillsDetected.length / requiredSkills.length) * 100)
    : 50;

  const strengths: string[] = [];
  if (sectionsFound.includes("Projects")) strengths.push("Projects section present — recruiters see applied skills");
  if (sectionsFound.includes("Experience/Internship")) strengths.push("Internship/experience listed");
  if (metricScore > 6) strengths.push("Quantified achievements with numbers/metrics");
  if (linkScore > 5) strengths.push("GitHub/LinkedIn links included");
  if (skillsDetected.length) strengths.push(`Relevant skills detected: ${skillsDetected.slice(0, 4).join(", ")}`);

  const weaknesses: string[] = [];
  const missingSections = sectionChecks.filter(([, re]) => !re.test(lower)).map(([n]) => n);
  if (missingSections.length) weaknesses.push(`Missing sections: ${missingSections.join(", ")}`);
  if (metricScore <= 6) weaknesses.push("Achievements are not quantified — add numbers and impact");
  if (linkScore <= 5) weaknesses.push("No GitHub/LinkedIn link found");
  if (words < 180) weaknesses.push("Resume looks thin — add project detail");
  if (words > 800) weaknesses.push("Resume is long — trim to one page");

  const suggestions = [
    ...missingSkills.slice(0, 3).map((s) => `Add ${s} — it's a core requirement for ${career?.title ?? "your target role"}`),
    "Start every bullet with an action verb and end with a measurable result",
    missingKeywords.length ? `Naturally include keywords: ${missingKeywords.slice(0, 4).join(", ")}` : "Keyword coverage is good",
  ];

  return {
    wordCount: words,
    skillsDetected,
    sectionsFound,
    missingSkills,
    missingKeywords,
    resumeScore,
    atsScore,
    careerAlignment,
    strengths: strengths.length ? strengths : ["Resume parsed successfully"],
    weaknesses: weaknesses.length ? weaknesses : ["No major issues detected"],
    suggestions,
    aiSummary: undefined,
  };
}
