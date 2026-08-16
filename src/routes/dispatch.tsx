import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { EmptyState, PageHeader, SectionCard, StatusBadge, deadlineLabel, timeAgo } from "@/components/waremind/primitives";
import { useWarehouse } from "@/lib/waremind/store";

export const Route = createFileRoute("/dispatch")({
  head: () => ({
    meta: [
      { title: "Dispatch Control — WAREMIND" },
      { name: "description", content: "Dispatch queue, deadlines and live shipment timeline for the warehouse dock." },
      { property: "og:title", content: "Dispatch Control — WAREMIND" },
      { property: "og:description", content: "Protect every dispatch deadline." },
    ],
  }),
  component: DispatchPage,
});

function DispatchPage() {
  const { state, dispatchOrder } = useWarehouse();
  const ready = state.orders.filter((o) => o.status === "ready-dispatch" || o.status === "delayed");
  const done = state.orders.filter((o) => o.status === "dispatched");

  return (
    <div className="mx-auto max-w-[1300px]">
      <PageHeader title="Dispatch" subtitle="Ready-to-ship queue and dispatch timeline" />
      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="Ready to dispatch">
          {ready.length ? (
            <ul className="space-y-2">
              {ready.map((o) => {
                const dl = deadlineLabel(o.deadline);
                return (
                  <li key={o.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-border/60 px-3 py-2 text-xs">
                    <span className="font-mono font-semibold">{o.id}</span>
                    <StatusBadge status={o.status} />
                    <span className="text-muted-foreground">{o.customer}</span>
                    <span className={dl.tone}>{dl.text}</span>
                    <Button size="sm" className="ml-auto" onClick={() => dispatchOrder(o.id)}>Dispatch</Button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <EmptyState title="Dock is clear" body="No orders are currently waiting for dispatch." />
          )}
        </SectionCard>
        <SectionCard title="Dispatch timeline">
          {done.length ? (
            <ol className="space-y-3 border-l border-border/70 pl-5">
              {done.map((o) => (
                <li key={o.id} className="relative">
                  <span className="absolute -left-[26px] top-1.5 size-2.5 rounded-full bg-success ring-4 ring-background" />
                  <p className="text-sm font-medium">{o.id} dispatched</p>
                  <p className="text-[11px] text-muted-foreground">{o.customer} · {o.dispatchedAt ? timeAgo(o.dispatchedAt) : "recently"}</p>
                </li>
              ))}
            </ol>
          ) : (
            <EmptyState title="No dispatches yet" body="Dispatched orders will build the shipment timeline." />
          )}
        </SectionCard>
      </div>
    </div>
  );
}