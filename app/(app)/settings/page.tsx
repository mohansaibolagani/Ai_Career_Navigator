"use client";

import { useStore, useT } from "@/lib/store";
import { LANGUAGES } from "@/lib/i18n";
import { SectionTitle, Badge } from "@/components/ui";
import { Languages, Sun, Moon, KeyRound, UserRound } from "lucide-react";

export default function Settings() {
  const t = useT();
  const theme = useStore((s) => s.theme);
  const setTheme = useStore((s) => s.setTheme);
  const lang = useStore((s) => s.lang);
  const setLang = useStore((s) => s.setLang);
  const profile = useStore((s) => s.profile);
  const user = useStore((s) => s.user);

  return (
    <div className="max-w-2xl space-y-5">
      <SectionTitle title={t("settings")} sub="Language, appearance and AI configuration." />

      <div className="card p-6">
        <p className="label flex items-center gap-1.5 mb-3"><Languages size={13} /> {t("language")}</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {LANGUAGES.map((l) => (
            <button key={l.code} onClick={() => setLang(l.code)}
              className={`rounded-xl border px-3 py-2.5 text-sm transition-colors ${
                lang === l.code
                  ? "border-brand-500 bg-brand-500/10 font-semibold text-brand-700 dark:text-brand-300"
                  : "border-[var(--border)] hover:border-brand-400"
              }`}>
              <span className="block font-medium">{l.nativeLabel}</span>
              <span className="block text-[11px] muted">{l.label}</span>
            </button>
          ))}
        </div>
        <p className="text-xs muted mt-3">
          The AI Career Coach replies in the selected language. Technical terms (Python, SQL, Machine Learning, GitHub, Docker) stay in English.
        </p>
      </div>

      <div className="card p-6">
        <p className="label flex items-center gap-1.5 mb-3"><Sun size={13} /> {t("theme")}</p>
        <div className="flex gap-2">
          {(["light", "dark"] as const).map((mode) => (
            <button key={mode} onClick={() => setTheme(mode)}
              className={`btn ${theme === mode ? "btn-primary" : "btn-ghost"} capitalize`}>
              {mode === "light" ? <Sun size={14} /> : <Moon size={14} />} {mode}
            </button>
          ))}
        </div>
      </div>

      <div className="card p-6">
        <p className="label flex items-center gap-1.5 mb-3"><KeyRound size={13} /> AI provider</p>
        <div className="flex items-center gap-2 mb-3">
          <Badge tone="green">Server-side AI layer active</Badge>
        </div>
        <p className="text-xs muted leading-relaxed">
          Connect any OpenAI-compatible provider (OpenAI, Azure, OpenRouter, Groq, Ollama) by setting{" "}
          <code className="text-[11px] bg-black/5 dark:bg-white/10 px-1 py-0.5 rounded">OPENAI_API_KEY</code> and{" "}
          <code className="text-[11px] bg-black/5 dark:bg-white/10 px-1 py-0.5 rounded">OPENAI_BASE_URL</code> in the server's{" "}
          <code className="text-[11px] bg-black/5 dark:bg-white/10 px-1 py-0.5 rounded">.env.local</code>. Keys are never exposed to the browser —
          all AI calls go through <code className="text-[11px] bg-black/5 dark:bg-white/10 px-1 py-0.5 rounded">/api/coach</code> and{" "}
          <code className="text-[11px] bg-black/5 dark:bg-white/10 px-1 py-0.5 rounded">/api/resume</code>.
          Without a key, the app runs in demo mode with a rule-based coach.
        </p>
      </div>

      <div className="card p-6">
        <p className="label flex items-center gap-1.5 mb-3"><UserRound size={13} /> Account</p>
        <div className="text-sm space-y-1">
          <p><span className="muted">Name:</span> {profile?.name}</p>
          <p><span className="muted">Email:</span> {user?.email}</p>
          <p><span className="muted">Program:</span> {profile?.degree} {profile?.branch} · {profile?.gradYear}</p>
        </div>
      </div>
    </div>
  );
}
