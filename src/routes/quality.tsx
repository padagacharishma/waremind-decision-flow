import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState, PageHeader, PriorityBadge, SectionCard, StatusBadge, deadlineLabel } from "@/components/waremind/primitives";
import { useWarehouse } from "@/lib/waremind/store";
import { priorityOf } from "@/lib/waremind/engine";

export const Route = createFileRoute("/quality")({
  head: () => ({
    meta: [
      { title: "Quality Check — Smart Warehouse Operations" },
      {
        name: "description",
        content:
          "Inspect quantity, product condition and packaging before dispatch. Rejections automatically raise an exception.",
      },
      { property: "og:title", content: "Quality Check — Smart Warehouse Operations" },
      { property: "og:description", content: "Approve, reject or send back orders with a full audit trail." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: QualityPage,
});

function QualityPage() {
  const { state, runQC, advanceOrder } = useWarehouse();
  const queue = state.orders.filter((o) => o.status === "qc");
  const recent = state.orders.filter((o) => o.qc === "pass" || o.qc === "fail").slice(0, 6);

  return (
    <div className="mx-auto max-w-[1200px]">
      <PageHeader title="Quality Check" subtitle="Verify quantity, condition and packaging before an order leaves the building" />
      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <SectionCard title="QC queue" description="Expected vs actual quantity · product condition · packaging condition">
          {queue.length ? (
            <div className="space-y-3">
              {queue.map((o) => {
                const pr = priorityOf(o, state.products);
                const dl = deadlineLabel(o.deadline);
                const expected = o.items.reduce((a, i) => a + i.qty, 0);
                const actual = o.items.reduce((a, i) => a + (i.status === "picked" ? i.qty : i.picked), 0);
                return (
                  <div key={o.id} className="rounded-xl border border-border/60 bg-background/30 p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-semibold">{o.id}</span>
                      <PriorityBadge level={pr.level} score={pr.score} />
                      <StatusBadge status="qc" label={o.qc ?? "pending"} />
                      <span className={`ml-auto text-[11px] ${dl.tone}`}>Dispatch {dl.text}</span>
                    </div>
                    <p className="mt-1 text-[11px] text-muted-foreground">{o.customer}</p>
                    <div className="mt-3 overflow-x-auto">
                      <table className="w-full min-w-[420px] text-left text-[11px]">
                        <thead className="text-muted-foreground">
                          <tr>
                            <th className="pb-1 font-medium">SKU</th>
                            <th className="pb-1 font-medium">Expected</th>
                            <th className="pb-1 font-medium">Actual</th>
                            <th className="pb-1 font-medium">Condition</th>
                          </tr>
                        </thead>
                        <tbody>
                          {o.items.map((it) => (
                            <tr key={it.sku} className="border-t border-border/50">
                              <td className="py-1.5 font-mono">{it.sku}</td>
                              <td className="py-1.5 tabular-nums">{it.qty}</td>
                              <td className="py-1.5 tabular-nums">{it.status === "picked" ? it.qty : it.picked}</td>
                              <td className="py-1.5">
                                <StatusBadge
                                  status={it.status === "damaged" ? "critical" : it.status === "missing" ? "low" : "healthy"}
                                  label={it.status === "picked" ? "good" : it.status}
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <p className="mt-2 text-[11px] text-muted-foreground">
                      Total expected <span className="tabular-nums text-foreground">{expected}</span> · verified{" "}
                      <span className="tabular-nums text-foreground">{actual}</span>
                      {actual !== expected && <span className="text-warning"> · quantity mismatch detected</span>}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      <Button size="sm" onClick={() => runQC(o.id, true)}>Approve</Button>
                      <Button size="sm" variant="outline" onClick={() => runQC(o.id, false)}>Reject</Button>
                      <Button size="sm" variant="secondary" onClick={() => advanceOrder(o.id, "packing")}>Send back to packing</Button>
                      <Button size="sm" variant="ghost" onClick={() => runQC(o.id, false)}>Report damage</Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon={<CheckCircle2 className="size-6 text-success" />}
              title="QC lane is clear"
              body="Orders arrive here automatically once packing completes."
            />
          )}
        </SectionCard>

        <SectionCard title="Recent inspections" description="Outcome of the last quality decisions">
          {recent.length ? (
            <ul className="space-y-2">
              {recent.map((o) => (
                <li key={o.id} className="flex items-center gap-2 rounded-lg border border-border/60 px-3 py-2 text-xs">
                  <span className="font-mono font-semibold">{o.id}</span>
                  <span className="truncate text-muted-foreground">{o.customer}</span>
                  <span className={`ml-auto font-semibold ${o.qc === "pass" ? "text-success" : "text-critical"}`}>
                    {o.qc === "pass" ? "Approved" : "Rejected"}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="No inspections yet" body="Approve or reject an order to build the QC record." />
          )}
        </SectionCard>
      </div>
    </div>
  );
}
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/quality')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/quality"!</div>
}
