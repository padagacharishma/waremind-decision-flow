import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { DecisionTimeline, ExceptionCard } from "@/components/waremind/ExceptionUI";
import { EmptyState, PageHeader, PriorityBadge, SectionCard, StatusBadge, deadlineLabel } from "@/components/waremind/primitives";
import { useWarehouse } from "@/lib/waremind/store";
import { priorityOf } from "@/lib/waremind/engine";

export const Route = createFileRoute("/orders/$orderId")({
  head: ({ params }) => ({
    meta: [
      { title: `Order #${params.orderId} — WAREMIND` },
      { name: "description", content: `Fulfillment timeline, allocation and decisions for order #${params.orderId}.` },
      { property: "og:title", content: `Order #${params.orderId} — WAREMIND` },
      { property: "og:description", content: "Order fulfillment lifecycle with AI recommendations." },
    ],
  }),
  component: OrderDetail,
});

const FLOW = ["created", "prioritized", "allocated", "picking", "packing", "qc", "ready-dispatch", "dispatched"];

function OrderDetail() {
  const { orderId } = Route.useParams();
  const { state, advanceOrder, dispatchOrder, runQC } = useWarehouse();
  const order = state.orders.find((o) => o.id === `#${orderId}`);

  if (!order) {
    return (
      <EmptyState title="Order not found" body={`No order #${orderId} exists in the current warehouse state.`} />
    );
  }
  const pr = priorityOf(order, state.products);
  const dl = deadlineLabel(order.deadline);
  const exceptions = state.exceptions.filter((e) => e.orderId === order.id);
  const decisions = state.decisions.filter((d) => d.relatedOrder === order.id);
  const stageIndex = Math.max(0, FLOW.indexOf(order.status));

  return (
    <div className="mx-auto max-w-[1300px]">
      <PageHeader
        title={`Order ${order.id}`}
        subtitle={`${order.customer} · ${order.customerTier} customer · ${order.urgency} shipping`}
        actions={
          <>
            <Button asChild variant="outline" size="sm"><Link to="/orders">Back to orders</Link></Button>
            {order.status === "qc" && <Button size="sm" onClick={() => runQC(order.id, true)}>Pass QC</Button>}
            {order.status === "ready-dispatch" && <Button size="sm" onClick={() => dispatchOrder(order.id)}>Dispatch order</Button>}
            {["allocated", "picking", "packing"].includes(order.status) && (
              <Button size="sm" variant="secondary" onClick={() => advanceOrder(order.id, order.status === "allocated" ? "picking" : order.status === "picking" ? "packing" : "qc")}>
                Advance stage
              </Button>
            )}
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-4">
          <SectionCard title="Fulfillment timeline">
            <div className="flex flex-wrap gap-2">
              {FLOW.map((s, i) => (
                <div key={s} className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-[11px] capitalize ${i <= stageIndex ? "border-primary/40 bg-primary/10 text-foreground" : "border-border/60 text-muted-foreground"}`}>
                  <span className={`size-1.5 rounded-full ${i <= stageIndex ? "bg-primary" : "bg-muted-foreground/50"}`} />
                  {s.replace("-", " ")}
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Items & allocation">
            <div className="overflow-x-auto wm-scroll">
              <table className="w-full min-w-[520px] text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-[11px] uppercase text-muted-foreground">
                    <th className="py-2 font-medium">SKU</th><th className="py-2 font-medium">Product</th>
                    <th className="py-2 font-medium">Qty</th><th className="py-2 font-medium">Allocated</th>
                    <th className="py-2 font-medium">Picked</th><th className="py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((it) => {
                    const p = state.products.find((x) => x.sku === it.sku);
                    return (
                      <tr key={it.sku} className="border-b border-border/50">
                        <td className="py-2 font-mono text-xs">{it.sku}</td>
                        <td className="py-2 text-xs">{p?.name ?? "—"}</td>
                        <td className="py-2 text-xs tabular-nums">{it.qty}</td>
                        <td className="py-2 text-xs tabular-nums">{it.allocated}</td>
                        <td className="py-2 text-xs tabular-nums">{it.picked}</td>
                        <td className="py-2"><StatusBadge status={it.status === "pending" ? "created" : it.status} label={it.status} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </SectionCard>

          <SectionCard title="Order timeline">
            <DecisionTimeline entries={order.timeline} />
          </SectionCard>

          <SectionCard title="Exceptions on this order">
            {exceptions.length ? (
              <div className="space-y-3">{exceptions.map((e) => <ExceptionCard key={e.id} exception={e} />)}</div>
            ) : (
              <EmptyState title="No exceptions" body="This order has moved through fulfillment without incident." />
            )}
          </SectionCard>
        </div>

        <div className="space-y-4">
          <SectionCard title="Priority intelligence">
            <div className="flex items-center gap-3">
              <div className="grid size-14 place-items-center rounded-2xl bg-primary/15 font-display text-2xl font-bold text-primary tabular-nums">{pr.score}</div>
              <div><PriorityBadge level={pr.level} /><p className={`mt-1 text-xs ${dl.tone}`}>Dispatch {dl.text}</p></div>
            </div>
            <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
              {pr.reasons.map((r) => <li key={r}>• {r}</li>)}
            </ul>
            <div className="mt-4 space-y-2">
              {pr.factors.map((f) => (
                <div key={f.label}>
                  <div className="flex justify-between text-[11px] text-muted-foreground"><span>{f.label}</span><span className="tabular-nums">{f.value}</span></div>
                  <div className="mt-1 h-1.5 rounded-full bg-secondary"><div className="h-full rounded-full bg-primary" style={{ width: `${f.value}%` }} /></div>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Decision history">
            {decisions.length ? (
              <ul className="space-y-3">
                {decisions.map((d) => (
                  <li key={d.id} className="rounded-lg border border-border/60 p-3">
                    <p className="text-xs font-semibold">{d.title}</p>
                    <p className="mt-1 text-[11px] text-muted-foreground">{d.detail}</p>
                    <p className="mt-1 text-[11px] text-primary">{d.outcome}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState title="No decisions yet" body="Applied recommendations for this order will appear here." />
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  );
}