import { createFileRoute } from "@tanstack/react-router";
import { EmptyState, PageHeader, SectionCard, timeAgo } from "@/components/waremind/primitives";
import { useWarehouse } from "@/lib/waremind/store";

export const Route = createFileRoute("/decisions")({
  head: () => ({
    meta: [
      { title: "Decision History — WAREMIND" },
      { name: "description", content: "Every recommendation the engine made and every decision the team applied." },
      { property: "og:title", content: "Decision History — WAREMIND" },
      { property: "og:description", content: "A full audit trail of warehouse decisions." },
    ],
  }),
  component: DecisionsPage,
});

function DecisionsPage() {
  const { state } = useWarehouse();
  return (
    <div className="mx-auto max-w-[1000px]">
      <PageHeader title="Decision History" subtitle="Recommendations generated and decisions applied" />
      <SectionCard>
        {state.decisions.length ? (
          <ol className="space-y-4 border-l border-border/70 pl-5">
            {state.decisions.map((d) => (
              <li key={d.id} className="relative">
                <span className="absolute -left-[26px] top-1.5 size-2.5 rounded-full bg-info ring-4 ring-background" />
                <p className="text-sm font-semibold">{d.title}</p>
                <p className="text-xs text-muted-foreground">{d.detail}</p>
                <p className="mt-1 text-xs text-primary">{d.outcome}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">{d.actor} · {timeAgo(d.at)}</p>
              </li>
            ))}
          </ol>
        ) : (
          <EmptyState title="No decisions recorded" body="Apply a recommendation to start the audit trail." />
        )}
      </SectionCard>
    </div>
  );
}