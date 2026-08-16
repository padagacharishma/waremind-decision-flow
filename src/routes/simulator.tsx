import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PageHeader, SectionCard } from "@/components/waremind/primitives";
import { useWarehouse } from "@/lib/waremind/store";

export const Route = createFileRoute("/simulator")({
  head: () => ({
    meta: [
      { title: "What-If Simulator — WAREMIND" },
      { name: "description", content: "Simulate stockouts, prioritisation policies and staffing changes without touching live state." },
      { property: "og:title", content: "What-If Simulator — WAREMIND" },
      { property: "og:description", content: "Test the decision before you make it." },
    ],
  }),
  component: SimulatorPage,
});

const SCENARIOS = [
  {
    id: "stockout",
    title: "What happens if Product A goes out of stock?",
    before: [["Orders fulfilled", "96"], ["Orders delayed", "8"], ["High-priority at risk", "2"]],
    after: [["Orders fulfilled", "89"], ["Orders delayed", "15"], ["High-priority at risk", "6"]],
    action: "Trigger emergency replenishment for SKU-109 and hold low-priority demand.",
  },
  {
    id: "premium",
    title: "What happens if we prioritise premium customers?",
    before: [["Orders fulfilled", "96"], ["Orders delayed", "8"], ["Premium SLA met", "88%"]],
    after: [["Premium orders fulfilled", "99"], ["Standard orders delayed", "5"], ["Premium SLA met", "99%"]],
    action: "Apply premium-weighted allocation for the next 4 hours.",
  },
  {
    id: "picker",
    title: "What happens if we add one picker to Zone C?",
    before: [["Avg picking time", "18 min"], ["Orders/hour", "22"], ["Bottleneck risk", "High"]],
    after: [["Avg picking time", "11 min"], ["Orders/hour", "31"], ["Bottleneck risk", "Low"]],
    action: "Reassign one picker from Zone A to Zone C for two hours.",
  },
];

function SimulatorPage() {
  const { state } = useWarehouse();
  const [active, setActive] = useState(SCENARIOS[0]!.id);
  const [ran, setRan] = useState(false);
  const scenario = SCENARIOS.find((s) => s.id === active)!;

  return (
    <div className="mx-auto max-w-[1100px]">
      <PageHeader title="What-If Simulator" subtitle={`Sandbox mode — live warehouse state (${state.orders.length} orders) is never modified`} />
      <SectionCard>
        <div className="mb-4 flex flex-wrap gap-2">
          {SCENARIOS.map((s) => (
            <Button key={s.id} size="sm" variant={active === s.id ? "default" : "outline"} onClick={() => { setActive(s.id); setRan(false); }}>
              {s.title.slice(0, 34)}…
            </Button>
          ))}
        </div>
        <h2 className="font-display text-lg font-semibold">{scenario.title}</h2>
        <Button className="mt-3" onClick={() => setRan(true)}>Run simulation</Button>

        {ran && (
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-border/70 p-4">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Current</p>
              {scenario.before.map(([k, v]) => (
                <div key={k} className="mt-2 flex justify-between text-sm"><span className="text-muted-foreground">{k}</span><span className="font-display font-bold">{v}</span></div>
              ))}
            </div>
            <div className="rounded-xl border border-primary/40 bg-primary/8 p-4">
              <p className="text-[11px] uppercase tracking-wider text-primary">Simulated</p>
              {scenario.after.map(([k, v]) => (
                <div key={k} className="mt-2 flex justify-between text-sm"><span className="text-muted-foreground">{k}</span><span className="font-display font-bold text-primary">{v}</span></div>
              ))}
            </div>
            <div className="md:col-span-2 rounded-xl border border-border/70 p-4 text-sm">
              <span className="font-semibold">Recommended action: </span>{scenario.action}
            </div>
          </div>
        )}
      </SectionCard>
    </div>
  );
}