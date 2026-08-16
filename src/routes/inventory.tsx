import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { EmptyState, PageHeader, SectionCard, StatusBadge } from "@/components/waremind/primitives";
import { useWarehouse } from "@/lib/waremind/store";
import { available, daysRemaining, reorderPlan, stockStatus } from "@/lib/waremind/engine";

export const Route = createFileRoute("/inventory")({
  head: () => ({
    meta: [
      { title: "Inventory & Reorder Intelligence — WAREMIND" },
      { name: "description", content: "Stock cover, demand velocity and smart reorder recommendations per SKU." },
      { property: "og:title", content: "Inventory & Reorder Intelligence — WAREMIND" },
      { property: "og:description", content: "Know which SKU will stock out first — and how much to order." },
    ],
  }),
  component: InventoryPage,
});

function InventoryPage() {
  const { state, triggerReorder } = useWarehouse();
  const [q, setQ] = useState("");
  const [only, setOnly] = useState<"all" | "reorder">("all");
  const rows = state.products
    .map((p) => ({ p, plan: reorderPlan(p), status: stockStatus(p) }))
    .filter(({ p, plan }) => (only === "reorder" ? plan.status === "reorder-now" : true))
    .filter(({ p }) => `${p.sku} ${p.name} ${p.category}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="mx-auto max-w-[1500px]">
      <PageHeader title="Inventory" subtitle="Stock health, demand velocity and smart reorder intelligence" />
      <SectionCard>
        <div className="mb-4 flex flex-wrap gap-2">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search SKU, product or category" className="w-full sm:max-w-xs" />
          <Button size="sm" variant={only === "all" ? "default" : "outline"} onClick={() => setOnly("all")}>All SKUs</Button>
          <Button size="sm" variant={only === "reorder" ? "default" : "outline"} onClick={() => setOnly("reorder")}>Reorder now</Button>
        </div>
        {rows.length === 0 ? (
          <EmptyState title="No products match" body="Adjust your search or filter to see inventory." />
        ) : (
          <div className="overflow-x-auto wm-scroll">
            <table className="w-full min-w-[1050px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-[11px] uppercase text-muted-foreground">
                  {["SKU", "Product", "Category", "Zone", "Stock", "Reserved", "Available", "Daily demand", "Days left", "Status", "Recommendation", ""].map((h) => (
                    <th key={h} className="py-2 pr-3 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map(({ p, plan, status }) => (
                  <tr key={p.sku} className="border-b border-border/50 hover:bg-accent/30">
                    <td className="py-2.5 pr-3 font-mono text-xs">{p.sku}</td>
                    <td className="py-2.5 pr-3 text-xs">{p.name}</td>
                    <td className="py-2.5 pr-3 text-xs text-muted-foreground">{p.category}</td>
                    <td className="py-2.5 pr-3 text-xs">{p.zone} · {p.location}</td>
                    <td className="py-2.5 pr-3 text-xs tabular-nums">{p.stock}</td>
                    <td className="py-2.5 pr-3 text-xs tabular-nums">{p.reserved}</td>
                    <td className="py-2.5 pr-3 text-xs font-semibold tabular-nums">{available(p)}</td>
                    <td className="py-2.5 pr-3 text-xs tabular-nums">{p.dailyDemand}</td>
                    <td className="py-2.5 pr-3 text-xs tabular-nums">{daysRemaining(p)}</td>
                    <td className="py-2.5 pr-3"><StatusBadge status={status} /></td>
                    <td className="py-2.5 pr-3 text-[11px] text-muted-foreground">
                      {plan.status === "reorder-now" ? `REORDER NOW — order ${plan.qty} units. ${plan.reason}` : plan.reason}
                    </td>
                    <td className="py-2.5 pr-3">
                      <Button size="sm" variant={plan.status === "reorder-now" ? "default" : "outline"} onClick={() => triggerReorder(p.sku)}>
                        Reorder
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      <SectionCard title="Replenishment requests" className="mt-4">
        <ul className="space-y-2">
          {state.replenishments.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-border/60 px-3 py-2 text-xs">
              <span className="font-mono font-semibold">{r.sku}</span>
              <span className="tabular-nums">{r.qty} units</span>
              <StatusBadge status={r.status === "requested" ? "created" : "allocated"} label={r.status} />
              <span className="text-muted-foreground">{r.reason}</span>
            </li>
          ))}
        </ul>
      </SectionCard>
    </div>
  );
}