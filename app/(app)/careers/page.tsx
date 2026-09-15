"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore, useT } from "@/lib/store";
import { computeMatches } from "@/lib/engine";
import { CAREERS } from "@/lib/data";
import { SectionTitle, Badge, ScoreRing } from "@/components/ui";
import { Compass, Check, ArrowRight, Loader2, Sparkles } from "lucide-react";

export default function Careers() {
  const t = useT();
  const router = useRouter();
  const profile = useStore((s) => s.profile);
  const matches = useStore((s) => s.matches);
  const loadMatches = useStore((s) => s.loadMatches);
  const selectCareer = useStore((s) => s.selectCareer);
  const [busy, setBusy] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    loadMatches();
  }, [loadMatches]);

  if (!profile) return null;

  const list = matches ?? computeMatches(profile);
  const top = list[0];

  const onSelect = async (id: string) => {
    setBusy(id);
    try {
      await selectCareer(id);
      router.push("/skill-gap");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div>
      <SectionTitle
        title={t("careers")}
        sub="Ranked by your degree, branch, interests and current skills. Pick one to unlock gap analysis and roadmap."
        right={<Badge tone="blue"><Sparkles size={12} /> {list.length} careers evaluated</Badge>}
      />

      <div className="grid md:grid-cols-2 gap-4">
        {list.map((m) => {
          const isSelected = profile.targetCareerId === m.career.id;
          const isOpen = expanded === m.career.id;
          return (
            <div key={m.career.id} className={`card p-5 ${isSelected ? "ring-2 ring-brand-500" : ""}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{m.career.title}</h3>
                    {isSelected && <Badge tone="green"><Check size={11} /> Target</Badge>}
                    {m.career.id === top.career.id && !isSelected && <Badge tone="blue">Top match</Badge>}
                  </div>
                  <p className="text-xs muted mt-1">{m.career.tagline}</p>
                </div>
                <ScoreRing value={m.score} size={64} />
              </div>

              <div className="flex flex-wrap gap-1.5 mt-3">
                <Badge tone="neutral">{m.career.family}</Badge>
                <Badge tone={m.career.demand === "Very High" || m.career.demand === "High" ? "green" : "amber"}>
                  {m.career.demand} demand
                </Badge>
                <Badge tone="neutral">{m.career.avgSalaryLPA}</Badge>
              </div>

              <div className="mt-4">
                <p className="label">{t("whyThisCareer")}</p>
                <ul className="mt-1.5 space-y-1">
                  {m.reasons.slice(0, 3).map((r) => (
                    <li key={r} className="text-[13px] muted flex gap-1.5"><span className="text-brand-500">•</span>{r}</li>
                  ))}
                </ul>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                <div className="rounded-lg bg-emerald-500/10 py-2">
                  <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{m.have.length}</p>
                  <p className="text-[10px] muted">Ready</p>
                </div>
                <div className="rounded-lg bg-amber-500/10 py-2">
                  <p className="text-sm font-bold text-amber-600 dark:text-amber-400">{m.improving.length}</p>
                  <p className="text-[10px] muted">Improving</p>
                </div>
                <div className="rounded-lg bg-rose-500/10 py-2">
                  <p className="text-sm font-bold text-rose-600 dark:text-rose-400">{m.missing.length}</p>
                  <p className="text-[10px] muted">Missing</p>
                </div>
              </div>

              {isOpen && (
                <div className="mt-4 space-y-3 border-t pt-4">
                  <div>
                    <p className="label">{t("requiredSkills")}</p>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {m.career.requiredSkills.map((s) => (
                        <Badge key={s.name} tone={m.have.includes(s.name) ? "green" : m.improving.includes(s.name) ? "amber" : "red"}>
                          {s.name} · L{s.level}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  {m.missing.length > 0 && (
                    <div>
                      <p className="label">{t("missingSkills")}</p>
                      <p className="text-[13px] muted mt-1">{m.missing.join(", ")}</p>
                    </div>
                  )}
                  <div>
                    <p className="label">Recommended roadmap</p>
                    <p className="text-[13px] muted mt-1">
                      {m.career.roadmap.map((s) => s.title).join(" → ")}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex gap-2 mt-4">
                <button className="btn btn-primary flex-1 !py-1.5 text-xs" disabled={busy === m.career.id} onClick={() => onSelect(m.career.id)}>
                  {busy === m.career.id ? <Loader2 size={13} className="animate-spin" /> : <Compass size={13} />}
                  {isSelected ? "Re-select as target" : t("selectCareer")}
                </button>
                <button className="btn btn-ghost !py-1.5 text-xs" onClick={() => setExpanded(isOpen ? null : m.career.id)}>
                  {isOpen ? "Less" : "Details"} <ArrowRight size={12} className={isOpen ? "rotate-90" : ""} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
