import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { EmptyState, PageHeader, PriorityBadge, SectionCard, timeAgo } from "@/components/waremind/primitives";
import { useWarehouse } from "@/lib/waremind/store";
import { allocationPlan, available, stockStatus } from "@/lib/waremind/engine";

export const Route = createFileRoute("/allocation")({
  head: () => ({
    meta: [
      { title: "Smart Allocation — WAREMIND" },
      { name: "description", content: "Scored allocation of scarce stock across competing orders, with full reasoning." },
      { property: "og:title", content: "Smart Allocation — WAREMIND" },
      { property: "og:description", content: "Decide who gets the scarce stock — and why." },
    ],
  }),
  component: AllocationPage,
});

function AllocationPage() {
  const { state, applyAllocation } = useWarehouse();
  const contested = state.products
    .filter((p) => stockStatus(p) !== "healthy" || available(p) < 30)
    .map((p) => allocationPlan(p.sku, state))
    .filter((plan) => plan.lines.length > 0);

  return (
    <div className="mx-auto max-w-[1400px]">
      <PageHeader title="Allocation" subtitle="Smart inventory allocation engine — priority-weighted, fully explained" />
      <div className="space-y-4">
        {contested.length === 0 && <EmptyState title="No contested inventory" body="Every open order is fully covered by available stock." />}
        {contested.map((plan) => (
          <SectionCard
            key={plan.product.sku}
            title={`${plan.product.sku} · ${plan.product.name}`}
            description={`Available ${plan.availableQty} · requested ${plan.totalDemand} · shortage ${Math.max(0, plan.totalDemand - plan.availableQty)}`}
            actions={<Button size="sm" onClick={() => applyAllocation(plan.product.sku)}>Apply allocation</Button>}
          >
            <div className="overflow-x-auto wm-scroll">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-[11px] uppercase text-muted-foreground">
                    {["Order", "Priority", "Score", "Requested", "Allocated", "Shortage", "Recommended action"].map((h) => (
                      <th key={h} className="py-2 pr-3 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {plan.lines.map((l) => (
                    <tr key={l.orderId} className="border-b border-border/50">
                      <td className="py-2.5 pr-3 font-mono text-xs">{l.orderId}</td>
                      <td className="py-2.5 pr-3"><PriorityBadge level={l.level} /></td>
                      <td className="py-2.5 pr-3 font-display text-sm font-bold tabular-nums">{l.score}</td>
                      <td className="py-2.5 pr-3 text-xs tabular-nums">{l.requested}</td>
                      <td className="py-2.5 pr-3 text-xs font-semibold tabular-nums text-primary">{l.allocated}</td>
                      <td className="py-2.5 pr-3 text-xs tabular-nums text-critical">{l.shortage}</td>
                      <td className="py-2.5 pr-3 text-[11px] text-muted-foreground">{l.action}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>
        ))}

        <SectionCard title="Allocation history">
          {state.allocations.length ? (
            <ul className="space-y-2">
              {state.allocations.map((a) => (
                <li key={a.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-border/60 px-3 py-2 text-xs">
                  <span className="font-mono font-semibold">{a.sku}</span>
                  <span>→ {a.orderId}</span>
                  <span className="tabular-nums">{a.allocated}/{a.requested}</span>
                  <span className="text-muted-foreground">{a.reason}</span>
                  <span className="ml-auto text-[10px] text-muted-foreground">{timeAgo(a.at)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="No allocations yet" body="Applied allocation plans will be recorded here with full reasoning." />
          )}
        </SectionCard>
      </div>
    </div>
  );
}