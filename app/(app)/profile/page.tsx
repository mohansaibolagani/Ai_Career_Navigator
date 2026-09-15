"use client";

import { useState } from "react";
import { useStore, useT } from "@/lib/store";
import { DEGREES, BRANCHES, INTEREST_AREAS, CORE_SKILLS } from "@/lib/data";
import type { Degree, Branch, SkillLevel } from "@/lib/types";
import { SectionTitle, Badge } from "@/components/ui";
import { Loader2, Save } from "lucide-react";

export default function ProfilePage() {
  const t = useT();
  const profile = useStore((s) => s.profile);
  const setProfile = useStore((s) => s.setProfile);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  const [form, setForm] = useState(() => ({
    name: profile?.name ?? "",
    college: profile?.college ?? "",
    degree: (profile?.degree ?? "B.Tech") as Degree,
    branch: (profile?.branch ?? "CSE") as Branch,
    gradYear: profile?.gradYear ?? 2027,
    interests: profile?.interests ?? [],
    skills: profile?.skills ?? {},
  }));

  if (!profile) return null;

  const toggle = (list: string[], item: string) =>
    list.includes(item) ? list.filter((x) => x !== item) : [...list, item];

  const save = async () => {
    setBusy(true);
    setProfile({ ...profile, ...form });
    await new Promise((r) => setTimeout(r, 300));
    setBusy(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="max-w-3xl space-y-5">
      <SectionTitle title={t("myProfile")} sub="Everything here powers your matches, gap analysis and coaching." />

      <div className="card p-6 space-y-5">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Full name</label>
            <input className="input mt-1" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="label">College</label>
            <input className="input mt-1" value={form.college} onChange={(e) => setForm({ ...form, college: e.target.value })} />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input mt-1" value={profile.email} disabled />
          </div>
          <div>
            <label className="label">Graduation year</label>
            <select className="input mt-1" value={form.gradYear}
              onChange={(e) => setForm({ ...form, gradYear: Number(e.target.value) as typeof form.gradYear })}>
              {[2026, 2027, 2028, 2029].map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="label">Degree</label>
          <div className="flex flex-wrap gap-2 mt-1.5">
            {DEGREES.map((d) => (
              <button key={d} onClick={() => setForm({ ...form, degree: d })}
                className={`badge !px-3 !py-1.5 cursor-pointer ${form.degree === d ? "badge-blue" : "surface muted"}`}>
                {d}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="label">Branch</label>
          <div className="flex flex-wrap gap-2 mt-1.5">
            {BRANCHES.map((b) => (
              <button key={b} onClick={() => setForm({ ...form, branch: b })}
                className={`badge !px-3 !py-1.5 cursor-pointer ${form.branch === b ? "badge-blue" : "surface muted"}`}>
                {b}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="label">Interests ({form.interests.length} selected)</label>
          <div className="flex flex-wrap gap-2 mt-1.5">
            {INTEREST_AREAS.map((i) => (
              <button key={i} onClick={() => setForm({ ...form, interests: toggle(form.interests, i) })}
                className={`badge !px-3 !py-1.5 cursor-pointer ${form.interests.includes(i) ? "badge-blue" : "surface muted"}`}>
                {i}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="label">Skills (0–5)</label>
          <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2 mt-2 max-h-96 overflow-y-auto pr-1">
            {CORE_SKILLS.map((s) => (
              <div key={s} className="flex items-center justify-between gap-3">
                <span className="text-sm truncate">{s}</span>
                <div className="flex gap-1 shrink-0">
                  {[0, 1, 2, 3, 4, 5].map((lvl) => (
                    <button key={lvl}
                      onClick={() => setForm({ ...form, skills: { ...form.skills, [s]: lvl as SkillLevel } })}
                      className={`h-6 w-6 rounded-md text-[10px] font-bold ${
                        (form.skills[s] ?? 0) >= lvl && (form.skills[s] ?? 0) > 0
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
        </div>

        <div className="flex items-center gap-3 pt-2 border-t">
          <button className="btn btn-primary" onClick={save} disabled={busy}>
            {busy ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} {t("save")}
          </button>
          {saved && <Badge tone="green">Profile updated — matches recalculated</Badge>}
        </div>
      </div>
    </div>
  );
}
