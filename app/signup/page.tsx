"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/api";
import { useStore } from "@/lib/store";
import { Compass, Loader2 } from "lucide-react";
import { GoogleButton } from "@/components/google-button";

export default function SignupPage() {
  const router = useRouter();
  const hydrate = useStore((s) => s.hydrate);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

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
            <input className="input mt-1" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="6+ characters" />
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
