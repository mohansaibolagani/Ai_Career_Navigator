"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";

/** Renders children only for logged-in users with a profile; redirects otherwise. */
export default function AuthGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const hydrate = useStore((s) => s.hydrate);
  const user = useStore((s) => s.user);
  const profile = useStore((s) => s.profile);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    hydrate().finally(() => setReady(true));
  }, [hydrate]);

  useEffect(() => {
    if (!ready) return;
    if (!user) router.replace("/");
    else if (!profile?.onboarded) router.replace("/onboarding");
  }, [ready, user, profile, router]);

  if (!ready || !user || !profile?.onboarded) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="flex items-center gap-3 muted">
          <span className="h-5 w-5 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
          <span className="text-sm font-medium">Loading your career workspace…</span>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}
