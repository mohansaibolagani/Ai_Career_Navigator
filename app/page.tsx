"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/api";
import { useStore } from "@/lib/store";
import {
  Compass,
  GitCompareArrows,
  Map,
  FolderKanban,
  FileText,
  BotMessageSquare,
  ClipboardList,
  LayoutDashboard,
  ArrowRight,
  Sparkles,
  Languages,
  GraduationCap,
  Loader2,
} from "lucide-react";

const FEATURES = [
  { icon: ClipboardList, title: "AI Interest Assessment", body: "A 10-question assessment maps your interests to career families — built for every degree, not just coding." },
  { icon: Compass, title: "Career Recommendations", body: "Ranked career matches with match %, reasons, required vs missing skills for your exact degree + branch." },
  { icon: GitCompareArrows, title: "Skill Gap Analysis", body: "See strong skills, skills to improve, missing skills and a high-priority list — visually." },
  { icon: Map, title: "Personalized Roadmap", body: "A stage-by-stage timeline with goals, tasks, projects and durations that adapts to your gaps." },
  { icon: FolderKanban, title: "Project Recommendations", body: "Beginner to advanced projects chosen for your target career and skill gaps." },
  { icon: FileText, title: "Resume Analyzer", body: "Upload PDF/DOCX for resume score, ATS score, career alignment, keywords and fixes." },
  { icon: BotMessageSquare, title: "AI Career Coach", body: "A coach that knows your profile, gaps and roadmap — and answers in 8 Indian languages." },
  { icon: LayoutDashboard, title: "Student Dashboard", body: "Goal, match score, roadmap progress, next step and resume score — all in one view." },
];

const JOURNEY = [
  "Sign Up", "Student Profile", "Interest Assessment", "Career Recommendations",
  "Select Target Career", "Skill Gap Analysis", "Personalized Roadmap",
  "Projects", "Resume Analyzer", "AI Career Coach",
];

export default function Landing() {
  const router = useRouter();
  const hydrate = useStore((s) => s.hydrate);
  const [loading, setLoading] = useState<"demo" | null>(null);

  const startDemo = async () => {
    setLoading("demo");
    try {
      await api.auth("demo");
      await hydrate();
      router.push("/dashboard");
    } catch {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Nav */}
      <header className="sticky top-0 z-30 border-b surface/90 backdrop-blur">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-5 py-3">
          <div className="flex items-center gap-2">
            <span className="grid place-items-center h-8 w-8 rounded-lg bg-gradient-to-br from-brand-600 to-brand-400 text-white">
              <Compass size={18} />
            </span>
            <span className="font-bold">AI Career Navigator</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/login" className="btn btn-ghost">Log in</Link>
            <Link href="/signup" className="btn btn-primary">Sign up free</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_50%_0%,rgba(61,103,236,0.14),transparent)]" />
        <div className="max-w-6xl mx-auto px-5 pt-16 pb-14 text-center">
          <span className="badge badge-blue mx-auto">
            <Sparkles size={12} /> AI Career Navigator Agent
          </span>
          <h1 className="mt-4 text-4xl sm:text-6xl font-extrabold tracking-tight leading-[1.05]">
            Discover Your Career.
            <br />
            <span className="bg-gradient-to-r from-brand-600 to-brand-400 bg-clip-text text-transparent">
              Build Your Skills. Reach Your Goal.
            </span>
          </h1>
          <p className="mt-5 text-base sm:text-lg muted max-w-2xl mx-auto">
            AI-powered career discovery, skill gap analysis and personalized
            roadmaps for B.Tech, B.E., BCA, B.Sc, BBA, B.Com, BA — every
            undergraduate degree and branch.
          </p>
          <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button className="btn btn-primary !px-6 !py-3" onClick={startDemo} disabled={loading === "demo"}>
              {loading === "demo" ? <Loader2 className="animate-spin" size={17} /> : <Sparkles size={17} />}
              Try the live demo student
            </button>
            <Link href="/signup" className="btn btn-ghost !px-6 !py-3">
              Create my account <ArrowRight size={16} />
            </Link>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-xs muted">
            <span className="inline-flex items-center gap-1"><GraduationCap size={13} /> All degrees & 15+ branches</span>
            <span className="inline-flex items-center gap-1"><Languages size={13} /> 8 Indian languages</span>
            <span className="inline-flex items-center gap-1"><Sparkles size={13} /> Works with your own AI key</span>
          </div>
        </div>

        {/* Dashboard preview */}
        <div className="max-w-4xl mx-auto px-5 pb-16">
          <div className="card overflow-hidden rounded-2xl shadow-pop">
            <div className="flex items-center gap-1.5 px-4 py-2.5 border-b">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              <span className="ml-3 text-xs muted">AI Career Navigator — Dashboard</span>
            </div>
            <div className="grid sm:grid-cols-3 gap-3 p-4 text-left">
              {[
                ["Career Goal", "Machine Learning Engineer"],
                ["Career Match Score", "91%"],
                ["Roadmap Progress", "45%"],
                ["Current Phase", "Machine Learning Core"],
                ["Recommended Next Step", "Start ML fundamentals"],
                ["Resume Score", "—"],
              ].map(([k, v]) => (
                <div key={k} className="card p-3">
                  <p className="label">{k}</p>
                  <p className="text-sm font-semibold mt-1">{v}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-5 pb-16">
        <h2 className="text-2xl font-bold text-center">Everything a student needs to go from confused to career-ready</h2>
        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="card p-5">
              <span className="grid place-items-center h-9 w-9 rounded-lg bg-brand-600/10 text-brand-600 dark:text-brand-300">
                <f.icon size={18} />
              </span>
              <h3 className="font-semibold text-sm mt-3">{f.title}</h3>
              <p className="text-[13px] muted mt-1 leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Journey */}
      <section className="max-w-6xl mx-auto px-5 pb-20">
        <div className="card p-6 sm:p-8">
          <h2 className="text-xl font-bold text-center">Your journey in the app</h2>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            {JOURNEY.map((step, i) => (
              <span key={step} className="inline-flex items-center gap-2">
                <span className="badge surface">{i + 1}. {step}</span>
                {i < JOURNEY.length - 1 && <ArrowRight size={12} className="muted" />}
              </span>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t py-6 text-center text-xs muted">
        AI Career Navigator Agent — Discover Your Career. Build Your Skills. Reach Your Goal.
      </footer>
    </div>
  );
}
