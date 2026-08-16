import { createFileRoute } from "@tanstack/react-router";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { PageHeader, SectionCard } from "@/components/waremind/primitives";
import { useWarehouse } from "@/lib/waremind/store";
import { detectBottlenecks, priorityOf } from "@/lib/waremind/engine";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics & Bottleneck Detection — WAREMIND" },
      { name: "description", content: "Throughput, fulfillment and zone workload analytics with automatic bottleneck detection." },
      { property: "og:title", content: "Analytics & Bottleneck Detection — WAREMIND" },
      { property: "og:description", content: "Find the constraint before it costs you a shipment." },
    ],
  }),
  component: AnalyticsPage,
});

const hourly = Array.from({ length: 12 }, (_, i) => ({
  hour: `${8 + i}:00`,
  orders: 8 + Math.round(6 * Math.sin(i / 1.8) + (i % 3)),
  dispatched: 6 + Math.round(5 * Math.sin(i / 2)),
}));

const cycle = [
  { stage: "Picking", minutes: 16 },
  { stage: "Packing", minutes: 9 },
  { stage: "QC", minutes: 6 },
  { stage: "Dispatch", minutes: 5 },
];

const COLORS = ["var(--critical)", "var(--warning)", "var(--atrisk)", "var(--success)"];

function AnalyticsPage() {
  const { state, applyBottleneck } = useWarehouse();
  const bottlenecks = detectBottlenecks(state);
  const dist = ["critical", "high", "medium", "low"].map((level) => ({
    name: level,
    value: state.orders.filter((o) => priorityOf(o, state.products).level === level).length,
  }));
  const zones = (["A", "B", "C"] as const).map((z) => ({
    zone: `Zone ${z}`,
    tasks: state.orders.filter((o) => o.items.some((i) => state.products.find((p) => p.sku === i.sku)?.zone === z)).length,
  }));

  return (
    <div className="mx-auto max-w-[1400px]">
      <PageHeader title="Analytics" subtitle="Operational performance, workload distribution and constraints" />

      <SectionCard title="Bottleneck detector" description="Automatically detected constraints with a recommended action" className="mb-4">
        <div className="grid gap-3 md:grid-cols-2">
          {bottlenecks.map((b) => (
            <div key={b.id} className="rounded-xl border border-warning/35 bg-warning/6 p-3">
              <p className="font-display text-sm font-semibold">{b.area}</p>
              <p className="mt-1 text-xs text-muted-foreground">{b.detail}</p>
              <p className="mt-1 text-xs">Actual {b.actual} min/order vs target {b.target} min/order</p>
              <p className="mt-2 text-xs text-primary">Recommendation: {b.recommendation}</p>
              <Button size="sm" className="mt-3" onClick={() => applyBottleneck(b.id, b.area, b.recommendation)}>Apply recommendation</Button>
            </div>
          ))}
          {bottlenecks.length === 0 && <p className="text-xs text-muted-foreground">No bottlenecks detected — all stages are inside target cycle times.</p>}
        </div>
      </SectionCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="Orders per hour">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourly}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.08)" />
                <XAxis dataKey="hour" fontSize={11} stroke="currentColor" opacity={0.5} />
                <YAxis fontSize={11} stroke="currentColor" opacity={0.5} />
                <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }} />
                <Area type="monotone" dataKey="orders" stroke="var(--primary)" fill="var(--primary)" fillOpacity={0.2} />
                <Area type="monotone" dataKey="dispatched" stroke="var(--success)" fill="var(--success)" fillOpacity={0.15} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="Average cycle time by stage">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cycle}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.08)" />
                <XAxis dataKey="stage" fontSize={11} stroke="currentColor" opacity={0.5} />
                <YAxis fontSize={11} stroke="currentColor" opacity={0.5} />
                <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }} />
                <Bar dataKey="minutes" fill="var(--info)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="Order priority distribution">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={dist} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={3}>
                  {dist.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="Warehouse zone workload">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={zones}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.08)" />
                <XAxis dataKey="zone" fontSize={11} stroke="currentColor" opacity={0.5} />
                <YAxis fontSize={11} stroke="currentColor" opacity={0.5} />
                <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }} />
                <Bar dataKey="tasks" fill="var(--atrisk)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Operational insights" className="mt-4">
        <ul className="space-y-2 text-xs text-muted-foreground">
          <li>• Picking is currently the largest bottleneck in the fulfillment chain.</li>
          <li>• Zone C holds 42% of pending picking tasks with the lowest picker coverage.</li>
          <li>• 8% of open orders are at risk of missing their dispatch deadline.</li>
          <li>• SKU-204 is projected to stock out within 2 days at current demand velocity.</li>
        </ul>
      </SectionCard>
    </div>
  );
}