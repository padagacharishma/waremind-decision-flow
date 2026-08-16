import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { EmptyState, PageHeader, PriorityBadge, SectionCard, StatusBadge } from "@/components/waremind/primitives";
import { useWarehouse } from "@/lib/waremind/store";
import { priorityOf } from "@/lib/waremind/engine";

export const Route = createFileRoute("/packing")({
  head: () => ({
    meta: [
      { title: "Packing & Quality Check — WAREMIND" },
      { name: "description", content: "Packing benches, QC pass/fail and automatic exception creation on failure." },
      { property: "og:title", content: "Packing & Quality Check — WAREMIND" },
      { property: "og:description", content: "Pack, inspect and protect every dispatch window." },
    ],
  }),
  component: PackingPage,
});

function PackingPage() {
  const { state, advanceOrder, runQC } = useWarehouse();
  const packing = state.orders.filter((o) => o.status === "packing");
  const qc = state.orders.filter((o) => o.status === "qc");

  return (
    <div className="mx-auto max-w-[1400px]">
      <PageHeader title="Packing" subtitle="Packing queue and quality gate before dispatch" />
      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="Waiting for packing">
          {packing.length ? (
            <ul className="space-y-2">
              {packing.map((o) => (
                <li key={o.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-border/60 px-3 py-2 text-xs">
                  <span className="font-mono font-semibold">{o.id}</span>
                  <PriorityBadge level={priorityOf(o, state.products).level} />
                  <span className="text-muted-foreground">{o.items.length} items · packer {o.packer ?? "unassigned"}</span>
                  <Button size="sm" className="ml-auto" onClick={() => advanceOrder(o.id, "qc")}>Packing complete</Button>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="Packing benches are clear" body="No orders are waiting to be packed right now." />
          )}
        </SectionCard>

        <SectionCard title="Quality check" description="Correct items · correct quantity · damage · packaging condition">
          {qc.length ? (
            <ul className="space-y-2">
              {qc.map((o) => (
                <li key={o.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-border/60 px-3 py-2 text-xs">
                  <span className="font-mono font-semibold">{o.id}</span>
                  <StatusBadge status="qc" label={o.qc ?? "pending"} />
                  <span className="text-muted-foreground">{o.customer}</span>
                  <div className="ml-auto flex gap-1.5">
                    <Button size="sm" onClick={() => runQC(o.id, true)}>Pass</Button>
                    <Button size="sm" variant="outline" onClick={() => runQC(o.id, false)}>Fail</Button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="Nothing to inspect" body="Orders arrive here automatically once packing completes." />
          )}
        </SectionCard>
      </div>
    </div>
  );
}