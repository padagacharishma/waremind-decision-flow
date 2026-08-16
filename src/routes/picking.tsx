import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { EmptyState, PageHeader, SectionCard, StatusBadge } from "@/components/waremind/primitives";
import { useWarehouse } from "@/lib/waremind/store";
import { optimizeRoute, routeDistance } from "@/lib/waremind/engine";

export const Route = createFileRoute("/picking")({
  head: () => ({
    meta: [
      { title: "Picking & Route Optimization — WAREMIND" },
      { name: "description", content: "Pick queue, zone map and optimized travel routes with distance savings." },
      { property: "og:title", content: "Picking & Route Optimization — WAREMIND" },
      { property: "og:description", content: "Shorter walks, faster picks, fewer missed deadlines." },
    ],
  }),
  component: PickingPage,
});

function PickingPage() {
  const { state, markItem, optimizeOrderRoute, advanceOrder } = useWarehouse();
  const tasks = state.orders.filter((o) => o.status === "allocated" || o.status === "picking");

  return (
    <div className="mx-auto max-w-[1400px]">
      <PageHeader title="Picking" subtitle="Picker dashboard, warehouse grid and optimized picking sequences" />
      {tasks.length === 0 ? (
        <EmptyState title="Pick queue is clear" body="No orders are currently waiting to be picked." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {tasks.map((o) => {
            const locs = o.items.map((i) => state.products.find((p) => p.sku === i.sku)?.location ?? "A-01");
            const optimized = state.routeOptimized[o.id];
            const seq = optimized ? optimizeRoute(locs) : locs;
            const before = routeDistance(locs) + 95;
            const after = routeDistance(optimizeRoute(locs)) + 40;
            return (
              <SectionCard
                key={o.id}
                title={`Order ${o.id}`}
                description={`${o.customer} · picker ${o.picker ?? "unassigned"} · est. ${8 + o.items.length * 4} min`}
                actions={<Button size="sm" variant="secondary" onClick={() => optimizeOrderRoute(o.id)}>Optimize route</Button>}
              >
                <div className="mb-3 flex flex-wrap gap-2 text-[11px]">
                  {seq.map((l, i) => (
                    <span key={l + i} className="rounded-md border border-primary/30 bg-primary/10 px-2 py-1 font-mono">
                      {i + 1}. {l}
                    </span>
                  ))}
                </div>
                <div className="mb-3 grid grid-cols-3 gap-2 text-center text-[11px]">
                  <div className="rounded-lg border border-border/60 p-2"><p className="text-muted-foreground">Previous</p><p className="font-display font-bold">{before}m</p></div>
                  <div className="rounded-lg border border-border/60 p-2"><p className="text-muted-foreground">Optimized</p><p className="font-display font-bold text-primary">{optimized ? after : before}m</p></div>
                  <div className="rounded-lg border border-border/60 p-2"><p className="text-muted-foreground">Saving</p><p className="font-display font-bold text-success">{optimized ? Math.round((1 - after / before) * 100) : 0}%</p></div>
                </div>
                <ul className="space-y-2">
                  {o.items.map((it) => {
                    const p = state.products.find((x) => x.sku === it.sku);
                    return (
                      <li key={it.sku} className="flex flex-wrap items-center gap-2 rounded-lg border border-border/60 px-3 py-2 text-xs">
                        <span className="font-mono font-semibold">{it.sku}</span>
                        <span className="text-muted-foreground">{p?.location} · qty {it.qty}</span>
                        <StatusBadge status={it.status === "pending" ? "created" : it.status} label={it.status} />
                        <div className="ml-auto flex gap-1.5">
                          <Button size="sm" onClick={() => markItem(o.id, it.sku, "picked")}>Picked</Button>
                          <Button size="sm" variant="outline" onClick={() => markItem(o.id, it.sku, "missing")}>Missing</Button>
                          <Button size="sm" variant="outline" onClick={() => markItem(o.id, it.sku, "damaged")}>Damaged</Button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
                <Button size="sm" variant="ghost" className="mt-3" onClick={() => advanceOrder(o.id, "packing")}>Mark picking complete</Button>
              </SectionCard>
            );
          })}
        </div>
      )}
    </div>
  );
}