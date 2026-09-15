"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { api } from "@/lib/api";
import { DEGREES, BRANCHES, INTEREST_AREAS, CORE_SKILLS } from "@/lib/data";
import type { Degree, Branch, StudentProfile, SkillLevel } from "@/lib/types";
import { Compass, ArrowRight, ArrowLeft, Loader2 } from "lucide-react";

const GRAD_YEARS = [2026, 2027, 2028, 2029];

export default function Onboarding() {
  const router = useRouter();
  const user = useStore((s) => s.user);
  const profile = useStore((s) => s.profile);
  const setProfile = useStore((s) => s.setProfile);
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState(profile?.name ?? user?.name ?? user?.email?.split("@")[0] ?? "");
  const [degree, setDegree] = useState<Degree>(profile?.degree ?? "B.Tech");
  const [branch, setBranch] = useState<Branch>(profile?.branch ?? "CSE");
  const [college, setCollege] = useState(profile?.college ?? "");
  const [gradYear, setGradYear] = useState(profile?.gradYear ?? 2027);
  const [interests, setInterests] = useState<string[]>(profile?.interests ?? []);
  const [skills, setSkills] = useState<Record<string, SkillLevel>>(profile?.skills ?? {});

  const toggleInterest = (i: string) =>
    setInterests((prev) => (prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]));

  const finish = async () => {
    setBusy(true);
    const p: StudentProfile = {
      id: user?.id ?? "student",
      name: name.trim() || "Student",
      email: user?.email ?? "",
      degree,
      branch,
      college: college.trim(),
      gradYear,
      interests,
      skills,
      targetCareerId: profile?.targetCareerId ?? null,
      onboarded: true,
      language: profile?.language ?? "en",
      createdAt: profile?.createdAt ?? new Date().toISOString(),
    };
    setProfile(p);
    await api.saveProfile(p).catch(() => {});
    router.replace("/assessment");
  };

  const steps = ["About you", "Degree & branch", "Interests", "Skills"];
  const canNext =
    (step === 0 && name.trim().length > 1) ||
    step === 1 ||
    (step === 2 && interests.length > 0) ||
    step === 3;

  return (
    <div className="min-h-screen grid place-items-center px-4 py-10">
      <div className="w-full max-w-xl">
        <div className="text-center mb-6">
          <span className="inline-grid place-items-center h-11 w-11 rounded-xl bg-gradient-to-br from-brand-600 to-brand-400 text-white">
            <Compass size={22} />
          </span>
          <h1 className="text-xl font-bold mt-3">Build your student profile</h1>
          <p className="text-sm muted">This powers your career matches and roadmap</p>
        </div>

        {/* Stepper */}
        <div className="flex items-center gap-2 mb-5">
          {steps.map((s, i) => (
            <div key={s} className="flex-1">
              <div className={`h-1.5 rounded-full ${i <= step ? "bg-brand-500" : "bg-black/10 dark:bg-white/10"}`} />
              <p className={`text-[10px] mt-1 ${i === step ? "font-semibold text-brand-600 dark:text-brand-300" : "muted"}`}>{s}</p>
            </div>
          ))}
        </div>

        <div className="card p-6">
          {step === 0 && (
            <div className="space-y-3">
              <div>
                <label className="label">Full name</label>
                <input className="input mt-1" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
              </div>
              <div>
                <label className="label">College</label>
                <input className="input mt-1" value={college} onChange={(e) => setCollege(e.target.value)} placeholder="e.g. JNTU Hyderabad" />
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-3">
              <div>
                <label className="label">Degree</label>
                <div className="flex flex-wrap gap-2 mt-1.5">
                  {DEGREES.map((d) => (
                    <button key={d} type="button" onClick={() => setDegree(d)}
                      className={`badge !px-3 !py-1.5 ${degree === d ? "badge-blue" : "surface muted"}`}>
                      {d}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="label">Branch</label>
                <div className="flex flex-wrap gap-2 mt-1.5">
                  {BRANCHES.map((b) => (
                    <button key={b} type="button" onClick={() => setBranch(b)}
                      className={`badge !px-3 !py-1.5 ${branch === b ? "badge-blue" : "surface muted"}`}>
                      {b}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="label">Graduation year</label>
                <div className="flex gap-2 mt-1.5">
                  {GRAD_YEARS.map((y) => (
                    <button key={y} type="button" onClick={() => setGradYear(y as typeof gradYear)}
                      className={`badge !px-3 !py-1.5 ${gradYear === y ? "badge-blue" : "surface muted"}`}>
                      {y}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <label className="label">Pick at least one interest</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {INTEREST_AREAS.map((i) => (
                  <button key={i} type="button" onClick={() => toggleInterest(i)}
                    className={`badge !px-3 !py-1.5 ${interests.includes(i) ? "badge-blue" : "surface muted"}`}>
                    {i}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <label className="label">Rate your skills (0 = none)</label>
              <div className="mt-2 space-y-2 max-h-72 overflow-y-auto pr-1">
                {CORE_SKILLS.map((s) => (
                  <div key={s} className="flex items-center justify-between gap-3">
                    <span className="text-sm">{s}</span>
                    <div className="flex gap-1">
                      {[0, 1, 2, 3, 4, 5].map((lvl) => (
                        <button key={lvl} type="button"
                          onClick={() => setSkills((prev) => ({ ...prev, [s]: lvl as SkillLevel }))}
                          className={`h-6 w-6 rounded-md text-[10px] font-bold ${
                            (skills[s] ?? 0) >= lvl && (skills[s] ?? 0) > 0
                              ? "bg-brand-500 text-white"
                              : "surface muted"
                          }`}>
                          {lvl}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-[11px] muted mt-2">You can update these anytime from My Profile.</p>
            </div>
          )}

          <div className="flex justify-between mt-6">
            <button className="btn btn-ghost" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
              <ArrowLeft size={15} /> Back
            </button>
            {step < 3 ? (
              <button className="btn btn-primary" disabled={!canNext} onClick={() => setStep((s) => s + 1)}>
                Continue <ArrowRight size={15} />
              </button>
            ) : (
              <button className="btn btn-primary" disabled={busy} onClick={finish}>
                {busy && <Loader2 size={15} className="animate-spin" />} Finish & see careers
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
