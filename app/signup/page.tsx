"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/api";
import { useStore } from "@/lib/store";
import { Compass, Eye, EyeOff, Loader2 } from "lucide-react";
import { GoogleButton } from "@/components/google-button";

const STRENGTH_LABELS = ["Too short", "Weak", "Fair", "Good", "Strong"];
const STRENGTH_BAR = [
  "bg-rose-500",
  "bg-rose-500",
  "bg-amber-500",
  "bg-lime-500",
  "bg-emerald-500",
];
const STRENGTH_TEXT = [
  "text-rose-600 dark:text-rose-400",
  "text-rose-600 dark:text-rose-400",
  "text-amber-600 dark:text-amber-400",
  "text-lime-600 dark:text-lime-400",
  "text-emerald-600 dark:text-emerald-400",
];

function passwordStrength(pw: string): number {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 10) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw) || /[^A-Za-z0-9]/.test(pw)) score++;
  // Under 6 chars can never rate above "Weak" regardless of variety
  if (pw.length < 6) score = Math.min(score, 1);
  return Math.max(1, Math.min(score, 4));
}

export default function SignupPage() {
  const router = useRouter();
  const hydrate = useStore((s) => s.hydrate);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const score = passwordStrength(password);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api.auth("signup", { name, email, password });
      await hydrate();
      router.replace("/onboarding");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed");
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <span className="inline-grid place-items-center h-11 w-11 rounded-xl bg-gradient-to-br from-brand-600 to-brand-400 text-white">
            <Compass size={22} />
          </span>
          <h1 className="text-xl font-bold mt-3">Create your account</h1>
          <p className="text-sm muted">Free forever for students</p>
        </div>
        <form onSubmit={submit} className="card p-6 space-y-3">
          <div>
            <label className="label">Full name</label>
            <input className="input mt-1" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Ananya Sharma" />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input mt-1" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            <p className="text-[11px] muted mt-1">Any email domain works — Gmail, Outlook, or your college ID.</p>
          </div>
          <div>
            <label className="label">Password</label>
            <div className="relative mt-1">
              <input
                className="input pr-10"
                type={show ? "text" : "password"}
                required
                minLength={6}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="6+ characters"
              />
              <button
                type="button"
                onClick={() => setShow((v) => !v)}
                aria-label={show ? "Hide password" : "Show password"}
                className="absolute right-2 top-1/2 -translate-y-1/2 grid place-items-center h-7 w-7 rounded-md text-[var(--muted)] hover:text-[var(--text)] transition-colors"
              >
                {show ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {password && (
              <div className="mt-2">
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-colors ${
                        i <= score ? STRENGTH_BAR[score] : "bg-black/10 dark:bg-white/10"
                      }`}
                    />
                  ))}
                </div>
                <p className={`text-[11px] mt-1 ${STRENGTH_TEXT[score]}`}>
                  {STRENGTH_LABELS[score]}
                </p>
              </div>
            )}
          </div>
          {error && <p className="text-xs text-rose-500">{error}</p>}
          <button className="btn btn-primary w-full" disabled={busy}>
            {busy && <Loader2 size={15} className="animate-spin" />} Sign up
          </button>
          <div className="flex items-center gap-3 !my-4">
            <div className="h-px flex-1 bg-black/10 dark:bg-white/10" />
            <span className="text-[11px] muted">or</span>
            <div className="h-px flex-1 bg-black/10 dark:bg-white/10" />
          </div>
          <GoogleButton />
          <p className="text-xs muted text-center">
            Already have an account? <Link href="/login" className="text-brand-600 dark:text-brand-300 font-medium">Log in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
