import type { CareerMatch, ResumeAnalysis, RoadmapStage, SkillGapReport, StudentProfile } from "./types";

async function json<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error || `Request failed (${res.status})`);
  return data as T;
}

export const api = {
  session: () =>
    fetch("/api/auth", { cache: "no-store" }).then((r) => json<{ user: { id: string; email: string; name: string; profile: StudentProfile | null } | null }>(r)),

  auth: (action: "signup" | "login" | "demo" | "logout", payload: Record<string, unknown> = {}) =>
    fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...payload }),
    }).then((r) => json<{ user: { id: string; email: string; name: string; profile: StudentProfile | null } }>(r)),

  saveProfile: (profile: Partial<StudentProfile>) =>
    fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    }).then((r) => json<{ profile: StudentProfile }>(r)),

  matches: () =>
    fetch("/api/matches", { cache: "no-store" }).then((r) =>
      json<{ matches: CareerMatch[]; skillGap: SkillGapReport | null; roadmap: RoadmapStage[] | null }>(r)
    ),

  selectCareer: (careerId: string) =>
    fetch("/api/matches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ careerId }),
    }).then((r) => json<{ ok: boolean }>(r)),

  coach: (question: string, history: Array<{ role: string; content: string }>) =>
    fetch("/api/coach", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, history }),
    }).then((r) => json<{ reply: string }>(r)),

  resume: (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return fetch("/api/resume", { method: "POST", body: fd }).then((r) =>
      json<{ analysis: ResumeAnalysis }>(r)
    );
  },
};
