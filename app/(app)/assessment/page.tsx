"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useStore, useT } from "@/lib/store";
import { ASSESSMENT_QUESTIONS } from "@/lib/data";
import type { SkillLevel, StudentProfile } from "@/lib/types";
import { SectionTitle, ProgressBar, Badge } from "@/components/ui";
import { ClipboardList, CheckCircle2, Sparkles } from "lucide-react";

export default function Assessment() {
  const t = useT();
  const router = useRouter();
  const profile = useStore((s) => s.profile);
  const setProfile = useStore((s) => s.setProfile);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});

  const questions = ASSESSMENT_QUESTIONS;
  const q = questions[idx];
  const answered = Object.keys(answers).length;
  const pct = Math.round((answered / questions.length) * 100);

  const tallies = useMemo(() => {
    const counts: Record<string, number> = {};
    const skills: Record<string, SkillLevel> = {};
    for (const [qid, optIdx] of Object.entries(answers)) {
      const question = questions.find((x) => x.id === qid);
      const opt = question?.options[optIdx];
      if (!opt) continue;
      for (const i of opt.interests) counts[i] = (counts[i] ?? 0) + 1;
      for (const [k, v] of Object.entries(opt.skills ?? {})) {
        skills[k] = Math.max(skills[k] ?? 0, v ?? 0) as SkillLevel;
      }
    }
    return { counts, skills };
  }, [answers, questions]);

  const choose = (optIdx: number) => {
    setAnswers((prev) => ({ ...prev, [q.id]: optIdx }));
    setTimeout(() => {
      if (idx < questions.length - 1) setIdx((i) => i + 1);
    }, 220);
  };

  const finish = () => {
    if (!profile) return;
    const counts = tallies.counts;
    const top = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([i]) => i);
    const mergedSkills = { ...profile.skills };
    for (const [k, v] of Object.entries(tallies.skills)) {
      mergedSkills[k] = Math.max(mergedSkills[k] ?? 0, v) as SkillLevel;
    }
    const updated: StudentProfile = {
      ...profile,
      interests: Array.from(new Set([...top, ...profile.interests])).slice(0, 6),
      skills: mergedSkills,
    };
    setProfile(updated);
    router.push("/careers");
  };

  return (
    <div className="max-w-2xl mx-auto">
      <SectionTitle
        title={t("assessment")}
        sub="10 quick questions — we map your answers to career families and skill signals."
      />

      <ProgressBar value={pct} />
      <p className="text-xs muted mt-1.5 mb-4">{answered} of {questions.length} answered</p>

      <div className="card p-6" key={q.id}>
        <div className="flex items-center gap-2 mb-4">
          <span className="grid place-items-center h-7 w-7 rounded-lg bg-brand-600/10 text-brand-600 dark:text-brand-300 text-xs font-bold">
            {idx + 1}
          </span>
          <h2 className="font-semibold">{q.question}</h2>
        </div>
        <div className="space-y-2">
          {q.options.map((opt, i) => {
            const selected = answers[q.id] === i;
            return (
              <button
                key={opt.label}
                onClick={() => choose(i)}
                className={`w-full text-left rounded-xl border px-4 py-3 text-sm transition-all ${
                  selected
                    ? "border-brand-500 bg-brand-500/10 font-medium"
                    : "border-[var(--border)] hover:border-brand-400 hover:bg-brand-500/5"
                }`}
              >
                {opt.label}
                {selected && <CheckCircle2 size={16} className="inline ml-2 text-brand-500" />}
              </button>
            );
          })}
        </div>
        <div className="flex justify-between mt-5">
          <button className="btn btn-ghost" disabled={idx === 0} onClick={() => setIdx((i) => i - 1)}>Back</button>
          {answered === questions.length && idx === questions.length - 1 ? (
            <button className="btn btn-primary" onClick={finish}>
              <Sparkles size={15} /> See my career matches
            </button>
          ) : (
            <button className="btn btn-ghost" disabled={idx === questions.length - 1} onClick={() => setIdx((i) => i + 1)}>
              Skip
            </button>
          )}
        </div>
      </div>

      {answered > 0 && (
        <div className="card p-5 mt-4">
          <p className="label mb-2">Live interest signal</p>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(tallies.counts).sort((a, b) => b[1] - a[1]).map(([i, c]) => (
              <Badge key={i} tone={c >= 2 ? "blue" : "neutral"}>{i} × {c}</Badge>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 text-xs muted mt-4">
        <ClipboardList size={13} /> Your answers refine career matches, skill gap and roadmap priority.
      </div>
    </div>
  );
}
