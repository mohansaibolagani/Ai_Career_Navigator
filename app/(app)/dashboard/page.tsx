"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useStore, useT } from "@/lib/store";
import { CAREERS, PROJECTS } from "@/lib/data";
import { computeSkillGap } from "@/lib/engine";
import { ScoreRing, ProgressBar, SectionTitle, Badge, EmptyState } from "@/components/ui";
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import { Compass, Map, FileText, BotMessageSquare, ArrowRight, Sparkles } from "lucide-react";

export default function Dashboard() {
  const t = useT();
  const profile = useStore((s) => s.profile);
  const matches = useStore((s) => s.matches);
  const roadmap = useStore((s) => s.roadmap);
  const loadMatches = useStore((s) => s.loadMatches);
  const doneTasks = useStore((s) => s.doneTasks);
  const resumeAnalysis = useStore((s) => s.resumeAnalysis);

  useEffect(() => {
    loadMatches();
  }, [loadMatches]);

  if (!profile) return null;
  if (!profile.targetCareerId) {
    return (
      <EmptyState
        title="Let's find your career goal"
        body="Take the AI interest assessment, then pick a target career to unlock your dashboard, roadmap and skill gap analysis."
        action={<Link href="/assessment" className="btn btn-primary"><Sparkles size={16} /> {t("startAssessment")}</Link>}
      />
    );
  }

  const career = CAREERS.find((c) => c.id === profile.targetCareerId);
  const topMatch = matches?.find((m) => m.career.id === profile.targetCareerId);
  const gap = computeSkillGap(profile, career!);
  const stages = roadmap ?? career!.roadmap;
  const totalTasks = stages.reduce((n, s) => n + s.tasks.length, 0);
  const doneCount = stages.reduce((n, s) => n + (doneTasks[s.id]?.length ?? 0), 0);
  const progress = totalTasks ? Math.round((doneCount / totalTasks) * 100) : 0;
  const currentStage = stages.find((s) => (doneTasks[s.id]?.length ?? 0) < s.tasks.length) ?? stages[stages.length - 1];
  const nextTask = currentStage?.tasks.find((task) => !(doneTasks[currentStage.id] ?? []).includes(task));
  const projRec = PROJECTS.find((p) => p.id === career!.projects[0]);

  const radarData = career!.requiredSkills.map((req) => ({
    skill: req.name.length > 14 ? req.name.slice(0, 13) + "…" : req.name,
    you: profile.skills[req.name] ?? 0,
    needed: req.level,
  }));
  const gapBars = [...gap.priority.slice(0, 5).map((p) => ({ name: p.name, gap: p.needed - p.level }))];

  return (
    <div className="space-y-5">
      <SectionTitle
        title={`Welcome back, ${profile.name.split(" ")[0]} 👋`}
        sub={`${profile.degree} ${profile.branch} · ${profile.college || "College not set"} · Class of ${profile.gradYear}`}
      />

      {/* Top KPI row */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4 flex items-center gap-3">
          <ScoreRing value={topMatch?.score ?? gap.readiness} size={72} />
          <div>
            <p className="label">{t("matchScore")}</p>
            <p className="text-sm font-semibold leading-tight mt-1">{career!.title}</p>
            <Badge tone="green">{career!.demand} demand</Badge>
          </div>
        </div>
        <div className="card p-4">
          <p className="label">{t("careerGoal")}</p>
          <p className="text-sm font-semibold mt-1.5">{career!.title}</p>
          <p className="text-xs muted mt-1">{career!.family} · {career!.avgSalaryLPA}</p>
          <div className="mt-3"><Link href="/careers" className="text-xs font-medium text-brand-600 dark:text-brand-300 inline-flex items-center gap-1">Change goal <ArrowRight size={12} /></Link></div>
        </div>
        <div className="card p-4">
          <p className="label">{t("profileCompletion")}</p>
          <p className="text-lg font-bold mt-1">{profileCompletion(profile)}%</p>
          <ProgressBar value={profileCompletion(profile)} />
          <p className="text-[11px] muted mt-2">{Object.keys(profile.skills).length} skills · {profile.interests.length} interests</p>
        </div>
        <div className="card p-4">
          <p className="label">{t("resumeScore")}</p>
          {resumeAnalysis ? (
            <>
              <p className="text-lg font-bold mt-1">{resumeAnalysis.resumeScore}/100</p>
              <ProgressBar value={resumeAnalysis.resumeScore} color="bg-emerald-500" />
              <p className="text-[11px] muted mt-2">ATS {resumeAnalysis.atsScore} · {resumeAnalysis.fileName}</p>
            </>
          ) : (
            <>
              <p className="text-sm muted mt-2">Not analyzed yet</p>
              <Link href="/resume" className="btn btn-ghost !py-1.5 !px-3 mt-2 text-xs"><FileText size={13} /> Analyze resume</Link>
            </>
          )}
        </div>
      </div>

      {/* Middle: charts */}
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <p className="label mb-3">Skill readiness for {career!.title}</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} outerRadius="75%">
                <PolarGrid strokeDasharray="3 3" stroke="rgba(120,130,150,.3)" />
                <PolarAngleAxis dataKey="skill" tick={{ fontSize: 10, fill: "var(--muted)" }} />
                <Radar name="You" dataKey="you" stroke="#3d67ec" fill="#3d67ec" fillOpacity={0.35} />
                <Radar name="Needed" dataKey="needed" stroke="#10b981" fill="#10b981" fillOpacity={0.08} />
                <Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, fontSize: 12 }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card p-5">
          <p className="label mb-3">{t("skillGapShort")} — priority gaps</p>
          {gapBars.length ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={gapBars} layout="vertical" margin={{ left: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(120,130,150,.2)" horizontal={false} />
                  <XAxis type="number" domain={[0, 5]} allowDecimals={false} tick={{ fontSize: 11, fill: "var(--muted)" }} />
                  <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11, fill: "var(--muted)" }} />
                  <Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, fontSize: 12 }} />
                  <Bar dataKey="gap" fill="#f59e0b" radius={[0, 6, 6, 0]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm muted">No major gaps — you're ready to focus on projects and internships.</p>
          )}
        </div>
      </div>

      {/* Bottom: phase + next steps */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <p className="label">{t("currentPhase")}</p>
            <Badge tone="blue">{progress}% {t("progress")}</Badge>
          </div>
          <h3 className="font-semibold">{currentStage?.title}</h3>
          <p className="text-xs muted mt-0.5">{currentStage?.duration}</p>
          <div className="mt-3"><ProgressBar value={progress} /></div>
          <div className="mt-4 card p-4 bg-brand-500/5 border-brand-500/20">
            <p className="label">{t("nextStep")}</p>
            <p className="text-sm font-medium mt-1">{nextTask ?? "All tasks done — move to the next stage!"}</p>
            <div className="mt-3 flex gap-2">
              <Link href="/roadmap" className="btn btn-primary !py-1.5 text-xs"><Map size={13} /> Open roadmap</Link>
              <Link href="/coach" className="btn btn-ghost !py-1.5 text-xs"><BotMessageSquare size={13} /> Ask coach</Link>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <p className="label">{t("recommendedProject")}</p>
          {projRec && (
            <>
              <h3 className="font-semibold mt-1.5">{projRec.name}</h3>
              <p className="text-xs muted mt-1">{projRec.why}</p>
              <div className="flex flex-wrap gap-1.5 mt-3">
                <Badge tone={projRec.difficulty === "Beginner" ? "green" : projRec.difficulty === "Intermediate" ? "amber" : "red"}>
                  {projRec.difficulty}
                </Badge>
                {projRec.technologies.slice(0, 3).map((tech) => <Badge key={tech} tone="neutral">{tech}</Badge>)}
              </div>
              <Link href="/projects" className="btn btn-primary !py-1.5 text-xs mt-4 w-full"><Compass size={13} /> Browse projects</Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function profileCompletion(p: NonNullable<ReturnType<typeof useStore.getState>["profile"]>): number {
  let score = 0;
  if (p.name) score += 15;
  if (p.college) score += 10;
  if (p.degree && p.branch) score += 15;
  if (p.interests.length) score += 20;
  if (Object.keys(p.skills).length >= 5) score += 20;
  if (p.targetCareerId) score += 20;
  return Math.min(100, score);
}
