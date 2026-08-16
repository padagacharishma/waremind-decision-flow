import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader, SectionCard } from "@/components/waremind/primitives";
import { useWarehouse } from "@/lib/waremind/store";
import { allocationPlan, daysRemaining, isAtRisk, priorityOf, stockStatus } from "@/lib/waremind/engine";
import type { WarehouseState } from "@/lib/waremind/types";

export const Route = createFileRoute("/assistant")({
  head: () => ({
    meta: [
      { title: "AI Warehouse Assistant — WAREMIND" },
      { name: "description", content: "Ask what is at risk, what will stock out and what to prioritise — answered from live warehouse data." },
      { property: "og:title", content: "AI Warehouse Assistant — WAREMIND" },
      { property: "og:description", content: "Answers grounded in your warehouse data, with reasoning and next action." },
    ],
  }),
  component: AssistantPage,
});

const CHIPS = ["Orders at risk", "Stockout risks", "Current bottleneck", "Recommended actions", "Today's priorities", "Why was Order #1042 prioritized?"];

function answer(q: string, state: WarehouseState) {
  const s = q.toLowerCase();
  if (s.includes("risk") && !s.includes("stock")) {
    const risky = state.orders.filter((o) => isAtRisk(o, state.products));
    const top = risky.map((o) => ({ o, pr: priorityOf(o, state.products) })).sort((a, b) => b.pr.score - a.pr.score)[0];
    return `${risky.length} orders are currently at risk. ${top ? `${top.o.id} is the highest priority (score ${top.pr.score}) because ${top.pr.reasons.join(", ").toLowerCase()}.` : ""} Recommended action: allocate available inventory to the highest-priority orders and trigger replenishment for the constrained SKUs.`;
  }
  if (s.includes("stock")) {
    const risky = [...state.products].sort((a, b) => daysRemaining(a) - daysRemaining(b)).slice(0, 3);
    return `${risky[0]!.sku} will stock out first — ${daysRemaining(risky[0]!)} days of cover at ${risky[0]!.dailyDemand} units/day. Next: ${risky.slice(1).map((p) => `${p.sku} (${daysRemaining(p)}d)`).join(", ")}. Recommended action: raise replenishment orders now for every SKU under 2 days of cover.`;
  }
  if (s.includes("zone") || s.includes("bottleneck") || s.includes("slow")) {
    return "Zone C is the current bottleneck: 18 orders queued at 18 min/order against a 10 min target, with only one assigned picker. Reason: Zone C holds 42% of pending picking tasks. Recommended action: assign one additional picker to Zone C for the next two hours.";
  }
  if (s.includes("1042") || s.includes("prioriti")) {
    const o = state.orders.find((x) => x.id === "#1042");
    if (o) {
      const pr = priorityOf(o, state.products);
      return `Order #1042 scores ${pr.score}/100 (${pr.level.toUpperCase()}). Contributing factors: ${pr.reasons.join(", ")}. Recommended action: allocate all available units of its constrained SKU and backorder the remainder.`;
    }
  }
  if (s.includes("allocat") || s.includes("available stock")) {
    const plan = allocationPlan("SKU-109", state);
    return `Available stock for SKU-109 is ${plan.availableQty} against ${plan.totalDemand} units of demand. Allocation plan: ${plan.lines.map((l) => `${l.orderId} → ${l.allocated}`).join(", ")}. Reason: allocation follows the intelligent priority score so the highest-impact order ships on time.`;
  }
  const critical = state.products.filter((p) => stockStatus(p) === "critical" || stockStatus(p) === "out").length;
  return `Right now: ${state.exceptions.filter((e) => e.status !== "resolved").length} active exceptions, ${state.orders.filter((o) => isAtRisk(o, state.products)).length} orders at risk and ${critical} SKUs in critical stock. Recommended action: resolve the SKU-109 inventory conflict first, then add picker capacity in Zone C.`;
}

function AssistantPage() {
  const { state } = useWarehouse();
  const [messages, setMessages] = useState<{ role: "user" | "ai"; text: string }[]>([
    { role: "ai", text: "I'm your WAREMIND assistant. Ask me what's at risk, what will stock out, or what to prioritise right now." },
  ]);
  const [input, setInput] = useState("");

  const send = (q: string) => {
    if (!q.trim()) return;
    setMessages((m) => [...m, { role: "user", text: q }, { role: "ai", text: answer(q, state) }]);
    setInput("");
  };

  return (
    <div className="mx-auto max-w-[900px]">
      <PageHeader title="AI Warehouse Assistant" subtitle="Answers grounded in live warehouse data, with reasoning and next action" />
      <SectionCard>
        <div className="mb-3 flex flex-wrap gap-2">
          {CHIPS.map((c) => (
            <Button key={c} size="sm" variant="outline" className="text-xs" onClick={() => send(c)}>{c}</Button>
          ))}
        </div>
        <div className="max-h-[52vh] space-y-3 overflow-y-auto wm-scroll pr-1">
          {messages.map((m, i) => (
            <div key={i} className={m.role === "user" ? "flex justify-end" : "flex"}>
              <p className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${m.role === "user" ? "bg-primary text-primary-foreground" : "border border-border/70 bg-background/40"}`}>{m.text}</p>
            </div>
          ))}
        </div>
        <form className="mt-4 flex gap-2" onSubmit={(e) => { e.preventDefault(); send(input); }}>
          <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask about risk, stockouts, bottlenecks or priorities" />
          <Button type="submit" size="icon" aria-label="Send"><Send className="size-4" /></Button>
        </form>
      </SectionCard>
    </div>
  );
}