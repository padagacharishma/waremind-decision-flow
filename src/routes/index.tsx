import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Boxes,
  CheckCircle2,
  ClipboardList,
  Gauge,
  PackageCheck,
  Route as RouteIcon,
  ShieldAlert,
  Truck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState, PageHeader, PriorityBadge, SectionCard, StatCard, StatusBadge, deadlineLabel, timeAgo } from "@/components/waremind/primitives";
import { ExceptionCard } from "@/components/waremind/ExceptionUI";
import { useWarehouse } from "@/lib/waremind/store";
import { OPEN_STATUSES, allocationPlan, isAtRisk, metrics, priorityOf } from "@/lib/waremind/engine";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Warehouse Decision Center — WAREMIND" },
      {
        name: "description",
        content:
          "Live warehouse health, critical exceptions and AI-recommended next actions in one operations control room.",
      },
      { property: "og:title", content: "Warehouse Decision Center — WAREMIND" },
      { property: "og:description", content: "Decide what should happen next in your warehouse — and why." },
    ],
  }),
  component: Dashboard,
});

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
}

function Dashboard() {
  const { state, applyStockRecommendation, resetDemo } = useWarehouse();
  const m = metrics(state);
  const active = state.exceptions.filter((e) => e.status !== "resolved");
  const conflict = allocationPlan("SKU-109", state);
  const conflictOpen = conflict.lines.length > 1 && conflict.totalDemand > conflict.availableQty;
  const conflictException = state.exceptions.find((e) => e.kind === "stock-shortage" && e.status !== "resolved");

  const queue = state.orders
    .filter((o) => OPEN_STATUSES.includes(o.status))
    .map((o) => ({ o, pr: priorityOf(o, state.products) }))
    .sort((a, b) => b.pr.score - a.pr.score)
    .slice(0, 6);

  const roleTitle = {
    manager: "Warehouse Decision Center",
    picker: "Picker Control Center",
    packer: "Packing & Quality Center",
    dispatch: "Dispatch Control Center",
  }[state.role];

  return (
    <div className="mx-auto max-w-[1500px]">
      <PageHeader
        title={`${greeting()}, Manager 👋`}
        subtitle={roleTitle}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={resetDemo}>
              Reset demo scenario
            </Button>
            <Button asChild size="sm" className="gap-1.5">
              <Link to="/exceptions">
                <ShieldAlert className="size-4" /> Exceptions ({active.length})
              </Link>
            </Button>
          </>
        }
      />

      {conflictOpen && conflictException && (
        <div className="mb-6 overflow-hidden rounded-2xl border border-critical/45 bg-gradient-to-r from-critical/12 via-background/10 to-transparent p-4 sm:p-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="wm-pulse inline-flex items-center gap-1.5 rounded-full bg-critical px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-white">
              <AlertTriangle className="size-3.5" /> Critical inventory conflict
            </span>
            <span className="text-xs text-muted-foreground">Detected {timeAgo(conflictException.createdAt)}</span>
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-[1.1fr_1fr]">
            <div>
              <h2 className="font-display text-lg font-semibold">
                {conflict.product.sku} · {conflict.product.name}
              </h2>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Metric label="Available stock" value={`${conflict.availableQty}`} tone="text-critical" />
                <Metric label="Total demand" value={`${conflict.totalDemand}`} />
                <Metric label="Orders competing" value={`${conflict.lines.length}`} />
                <Metric label="Shortage" value={`${Math.max(0, conflict.totalDemand - conflict.availableQty)}`} tone="text-warning" />
              </div>
              <div className="mt-4 space-y-2">
                {conflict.lines.map((l) => (
                  <div key={l.orderId} className="flex flex-wrap items-center gap-2 rounded-lg border border-border/70 bg-background/40 px-3 py-2 text-xs">
                    <span className="font-mono font-semibold">{l.orderId}</span>
                    <PriorityBadge level={l.level} score={l.score} />
                    <span className="text-muted-foreground">requires {l.requested}</span>
                    <span className="ml-auto font-medium text-primary">→ allocate {l.allocated}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-primary/30 bg-primary/8 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">System recommendation</p>
              <p className="mt-1.5 text-sm">{conflictException.recommendation}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">Reason: </span>
                {conflictException.reason}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button size="sm" className="gap-1.5" onClick={() => applyStockRecommendation(conflictException.id)}>
                  <CheckCircle2 className="size-4" /> Apply recommendation
                </Button>
                <Button asChild size="sm" variant="secondary">
                  <Link to="/allocation">View alternatives</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
        <StatCard label="Inventory Health" value={m.inventoryHealth} suffix="%" tone="success" icon={<Boxes className="size-4" />} />
        <StatCard label="Total Orders" value={m.totalOrders} icon={<ClipboardList className="size-4" />} />
        <StatCard label="Orders At Risk" value={m.atRisk} tone="critical" icon={<AlertTriangle className="size-4" />} />
        <StatCard label="Pending Picking" value={m.pendingPicking} tone="warning" icon={<RouteIcon className="size-4" />} />
        <StatCard label="Pending Packing" value={m.pendingPacking} tone="info" icon={<PackageCheck className="size-4" />} />
        <StatCard label="Ready to Dispatch" value={m.readyDispatch} tone="success" icon={<Truck className="size-4" />} />
        <StatCard label="Fulfillment Rate" value={m.fulfillmentRate} suffix="%" tone="success" icon={<Gauge className="size-4" />} />
        <StatCard label="Active Exceptions" value={m.activeExceptions} tone="critical" icon={<ShieldAlert className="size-4" />} />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[1.35fr_1fr]">
        <SectionCard
          title="Critical exceptions"
          description="What is happening · why it is happening · what you should do"
          actions={
            <Button asChild variant="ghost" size="sm" className="gap-1">
              <Link to="/exceptions">
                All exceptions <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          }
        >
          <div className="space-y-3">
            {active.length ? (
              active.slice(0, 3).map((e) => <ExceptionCard key={e.id} exception={e} />)
            ) : (
              <EmptyState
                icon={<CheckCircle2 className="size-6 text-success" />}
                title="No active exceptions"
                body="Every detected risk has been resolved. WAREMIND keeps monitoring inventory, picking and dispatch."
              />
            )}
          </div>
        </SectionCard>

        <div className="space-y-4">
          <SectionCard title="Intelligent priority queue" description="Scored live from tier, urgency, deadline, age & stock">
            <div className="space-y-2">
              {queue.map(({ o, pr }) => {
                const dl = deadlineLabel(o.deadline);
                return (
                  <Link
                    key={o.id}
                    to="/orders/$orderId"
                    params={{ orderId: o.id.replace("#", "") }}
                    className="flex items-center gap-3 rounded-xl border border-border/60 bg-background/30 px-3 py-2.5 transition-colors hover:border-primary/40"
                  >
                    <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-secondary font-display text-xs font-bold tabular-nums">
                      {pr.score}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold">{o.id}</span>
                        <PriorityBadge level={pr.level} />
                      </div>
                      <p className="truncate text-[11px] text-muted-foreground">{o.customer} · {pr.reasons[0]}</p>
                    </div>
                    <span className={`text-[11px] ${dl.tone}`}>{dl.text}</span>
                  </Link>
                );
              })}
            </div>
          </SectionCard>

          <SectionCard title="Activity & decision log" description="Everything the warehouse and the engine did">
            <ul className="max-h-72 space-y-3 overflow-y-auto wm-scroll pr-1">
              {state.activity.map((a) => (
                <li key={a.id} className="flex gap-3">
                  <span
                    className={`mt-1.5 size-2 shrink-0 rounded-full ${
                      a.kind === "exception"
                        ? "bg-critical"
                        : a.kind === "decision"
                          ? "bg-info"
                          : a.kind === "success"
                            ? "bg-success"
                            : "bg-muted-foreground"
                    }`}
                  />
                  <div>
                    <p className="text-xs">{a.text}</p>
                    <p className="text-[10px] text-muted-foreground">{timeAgo(a.at)}</p>
                  </div>
                </li>
              ))}
            </ul>
          </SectionCard>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <QuickLink to="/allocation" icon={<Activity className="size-4" />} title="Smart allocation" body="Resolve competing demand for scarce stock with a scored plan." />
        <QuickLink to="/simulator" icon={<Gauge className="size-4" />} title="What-if simulator" body="Test decisions safely before they touch the live warehouse." />
        <QuickLink to="/assistant" icon={<ShieldAlert className="size-4" />} title="AI warehouse assistant" body="Ask what's at risk, what will stock out and what to prioritise." />
      </div>
    </div>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-lg border border-border/60 bg-background/40 px-3 py-2">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`font-display text-xl font-bold tabular-nums ${tone ?? ""}`}>{value}</p>
    </div>
  );
}

function QuickLink({ to, icon, title, body }: { to: "/allocation" | "/simulator" | "/assistant"; icon: React.ReactNode; title: string; body: string }) {
  return (
    <Link to={to} className="glass group flex items-start gap-3 rounded-2xl p-4 transition-all hover:-translate-y-0.5 hover:border-primary/40">
      <span className="grid size-9 place-items-center rounded-lg bg-primary/15 text-primary">{icon}</span>
      <div>
        <p className="font-display text-sm font-semibold">{title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{body}</p>
      </div>
      <ArrowRight className="ml-auto size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

export { isAtRisk, StatusBadge };
