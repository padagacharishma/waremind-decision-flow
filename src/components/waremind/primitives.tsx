import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { PriorityLevel } from "@/lib/waremind/types";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="relative grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary/90 to-info/70 shadow-lg shadow-primary/20">
        <svg viewBox="0 0 24 24" className="size-5 text-primary-foreground" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 9.5 12 4l9 5.5V20H3z" strokeLinejoin="round" />
          <circle cx="12" cy="13" r="2.2" />
          <path d="M12 10.8V9M12 17.2V15.2M9.8 13H8M16 13h-1.8" strokeLinecap="round" />
        </svg>
      </div>
      {!compact && (
        <div className="leading-tight">
          <div className="font-display text-[15px] font-bold tracking-[0.16em] text-foreground">WAREMIND</div>
          <div className="text-[10px] text-muted-foreground">Decision Engine</div>
        </div>
      )}
    </div>
  );
}

export function useCountUp(target: number, duration = 900) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      setValue(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
}

export function StatCard({
  label,
  value,
  suffix,
  icon,
  tone = "default",
  hint,
}: {
  label: string;
  value: number;
  suffix?: string;
  icon?: ReactNode;
  tone?: "default" | "critical" | "warning" | "success" | "info";
  hint?: string;
}) {
  const n = useCountUp(value);
  const toneRing = {
    default: "text-foreground",
    critical: "text-critical",
    warning: "text-warning",
    success: "text-success",
    info: "text-info",
  }[tone];
  return (
    <div className="glass group relative overflow-hidden rounded-2xl p-4 transition-all hover:-translate-y-0.5 hover:border-primary/40">
      <div className="flex items-start justify-between gap-3">
        <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
        <span className={cn("opacity-70 transition-opacity group-hover:opacity-100", toneRing)}>{icon}</span>
      </div>
      <div className={cn("mt-2 font-display text-3xl font-bold tabular-nums", toneRing)}>
        {n}
        {suffix}
      </div>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

const priorityStyles: Record<PriorityLevel, string> = {
  critical: "bg-critical/15 text-critical border-critical/40",
  high: "bg-warning/15 text-warning border-warning/40",
  medium: "bg-atrisk/15 text-atrisk border-atrisk/40",
  low: "bg-success/12 text-success border-success/35",
};

export function PriorityBadge({ level, score }: { level: PriorityLevel; score?: number }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
        priorityStyles[level],
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {level}
      {score !== undefined && <span className="tabular-nums opacity-80">{score}</span>}
    </span>
  );
}

const statusTone: Record<string, string> = {
  created: "bg-secondary text-secondary-foreground border-border",
  prioritized: "bg-info/15 text-info border-info/35",
  "awaiting-stock": "bg-critical/15 text-critical border-critical/35",
  allocated: "bg-info/15 text-info border-info/35",
  picking: "bg-atrisk/15 text-atrisk border-atrisk/35",
  packing: "bg-warning/15 text-warning border-warning/35",
  qc: "bg-info/15 text-info border-info/35",
  "ready-dispatch": "bg-success/15 text-success border-success/35",
  dispatched: "bg-success/20 text-success border-success/45",
  delayed: "bg-critical/20 text-critical border-critical/45",
  healthy: "bg-success/15 text-success border-success/35",
  low: "bg-atrisk/15 text-atrisk border-atrisk/35",
  critical: "bg-critical/15 text-critical border-critical/35",
  out: "bg-critical/25 text-critical border-critical/50",
  resolved: "bg-success/15 text-success border-success/35",
  reported: "bg-secondary text-secondary-foreground border-border",
  investigating: "bg-atrisk/15 text-atrisk border-atrisk/35",
  "action-recommended": "bg-info/15 text-info border-info/35",
};

export function StatusBadge({ status, label }: { status: string; label?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium capitalize",
        statusTone[status] ?? "bg-secondary text-secondary-foreground border-border",
      )}
    >
      {(label ?? status).replace(/-/g, " ")}
    </span>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-display text-2xl font-bold sm:text-3xl">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function SectionCard({
  title,
  description,
  actions,
  children,
  className,
}: {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("glass rounded-2xl p-4 sm:p-5", className)}>
      {(title || actions) && (
        <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            {title && <h2 className="font-display text-base font-semibold">{title}</h2>}
            {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
          </div>
          {actions}
        </header>
      )}
      {children}
    </section>
  );
}

export function EmptyState({ title, body, icon }: { title: string; body: string; icon?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/70 px-6 py-12 text-center">
      <div className="mb-3 text-muted-foreground">{icon}</div>
      <p className="font-display text-sm font-semibold">{title}</p>
      <p className="mt-1 max-w-sm text-xs text-muted-foreground">{body}</p>
    </div>
  );
}

export function timeAgo(at: number) {
  const diff = Date.now() - at;
  const m = Math.round(diff / 60000);
  if (Math.abs(m) < 1) return "just now";
  if (Math.abs(m) < 60) return m > 0 ? `${m}m ago` : `in ${-m}m`;
  const h = Math.round(m / 60);
  if (Math.abs(h) < 24) return h > 0 ? `${h}h ago` : `in ${-h}h`;
  const d = Math.round(h / 24);
  return d > 0 ? `${d}d ago` : `in ${-d}d`;
}

export function deadlineLabel(at: number) {
  const h = (at - Date.now()) / 3600_000;
  if (h < 0) return { text: `${Math.abs(Math.round(h))}h overdue`, tone: "text-critical" };
  if (h < 3) return { text: `in ${h.toFixed(1)}h`, tone: "text-critical" };
  if (h < 8) return { text: `in ${Math.round(h)}h`, tone: "text-warning" };
  if (h < 24) return { text: `in ${Math.round(h)}h`, tone: "text-atrisk" };
  return { text: `in ${Math.round(h / 24)}d`, tone: "text-muted-foreground" };
}