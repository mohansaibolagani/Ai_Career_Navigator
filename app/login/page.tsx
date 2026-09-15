"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useStore } from "@/lib/store";
import { Compass, Loader2 } from "lucide-react";
import { GoogleButton } from "@/components/google-button";

export default function LoginPage() {
  const router = useRouter();
  const hydrate = useStore((s) => s.hydrate);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const googleDemo = process.env.NEXT_PUBLIC_GOOGLE_DEMO === "1";

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("error");
    if (!code) return;
    const messages: Record<string, string> = {
      google_not_configured:
        "Google sign-in is not configured on this server yet — use email & password, or ask the admin to set GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET.",
      google_demo_not_configured:
        "The Google demo account is not enabled on this server.",
      google_state_mismatch:
        "Google sign-in expired or was tampered with. Please try again.",
      google_code_missing: "Google sign-in was cancelled. Please try again.",
      access_denied: "Google sign-in was cancelled.",
    };
    setError(messages[code] ?? `Google sign-in failed: ${code}`);
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api.auth("login", { email, password });
      await hydrate();
      router.replace("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
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
          <h1 className="text-xl font-bold mt-3">Welcome back</h1>
          <p className="text-sm muted">Log in to continue your career journey</p>
        </div>
        <form onSubmit={submit} className="card p-6 space-y-3">
          <div>
            <label className="label">Email</label>
            <input className="input mt-1" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@college.edu" />
          </div>
          <div>
            <label className="label">Password</label>
            <input className="input mt-1" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          </div>
          {error && <p className="text-xs text-rose-500">{error}</p>}
          <button className="btn btn-primary w-full" disabled={busy}>
            {busy && <Loader2 size={15} className="animate-spin" />} Log in
          </button>
          <div className="flex items-center gap-3 !my-4">
            <div className="h-px flex-1 bg-black/10 dark:bg-white/10" />
            <span className="text-[11px] muted">or</span>
            <div className="h-px flex-1 bg-black/10 dark:bg-white/10" />
          </div>
          <GoogleButton />
          {googleDemo && (
            <a
              href="/api/auth/google?demo=1"
              className="btn btn-ghost w-full text-xs"
              aria-label="Continue with Google (demo)"
            >
              Try Google sign-in (demo account, no setup)
            </a>
          )}
          <p className="text-xs muted text-center">
            New here? <Link href="/signup" className="text-brand-600 dark:text-brand-300 font-medium">Create an account</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
