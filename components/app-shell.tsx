"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useStore, useT } from "@/lib/store";
import { LANGUAGES } from "@/lib/i18n";
import {
  LayoutDashboard,
  UserRound,
  ClipboardList,
  Compass,
  GitCompareArrows,
  Map,
  FolderKanban,
  FileText,
  BotMessageSquare,
  Settings,
  Sun,
  Moon,
  LogOut,
  Compass as LogoIcon,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

const NAV: Array<{ href: string; key: string; icon: LucideIcon }> = [
  { href: "/dashboard", key: "dashboard", icon: LayoutDashboard },
  { href: "/profile", key: "myProfile", icon: UserRound },
  { href: "/assessment", key: "assessment", icon: ClipboardList },
  { href: "/careers", key: "careers", icon: Compass },
  { href: "/skill-gap", key: "skillGap", icon: GitCompareArrows },
  { href: "/roadmap", key: "roadmap", icon: Map },
  { href: "/projects", key: "projects", icon: FolderKanban },
  { href: "/resume", key: "resume", icon: FileText },
  { href: "/coach", key: "coach", icon: BotMessageSquare },
  { href: "/settings", key: "settings", icon: Settings },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const t = useT();
  const theme = useStore((s) => s.theme);
  const setTheme = useStore((s) => s.setTheme);
  const lang = useStore((s) => s.lang);
  const setLang = useStore((s) => s.setLang);
  const profile = useStore((s) => s.profile);
  const logout = useStore((s) => s.logout);
  const [mobileOpen, setMobileOpen] = useState(false);

  const nav = (
    <nav className="flex flex-col gap-0.5 px-3">
      {NAV.map(({ href, key, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              active
                ? "bg-brand-600/10 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300"
                : "muted hover:bg-black/5 dark:hover:bg-white/5"
            }`}
          >
            <Icon size={17} strokeWidth={active ? 2.2 : 1.8} />
            {t(key)}
          </Link>
        );
      })}
    </nav>
  );

  const headerControls = (
    <div className="flex items-center gap-2">
      <select
        aria-label="Language"
        className="input !w-auto !py-1 !px-2 text-xs"
        value={lang}
        onChange={(e) => setLang(e.target.value as never)}
      >
        {LANGUAGES.map((l) => (
          <option key={l.code} value={l.code}>
            {l.nativeLabel}
          </option>
        ))}
      </select>
      <button
        aria-label="Toggle theme"
        className="btn btn-ghost !p-2"
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      >
        {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
      </button>
      <button
        aria-label="Log out"
        className="btn btn-ghost !p-2"
        onClick={async () => {
          await logout();
          router.replace("/");
        }}
      >
        <LogOut size={16} />
      </button>
    </div>
  );

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="hidden lg:flex w-60 shrink-0 flex-col border-r surface py-5 sticky top-0 h-screen">
        <Link href="/dashboard" className="flex items-center gap-2 px-5 mb-6">
          <span className="grid place-items-center h-8 w-8 rounded-lg bg-gradient-to-br from-brand-600 to-brand-400 text-white">
            <LogoIcon size={18} />
          </span>
          <span className="font-bold text-[15px] leading-tight">
            AI Career
            <br />
            Navigator
          </span>
        </Link>
        {nav}
        <div className="mt-auto px-5 pt-4">
          <div className="card p-3">
            <p className="text-xs font-semibold truncate">{profile?.name}</p>
            <p className="text-[11px] muted truncate">
              {profile?.degree} · {profile?.branch}
            </p>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 min-w-0">
        <header className="lg:hidden sticky top-0 z-20 flex items-center justify-between px-4 py-3 border-b surface">
          <span className="font-bold text-sm">AI Career Navigator</span>
          {headerControls}
        </header>
        {/* mobile nav strip */}
        <button
          className="lg:hidden w-full text-left px-4 py-2 text-xs font-semibold muted border-b surface"
          onClick={() => setMobileOpen((v) => !v)}
        >
          {mobileOpen ? "✕ Close menu" : "☰ Menu"}
        </button>
        {mobileOpen && <div className="lg:hidden border-b surface px-3 py-2">{nav}</div>}
        <div className="hidden lg:flex items-center justify-end gap-2 px-6 py-3 border-b surface sticky top-0 z-20">
          {headerControls}
        </div>
        <main className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">{children}</main>
      </div>
    </div>
  );
}
