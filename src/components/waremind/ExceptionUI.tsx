import { useState } from "react";
import { AlertTriangle, Bot, CheckCircle2, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useWarehouse } from "@/lib/waremind/store";
import type { TimelineEntry, WarehouseException } from "@/lib/waremind/types";
import { StatusBadge, timeAgo } from "./primitives";

export function DecisionTimeline({ entries }: { entries: TimelineEntry[] }) {
  const tone: Record<TimelineEntry["kind"], string> = {
    info: "bg-muted-foreground",
    exception: "bg-critical",
    decision: "bg-info",
    resolution: "bg-primary",
    success: "bg-success",
  };
  return (
    <ol className="relative space-y-4 border-l border-border/70 pl-5">
      {entries.map((e, i) => (
        <li key={`${e.at}-${i}`} className="relative">
          <span className={cn("absolute -left-[26px] top-1.5 size-2.5 rounded-full ring-4 ring-background", tone[e.kind])} />
          <p className="text-sm font-medium">{e.label}</p>
          {e.detail && <p className="text-xs text-muted-foreground">{e.detail}</p>}
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {e.actor} · {timeAgo(e.at)}
          </p>
        </li>
      ))}
    </ol>
  );
}

export function WhatShouldIDo({ exception }: { exception: WarehouseException }) {
  const { applyStockRecommendation, resolveException } = useWarehouse();
  const [open, setOpen] = useState(false);
  const [choice, setChoice] = useState<string>(exception.recommendation);

  const apply = () => {
    if (exception.kind === "stock-shortage") applyStockRecommendation(exception.id, choice);
    else resolveException(exception.id, choice);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button variant="secondary" size="sm" className="gap-1.5" onClick={() => setOpen(true)}>
        <Bot className="size-4" /> What should I do?
      </Button>
      <DialogContent className="max-h-[90vh] overflow-y-auto wm-scroll sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="size-4 text-primary" /> WAREMIND Decision Panel
          </DialogTitle>
          <DialogDescription>{exception.title}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-critical">Problem</p>
            <p className="mt-1 text-muted-foreground">{exception.problem}</p>
          </div>
          <div className="rounded-xl border border-primary/30 bg-primary/8 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">Recommendation</p>
            <p className="mt-1">{exception.recommendation}</p>
            <p className="mt-2 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Why: </span>
              {exception.reason}
            </p>
          </div>
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Alternative strategies
            </p>
            <div className="space-y-2">
              {[{ label: exception.recommendation, impact: "Recommended by the engine — best expected outcome." }, ...exception.alternatives].map(
                (alt) => (
                  <button
                    key={alt.label}
                    type="button"
                    onClick={() => setChoice(alt.label)}
                    className={cn(
                      "w-full rounded-lg border px-3 py-2 text-left transition-colors",
                      choice === alt.label
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/40 hover:bg-accent/40",
                    )}
                  >
                    <p className="text-xs font-semibold">{alt.label}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">Predicted impact: {alt.impact}</p>
                  </button>
                ),
              )}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={apply} className="gap-1.5">
            <CheckCircle2 className="size-4" /> Apply selected decision
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ExceptionCard({ exception, compact }: { exception: WarehouseException; compact?: boolean }) {
  const { applyStockRecommendation, resolveException, dismissException } = useWarehouse();
  const resolved = exception.status === "resolved";
  const severityRing = {
    critical: "border-critical/45 bg-critical/6",
    warning: "border-warning/40 bg-warning/6",
    "at-risk": "border-atrisk/40 bg-atrisk/6",
  }[exception.severity];

  return (
    <article className={cn("rounded-2xl border p-4 backdrop-blur-sm", resolved ? "border-success/35 bg-success/5" : severityRing)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span
            className={cn(
              "mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg",
              resolved ? "bg-success/15 text-success" : "bg-critical/15 text-critical",
              !resolved && exception.severity === "critical" && "wm-pulse",
            )}
          >
            {resolved ? <CheckCircle2 className="size-4" /> : <AlertTriangle className="size-4" />}
          </span>
          <div className="min-w-0">
            <h3 className="font-display text-sm font-semibold">{exception.title}</h3>
            <p className="mt-1 text-xs text-muted-foreground">{exception.problem}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <StatusBadge status={exception.status} />
              {exception.orderId && <span className="text-[11px] text-muted-foreground">Order {exception.orderId}</span>}
              {exception.sku && <span className="text-[11px] text-muted-foreground">· {exception.sku}</span>}
              <span className="text-[11px] text-muted-foreground">· {timeAgo(exception.createdAt)}</span>
            </div>
          </div>
        </div>
        {!resolved && (
          <Button variant="ghost" size="icon" className="size-7" onClick={() => dismissException(exception.id)} aria-label="Dismiss">
            <X className="size-4" />
          </Button>
        )}
      </div>

      {!compact && (
        <div className="mt-3 rounded-xl border border-primary/25 bg-primary/8 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">Recommended action</p>
          <p className="mt-1 text-sm">{exception.recommendation}</p>
          <p className="mt-1.5 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Reason: </span>
            {exception.reason}
          </p>
        </div>
      )}

      {!resolved && (
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            size="sm"
            className="gap-1.5"
            onClick={() =>
              exception.kind === "stock-shortage"
                ? applyStockRecommendation(exception.id)
                : resolveException(exception.id)
            }
          >
            <CheckCircle2 className="size-4" /> Apply recommendation
          </Button>
          <WhatShouldIDo exception={exception} />
          <Button variant="ghost" size="sm" onClick={() => dismissException(exception.id)}>
            Dismiss
          </Button>
        </div>
      )}

      {exception.timeline.length > 1 && (
        <div className="mt-4 border-t border-border/60 pt-4">
          <DecisionTimeline entries={exception.timeline} />
        </div>
      )}
    </article>
  );
}