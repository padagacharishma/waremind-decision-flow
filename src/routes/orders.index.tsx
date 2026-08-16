import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { EmptyState, PageHeader, PriorityBadge, SectionCard, StatusBadge, deadlineLabel } from "@/components/waremind/primitives";
import { useWarehouse } from "@/lib/waremind/store";
import { isAtRisk, priorityOf } from "@/lib/waremind/engine";

export const Route = createFileRoute("/orders/")({
  head: () => ({
    meta: [
      { title: "Orders — WAREMIND" },
      { name: "description", content: "Every order ranked by an intelligent priority score with risk and next action." },
      { property: "og:title", content: "Orders — WAREMIND" },
      { property: "og:description", content: "Intelligent order prioritisation for warehouse fulfillment." },
    ],
  }),
  component: OrdersPage,
});

const FILTERS = [
  "All",
  "Critical",
  "High",
  "Medium",
  "Low",
  "At Risk",
  "Delayed",
  "Allocated",
  "Picking",
  "Packing",
  "QC",
  "Ready Dispatch",
  "Dispatched",
] as const;

function OrdersPage() {
  const { state } = useWarehouse();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const [q, setQ] = useState("");

  const rows = useMemo(() => {
    return state.orders
      .map((o) => ({ o, pr: priorityOf(o, state.products), risk: isAtRisk(o, state.products) }))
      .filter(({ o, pr, risk }) => {
        if (q && !`${o.id} ${o.customer}`.toLowerCase().includes(q.toLowerCase())) return false;
        switch (filter) {
          case "All":
            return true;
          case "At Risk":
            return risk;
          case "Critical":
          case "High":
          case "Medium":
          case "Low":
            return pr.level === filter.toLowerCase();
          case "Ready Dispatch":
            return o.status === "ready-dispatch";
          case "QC":
            return o.status === "qc";
          default:
            return o.status === filter.toLowerCase();
        }
      })
      .sort((a, b) => b.pr.score - a.pr.score);
  }, [state.orders, state.products, filter, q]);

  return (
    <div className="mx-auto max-w-[1500px]">
      <PageHeader title="Orders" subtitle="Automatically ranked by the WAREMIND intelligent priority engine" />

      <SectionCard>
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative w-full lg:max-w-xs">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search order or customer" className="pl-9" />
          </div>
          <div className="-mx-1 flex gap-1.5 overflow-x-auto wm-scroll px-1 pb-1">
            {FILTERS.map((f) => (
              <Button
                key={f}
                size="sm"
                variant={filter === f ? "default" : "outline"}
                className="shrink-0 text-xs"
                onClick={() => setFilter(f)}
              >
                {f}
              </Button>
            ))}
          </div>
        </div>

        {rows.length === 0 ? (
          <EmptyState title="No orders match this view" body="Try a different filter or clear your search query." />
        ) : (
          <div className="overflow-x-auto wm-scroll">
            <table className="w-full min-w-[1000px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                  <th className="py-2 pr-3 font-medium">Order</th>
                  <th className="py-2 pr-3 font-medium">Customer</th>
                  <th className="py-2 pr-3 font-medium">Priority</th>
                  <th className="py-2 pr-3 font-medium">Score</th>
                  <th className="py-2 pr-3 font-medium">Items</th>
                  <th className="py-2 pr-3 font-medium">Qty</th>
                  <th className="py-2 pr-3 font-medium">Status</th>
                  <th className="py-2 pr-3 font-medium">Deadline</th>
                  <th className="py-2 pr-3 font-medium">Risk</th>
                  <th className="py-2 pr-3 font-medium">Recommended action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ o, pr, risk }) => {
                  const dl = deadlineLabel(o.deadline);
                  const qty = o.items.reduce((a, i) => a + i.qty, 0);
                  return (
                    <tr key={o.id} className="border-b border-border/50 transition-colors hover:bg-accent/30">
                      <td className="py-2.5 pr-3">
                        <Link to="/orders/$orderId" params={{ orderId: o.id.replace("#", "") }} className="font-mono text-xs font-semibold text-primary hover:underline">
                          {o.id}
                        </Link>
                      </td>
                      <td className="py-2.5 pr-3 text-xs">{o.customer}</td>
                      <td className="py-2.5 pr-3"><PriorityBadge level={pr.level} /></td>
                      <td className="py-2.5 pr-3 font-display text-sm font-bold tabular-nums">{pr.score}</td>
                      <td className="py-2.5 pr-3 text-xs text-muted-foreground">{o.items.length}</td>
                      <td className="py-2.5 pr-3 text-xs tabular-nums">{qty}</td>
                      <td className="py-2.5 pr-3"><StatusBadge status={o.status} /></td>
                      <td className={`py-2.5 pr-3 text-xs ${dl.tone}`}>{dl.text}</td>
                      <td className="py-2.5 pr-3">
                        {risk ? (
                          <span className="rounded-md bg-critical/15 px-2 py-0.5 text-[11px] font-medium text-critical">At risk</span>
                        ) : (
                          <span className="rounded-md bg-success/12 px-2 py-0.5 text-[11px] font-medium text-success">On track</span>
                        )}
                      </td>
                      <td className="py-2.5 pr-3 text-[11px] text-muted-foreground">
                        {o.status === "awaiting-stock"
                          ? "Allocate incoming stock / backorder"
                          : o.status === "ready-dispatch"
                            ? "Dispatch now — deadline protected"
                            : o.status === "dispatched"
                              ? "Completed"
                              : risk
                                ? "Escalate to top of pick queue"
                                : `Continue standard flow (${pr.reasons[0]})`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}