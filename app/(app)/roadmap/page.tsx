"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useStore, useT } from "@/lib/store";
import { CAREERS } from "@/lib/data";
import { personalizeRoadmap } from "@/lib/engine";
import { SectionTitle, Badge, ProgressBar, EmptyState } from "@/components/ui";
import { Map, CheckCircle2, Circle, Clock, FolderKanban, Target, ArrowRight } from "lucide-react";

export default function Roadmap() {
  const t = useT();
  const profile = useStore((s) => s.profile);
  const roadmap = useStore((s) => s.roadmap);
  const loadMatches = useStore((s) => s.loadMatches);
  const doneTasks = useStore((s) => s.doneTasks);
  const toggleTask = useStore((s) => s.toggleTask);

  useEffect(() => {
    loadMatches();
  }, [loadMatches]);

  if (!profile) return null;
  if (!profile.targetCareerId) {
    return (
      <EmptyState
        title="No roadmap yet"
        body="Select a target career and we'll generate a stage-by-stage timeline tailored to your skill gaps."
        action={<Link href="/careers" className="btn btn-primary">{t("selectCareer")}</Link>}
      />
    );
  }

  const career = CAREERS.find((c) => c.id === profile.targetCareerId)!;
  const stages = roadmap ?? personalizeRoadmap(profile, career);
  const totalTasks = stages.reduce((n, s) => n + s.tasks.length, 0);
  const doneTotal = stages.reduce((n, s) => n + (doneTasks[s.id]?.length ?? 0), 0);
  const overall = totalTasks ? Math.round((doneTotal / totalTasks) * 100) : 0;

  return (
    <div className="space-y-5">
      <SectionTitle
        title={t("roadmap")}
        sub={`${career.title} · ${stages.length} stages`}
        right={<Badge tone="blue">{overall}% complete</Badge>}
      />
      <ProgressBar value={overall} />

      <div className="relative">
        {/* timeline spine */}
        <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-brand-500 via-brand-400/50 to-transparent" />
        <div className="space-y-4">
          {stages.map((stage, i) => {
            const done = doneTasks[stage.id] ?? [];
            const pct = Math.round((done.length / stage.tasks.length) * 100);
            const complete = pct === 100;
            return (
              <div key={stage.id} className="relative pl-12">
                {/* node */}
                <span className={`absolute left-0 top-4 grid place-items-center h-10 w-10 rounded-full border-2 ${
                  complete ? "bg-emerald-500 border-emerald-500 text-white" : "surface border-brand-500 text-brand-600 dark:text-brand-300"
                }`}>
                  {complete ? <CheckCircle2 size={18} /> : <span className="text-sm font-bold">{i + 1}</span>}
                </span>

                <div className="card p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold">{stage.title}</h3>
                      <p className="text-xs muted mt-0.5 flex items-center gap-1"><Clock size={11} /> {stage.duration}</p>
                    </div>
                    <Badge tone={complete ? "green" : pct > 0 ? "blue" : "neutral"}>{pct}%</Badge>
                  </div>

                  <div className="mt-3"><ProgressBar value={pct} color={complete ? "bg-emerald-500" : "bg-brand-500"} /></div>

                  <div className="grid sm:grid-cols-2 gap-4 mt-4">
                    <div>
                      <p className="label mb-1.5 flex items-center gap-1"><Target size={11} /> {t("learningGoals")}</p>
                      <ul className="space-y-1">
                        {stage.goals.map((g) => (
                          <li key={g} className="text-[13px] muted flex gap-1.5"><span className="text-brand-500">•</span>{g}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="label mb-1.5">{t("tasks")}</p>
                      <div className="space-y-1.5">
                        {stage.tasks.map((task) => {
                          const isDone = done.includes(task);
                          return (
                            <button key={task} onClick={() => toggleTask(stage.id, task)}
                              className="flex items-start gap-2 text-left text-[13px] group">
                              {isDone
                                ? <CheckCircle2 size={15} className="text-emerald-500 shrink-0 mt-px" />
                                : <Circle size={15} className="text-black/25 dark:text-white/25 shrink-0 mt-px group-hover:text-brand-500" />}
                              <span className={isDone ? "line-through muted" : ""}>{task}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {stage.projects.length > 0 && (
                    <div className="mt-4 pt-3 border-t flex items-center justify-between gap-3">
                      <p className="text-xs muted flex items-center gap-1.5">
                        <FolderKanban size={13} /> <span><span className="font-medium text-[var(--text)]">Projects:</span> {stage.projects.join(", ")}</span>
                      </p>
                      <Link href="/projects" className="text-xs font-medium text-brand-600 dark:text-brand-300 inline-flex items-center gap-1 shrink-0">
                        Find projects <ArrowRight size={11} />
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="card p-5 flex items-center gap-3">
        <Map size={18} className="text-brand-500 shrink-0" />
        <p className="text-xs muted">
          Tick tasks as you complete them — progress is saved on this device and reflected on your dashboard.
        </p>
      </div>
    </div>
  );
}
