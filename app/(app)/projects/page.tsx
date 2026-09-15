"use client";

import { useEffect, useMemo, useState } from "react";
import { useStore, useT } from "@/lib/store";
import { CAREERS } from "@/lib/data";
import { recommendedProjects } from "@/lib/engine";
import { SectionTitle, Badge, EmptyState } from "@/components/ui";
import { FolderKanban, Bookmark, BookmarkCheck, Rocket } from "lucide-react";

const FILTERS = ["All", "Beginner", "Intermediate", "Advanced"] as const;

export default function Projects() {
  const t = useT();
  const profile = useStore((s) => s.profile);
  const matches = useStore((s) => s.matches);
  const loadMatches = useStore((s) => s.loadMatches);
  const selected = useStore((s) => s.selectedProjects);
  const toggleProject = useStore((s) => s.toggleProject);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");

  useEffect(() => {
    loadMatches();
  }, [loadMatches]);

  const career = profile?.targetCareerId
    ? CAREERS.find((c) => c.id === profile.targetCareerId) ?? null
    : null;

  const projects = useMemo(() => {
    if (!profile) return [];
    return recommendedProjects(profile, career);
  }, [profile, career]);

  if (!profile) return null;

  const shown = filter === "All" ? projects : projects.filter((p) => p.difficulty === filter);

  return (
    <div className="space-y-5">
      <SectionTitle
        title={t("projects")}
        sub={career ? `Ranked for ${career.title}${matches ? "" : " (local)"}` : "Ranked by your skill gaps — select a career for sharper recommendations"}
        right={
          <div className="flex gap-1.5">
            {FILTERS.map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className={`badge !px-3 !py-1.5 cursor-pointer ${filter === f ? "badge-blue" : "surface muted"}`}>
                {f}
              </button>
            ))}
          </div>
        }
      />

      {shown.length === 0 ? (
        <EmptyState title="No projects" body="Complete your profile to get recommendations." />
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {shown.map((p, i) => {
            const saved = selected.includes(p.id);
            const topPick = career && p.careers.includes(career.id) && i < 3;
            return (
              <div key={p.id} className="card p-5 flex flex-col">
                <div className="flex items-start justify-between gap-2">
                  <span className="grid place-items-center h-9 w-9 rounded-lg bg-brand-600/10 text-brand-600 dark:text-brand-300 shrink-0">
                    <FolderKanban size={17} />
                  </span>
                  <div className="flex flex-col items-end gap-1.5">
                    <Badge tone={p.difficulty === "Beginner" ? "green" : p.difficulty === "Intermediate" ? "amber" : "red"}>
                      {p.difficulty}
                    </Badge>
                    {topPick && <Badge tone="blue"><Rocket size={10} /> Top pick</Badge>}
                  </div>
                </div>
                <h3 className="font-semibold text-sm mt-3">{p.name}</h3>
                <p className="text-xs muted mt-1 flex-1">{p.why}</p>

                <div className="mt-3">
                  <p className="label">{t("technologies")}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {p.technologies.map((tech) => <Badge key={tech} tone="neutral">{tech}</Badge>)}
                  </div>
                </div>
                <div className="mt-2.5">
                  <p className="label">{t("skillsDeveloped")}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {p.skills.map((s) => <Badge key={s} tone="blue">{s}</Badge>)}
                  </div>
                </div>
                <p className="text-[11px] muted mt-2.5"><span className="font-medium">Outcome:</span> {p.outcome}</p>

                <div className="flex gap-2 mt-4">
                  <button
                    className={`btn flex-1 !py-1.5 text-xs ${saved ? "btn-ghost" : "btn-primary"}`}
                    onClick={() => toggleProject(p.id)}
                  >
                    {saved ? <><BookmarkCheck size={13} /> Saved</> : <><Bookmark size={13} /> {t("startProject")}</>}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selected.length > 0 && (
        <div className="card p-4 flex items-center gap-2 text-xs muted">
          <BookmarkCheck size={14} className="text-brand-500" />
          {selected.length} project{selected.length > 1 ? "s" : ""} saved — they appear on your dashboard suggestions.
        </div>
      )}
    </div>
  );
}
