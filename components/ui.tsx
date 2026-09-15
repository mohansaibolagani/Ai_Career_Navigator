"use client";

import type { SkillLevel } from "@/lib/types";

export function ProgressBar({
  value,
  max = 100,
  color = "bg-brand-500",
  height = "h-2",
}: {
  value: number;
  max?: number;
  color?: string;
  height?: string;
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className={`w-full rounded-full bg-black/10 dark:bg-white/10 ${height}`}>
      <div
        className={`${height} rounded-full ${color} transition-all duration-500`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function ScoreRing({
  value,
  size = 84,
  label,
  sub,
}: {
  value: number;
  size?: number;
  label?: string;
  sub?: string;
}) {
  const stroke = 7;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c - (Math.min(100, Math.max(0, value)) / 100) * c;
  const color = value >= 70 ? "#10b981" : value >= 45 ? "#f59e0b" : "#ef4444";
  return (
    <div className="relative inline-grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="currentColor" className="text-black/10 dark:text-white/10" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={off}
          strokeLinecap="round"
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute text-center">
        <div className="font-bold leading-none" style={{ fontSize: size * 0.24 }}>
          {Math.round(value)}
          <span className="text-[0.6em] muted">%</span>
        </div>
        {label && <div className="text-[9px] muted mt-0.5 uppercase tracking-wide">{label}</div>}
        {sub && <div className="text-[9px] muted">{sub}</div>}
      </div>
    </div>
  );
}

export function SkillBar({
  name,
  level,
  needed,
  note,
}: {
  name: string;
  level: number; // 0-5
  needed?: number;
  note?: string;
}) {
  const pct = (level / 5) * 100;
  const label =
    level >= 4 ? "Strong" : level === 3 ? "Good" : level === 2 ? "Beginner" : level >= 1 ? "Aware" : "None";
  const color =
    level >= 4 ? "bg-emerald-500" : level === 3 ? "bg-brand-500" : level === 2 ? "bg-amber-500" : level >= 1 ? "bg-orange-400" : "bg-rose-500";
  return (
    <div>
      <div className="flex items-baseline justify-between text-sm mb-1">
        <span className="font-medium">{name}</span>
        <span className="text-xs muted">
          {label}
          {needed != null && needed > level ? ` · needs L${needed}` : ""}
          {note ? ` · ${note}` : ""}
        </span>
      </div>
      <div className="flex gap-1 items-center">
        <ProgressBar value={pct} color={color} />
      </div>
    </div>
  );
}

export function SectionTitle({
  title,
  sub,
  right,
}: {
  title: string;
  sub?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-end justify-between mb-4 gap-3">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{title}</h1>
        {sub && <p className="text-sm muted mt-0.5">{sub}</p>}
      </div>
      {right}
    </div>
  );
}

export function Badge({
  children,
  tone = "blue",
}: {
  children: React.ReactNode;
  tone?: "blue" | "green" | "amber" | "red" | "neutral";
}) {
  const cls =
    tone === "green"
      ? "badge badge-green"
      : tone === "amber"
      ? "badge badge-amber"
      : tone === "red"
      ? "badge badge-red"
      : tone === "neutral"
      ? "badge surface muted"
      : "badge badge-blue";
  return <span className={cls}>{children}</span>;
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="card p-8 text-center">
      <h3 className="font-semibold mb-1">{title}</h3>
      <p className="text-sm muted max-w-md mx-auto">{body}</p>
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}
