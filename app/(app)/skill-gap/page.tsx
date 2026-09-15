"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useStore, useT } from "@/lib/store";
import { computeSkillGap } from "@/lib/engine";
import { CAREERS } from "@/lib/data";
import { SectionTitle, Badge, SkillBar, ScoreRing, EmptyState } from "@/components/ui";
import { GitCompareArrows, ArrowRight, Sparkles, Star } from "lucide-react";

export default function SkillGap() {
  const t = useT();
  const profile = useStore((s) => s.profile);
  const matches = useStore((s) => s.matches);
  const loadMatches = useStore((s) => s.loadMatches);

  useEffect(() => {
    loadMatches();
  }, [loadMatches]);

  if (!profile) return null;
  if (!profile.targetCareerId) {
    return (
      <EmptyState
        title="Select a target career first"
        body="Skill gap analysis compares your current skills against the exact requirements of your chosen career."
        action={<Link href="/careers" className="btn btn-primary">{t("selectCareer")}</Link>}
      />
    );
  }

  const career = CAREERS.find((c) => c.id === profile.targetCareerId)!;
  const gap = computeSkillGap(profile, career);
  const matchScore = matches?.find((m) => m.career.id === career.id)?.score;

  const all = career.requiredSkills.map((req) => ({
    name: req.name,
    level: (profile.skills[req.name] ?? 0) as number,
    needed: req.level,
  }));

  return (
    <div className="space-y-5">
      <SectionTitle
        title={t("skillGap")}
        sub={`Your skills vs ${career.title} requirements`}
        right={
          <div className="flex items-center gap-3">
            {matchScore != null && <Badge tone="blue">Match {matchScore}%</Badge>}
            <Badge tone={gap.readiness >= 70 ? "green" : gap.readiness >= 45 ? "amber" : "red"}>
              Readiness {gap.readiness}%
            </Badge>
          </div>
        }
      />

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Visual comparison */}
        <div className="card p-5 lg:col-span-2">
          <p className="label mb-4">Skill comparison</p>
          <div className="space-y-4">
            {all.map((s) => <SkillBar key={s.name} {...s} />)}
          </div>
        </div>

        {/* Readiness */}
        <div className="card p-5 flex flex-col items-center justify-center text-center">
          <ScoreRing value={gap.readiness} size={110} label="ready" />
          <p className="text-sm font-semibold mt-3">{career.title}</p>
          <p className="text-xs muted mt-1">
            {gap.readiness >= 70
              ? "You're close — polish projects and apply."
              : gap.readiness >= 45
              ? "Good base. Close the priority gaps below."
              : "Early stage — follow the roadmap step by step."}
          </p>
          <Link href="/roadmap" className="btn btn-primary !py-1.5 text-xs mt-4">
            Go to roadmap <ArrowRight size={13} />
          </Link>
        </div>
      </div>

      {/* Categories */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="grid place-items-center h-7 w-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"><Star size={14} /></span>
            <p className="font-semibold text-sm">{t("strongSkills")}</p>
          </div>
          {gap.strong.length ? (
            <div className="flex flex-wrap gap-1.5">
              {gap.strong.map((s) => <Badge key={s} tone="green">{s}</Badge>)}
            </div>
          ) : (
            <p className="text-xs muted">None yet — keep learning.</p>
          )}
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="grid place-items-center h-7 w-7 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400"><GitCompareArrows size={14} /></span>
            <p className="font-semibold text-sm">{t("toImprove")}</p>
          </div>
          {gap.improve.length ? (
            <div className="space-y-2">
              {gap.improve.map((s) => (
                <div key={s.name} className="text-xs">
                  <div className="flex justify-between"><span className="font-medium">{s.name}</span><span className="muted">L{s.level} → L{s.needed}</span></div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs muted">Nothing to improve right now.</p>
          )}
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="grid place-items-center h-7 w-7 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400"><GitCompareArrows size={14} /></span>
            <p className="font-semibold text-sm">{t("missing")}</p>
          </div>
          {gap.missing.length ? (
            <div className="flex flex-wrap gap-1.5">
              {gap.missing.map((s) => <Badge key={s} tone="red">{s}</Badge>)}
            </div>
          ) : (
            <p className="text-xs muted">You've covered every required skill.</p>
          )}
        </div>

        <div className="card p-5 ring-1 ring-brand-500/30">
          <div className="flex items-center gap-2 mb-3">
            <span className="grid place-items-center h-7 w-7 rounded-lg bg-brand-500/10 text-brand-600 dark:text-brand-300"><Sparkles size={14} /></span>
            <p className="font-semibold text-sm">{t("priority")}</p>
          </div>
          {gap.priority.length ? (
            <ol className="space-y-2">
              {gap.priority.slice(0, 4).map((s, i) => (
                <li key={s.name} className="flex items-center gap-2 text-xs">
                  <span className="grid place-items-center h-5 w-5 rounded-full bg-brand-500/15 text-brand-600 dark:text-brand-300 text-[10px] font-bold">{i + 1}</span>
                  <span className="font-medium">{s.name}</span>
                  <span className="muted">L{s.level}→L{s.needed}</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-xs muted">You're all caught up!</p>
          )}
        </div>
      </div>
    </div>
  );
}
