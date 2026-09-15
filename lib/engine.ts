import type {
  Career,
  CareerMatch,
  ProjectRec,
  SkillLevel,
  StudentProfile,
  RoadmapStage,
} from "./types";
import { CAREERS, PROJECTS } from "./data";

export const MAX_SKILL = 5;

export function skillLabel(level: SkillLevel | number): string {
  if (level >= 4) return "Strong";
  if (level === 3) return "Good";
  if (level === 2) return "Beginner";
  if (level >= 1) return "Aware";
  return "None";
}

function branchAffinity(profile: StudentProfile, career: Career): number {
  if (career.branches.includes(profile.branch)) return 1;
  return career.openToAllBranches ? 0.75 : 0.35;
}

function degreeAffinity(profile: StudentProfile, career: Career): number {
  return career.degrees.includes(profile.degree) ? 1 : 0.7;
}

function interestOverlap(profile: StudentProfile, career: Career): string[] {
  return career.interests.filter((i) => profile.interests.includes(i));
}

function computeScore(
  profile: StudentProfile,
  career: Career
): { score: number; reasons: string[] } {
  const reasons: string[] = [];

  // Skill coverage: weighted average of level vs required level
  let wsum = 0;
  let got = 0;
  for (const req of career.requiredSkills) {
    const have = profile.skills[req.name] ?? 0;
    wsum += req.weight;
    got += req.weight * Math.min(1, have / req.level);
  }
  const skillPct = wsum ? got / wsum : 0;

  const branch = branchAffinity(profile, career);
  const degree = degreeAffinity(profile, career);
  const overlap = interestOverlap(profile, career);
  const interest = overlap.length
    ? Math.min(1, 0.6 + 0.2 * overlap.length)
    : 0.35;

  if (overlap.length) {
    reasons.push(
      `Matches your interest in ${overlap.slice(0, 2).join(" & ")}`
    );
  } else {
    reasons.push("Open to students from any interest area");
  }
  if (career.branches.includes(profile.branch)) {
    reasons.push(`Natural fit for ${profile.branch} students`);
  } else if (career.openToAllBranches) {
    reasons.push("Open to all branches — transition is realistic");
  } else {
    reasons.push("Possible from your branch with extra effort");
  }
  if (!career.degrees.includes(profile.degree)) {
    reasons.push(`Accessible to ${profile.degree} graduates`);
  }
  reasons.push(`Demand: ${career.demand}`);

  const score = Math.round(
    100 *
      (0.5 * skillPct + 0.2 * interest + 0.18 * branch + 0.12 * degree) *
      (0.92 + Math.random() * 0.08)
  );
  return { score: Math.min(97, Math.max(38, score)), reasons };
}

export function computeMatches(profile: StudentProfile): CareerMatch[] {
  const matches = CAREERS.map((career) => {
    const { score, reasons } = computeScore(profile, career);
    const have: string[] = [];
    const improving: string[] = [];
    const missing: string[] = [];
    for (const req of career.requiredSkills) {
      const lvl = profile.skills[req.name] ?? 0;
      if (lvl >= req.level) have.push(req.name);
      else if (lvl > 0) improving.push(req.name);
      else missing.push(req.name);
    }
    const why = career.whyTemplate
      .replace("{interest}", interestOverlap(profile, career)[0] ?? "technology")
      .replace("{branch}", profile.branch);
    return {
      career,
      score,
      reasons: [why, ...reasons.slice(1)],
      have,
      improving,
      missing,
    };
  });
  return matches.sort((a, b) => b.score - a.score);
}

export interface SkillGapReport {
  target: Career;
  strong: string[];
  improve: Array<{ name: string; level: SkillLevel; needed: SkillLevel }>;
  missing: string[];
  priority: Array<{ name: string; level: SkillLevel; needed: SkillLevel }>;
  readiness: number;
}

export function computeSkillGap(
  profile: StudentProfile,
  career: Career
): SkillGapReport {
  const strong: string[] = [];
  const improve: SkillGapReport["improve"] = [];
  const missing: string[] = [];
  for (const req of career.requiredSkills) {
    const lvl = (profile.skills[req.name] ?? 0) as SkillLevel;
    if (lvl >= req.level) strong.push(req.name);
    else if (lvl >= 2) improve.push({ name: req.name, level: lvl, needed: req.level });
    else missing.push(req.name);
  }
  // Priority: high-weight skills with the largest shortfall
  const priority = [...improve, ...missing.map((m) => {
    const req = career.requiredSkills.find((r) => r.name === m)!;
    return { name: m, level: 0 as SkillLevel, needed: req.level };
  })]
    .map((s) => ({
      ...s,
      weight: career.requiredSkills.find((r) => r.name === s.name)?.weight ?? 1,
      gap: (career.requiredSkills.find((r) => r.name === s.name)?.level ?? 5) - s.level,
    }))
    .sort((a, b) => b.weight * 10 + b.gap - (a.weight * 10 + a.gap))
    .map(({ name, level, needed }) => ({ name, level, needed }));

  let wsum = 0;
  let got = 0;
  for (const req of career.requiredSkills) {
    const lvl = profile.skills[req.name] ?? 0;
    wsum += req.weight;
    got += req.weight * Math.min(1, lvl / req.level);
  }
  const readiness = wsum ? Math.round((got / wsum) * 100) : 0;

  return { target: career, strong, improve, missing, priority, readiness };
}

/** Personalized roadmap: career stages + any extra stage for missing skills */
export function personalizeRoadmap(
  profile: StudentProfile,
  career: Career
): RoadmapStage[] {
  const stages = [...career.roadmap];
  const covered = new Set(
    stages.flatMap((s) => s.tasks.join(" ").toLowerCase().split(/[^a-z]+/))
  );
  const gaps = career.requiredSkills
    .filter((r) => (profile.skills[r.name] ?? 0) === 0)
    .filter((r) => !covered.has(r.name.toLowerCase().split(" ")[0]))
    .slice(0, 2);
  for (const gap of gaps) {
    stages.unshift({
      id: `rm-gap-${career.id}-${gap.name.toLowerCase().replace(/[^a-z]+/g, "-")}`,
      title: `${gap.name} Kickstart`,
      duration: "3 weeks",
      goals: [`Reach beginner level in ${gap.name}`],
      tasks: [
        `Intro course / tutorial for ${gap.name}`,
        `Hands-on mini exercise set`,
        `Note key concepts in your own words`,
      ],
      projects: [`${gap.name} starter mini-project`],
    });
  }
  return stages;
}

export function recommendedProjects(
  profile: StudentProfile,
  career: Career | null
): ProjectRec[] {
  const scored = PROJECTS.map((p) => {
    let s = 0;
    if (career && p.careers.includes(career.id)) s += 50;
    else if (career) s += 10;
    // skill-gap relevance
    for (const sk of p.skills) {
      const lvl = profile.skills[sk] ?? 0;
      if (lvl === 0) s += 8;
      else if (lvl <= 2) s += 5;
      else s += 1;
    }
    if (profile.interests.some((i) => p.why.toLowerCase().includes(i.split(" ")[0].toLowerCase()))) s += 3;
    return { p, s };
  });
  return scored.sort((a, b) => b.s - a.s).map((x) => x.p);
}
