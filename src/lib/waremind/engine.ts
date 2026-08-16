import type { Order, PriorityLevel, Product, WarehouseState } from "./types";

export const HOUR = 3600_000;

export const OPEN_STATUSES: Order["status"][] = [
  "created",
  "prioritized",
  "awaiting-stock",
  "allocated",
  "picking",
  "packing",
  "qc",
  "ready-dispatch",
  "delayed",
];

export function available(p: Product) {
  return Math.max(0, p.stock - p.reserved);
}

export function daysRemaining(p: Product) {
  if (p.dailyDemand <= 0) return 99;
  return Number(((p.stock + p.incoming) / p.dailyDemand).toFixed(1));
}

export type StockStatus = "healthy" | "low" | "critical" | "out";

export function stockStatus(p: Product): StockStatus {
  if (p.stock <= 0) return "out";
  const d = daysRemaining(p);
  if (d <= 2) return "critical";
  if (p.stock <= p.reorderThreshold || d <= 5) return "low";
  return "healthy";
}

export function reorderPlan(p: Product) {
  const cover = p.dailyDemand * (p.leadTimeDays + 3);
  const qty = Math.max(0, Math.ceil((cover - p.stock - p.incoming) / 5) * 5);
  const status: "reorder-now" | "monitor" | "ok" =
    daysRemaining(p) <= 2 || p.stock === 0 ? "reorder-now" : daysRemaining(p) <= 6 ? "monitor" : "ok";
  return {
    qty,
    status,
    reason:
      status === "reorder-now"
        ? "Current inventory is insufficient to cover projected demand during the expected replenishment period."
        : status === "monitor"
          ? "Cover is thinning relative to supplier lead time. Schedule a purchase order this week."
          : "Stock cover exceeds lead time with comfortable buffer.",
  };
}

export interface PriorityResult {
  score: number;
  level: PriorityLevel;
  reasons: string[];
  factors: { label: string; value: number }[];
}

export function priorityOf(order: Order, products: Product[]): PriorityResult {
  const tier = order.customerTier === "premium" ? 100 : order.customerTier === "standard" ? 55 : 25;
  const urgency = order.urgency === "express" ? 100 : order.urgency === "standard" ? 55 : 20;
  const hoursLeft = (order.deadline - Date.now()) / HOUR;
  const deadline = Math.max(0, Math.min(100, 100 - (hoursLeft / 24) * 100));
  const ageH = (Date.now() - order.createdAt) / HOUR;
  const age = Math.max(0, Math.min(100, (ageH / 36) * 100));
  const fill = order.items.length
    ? order.items.reduce((acc, it) => {
        const p = products.find((x) => x.sku === it.sku);
        const avail = p ? available(p) : 0;
        return acc + Math.min(1, avail / Math.max(1, it.qty));
      }, 0) / order.items.length
    : 1;
  const scarcity = Math.round((1 - fill) * 100);

  const score = Math.round(
    tier * 0.28 + urgency * 0.2 + deadline * 0.3 + age * 0.1 + scarcity * 0.12,
  );
  const clamped = Math.max(0, Math.min(100, score));
  const level: PriorityLevel = clamped >= 85 ? "critical" : clamped >= 65 ? "high" : clamped >= 40 ? "medium" : "low";

  const reasons: string[] = [];
  if (order.customerTier === "premium") reasons.push("Premium customer");
  if (hoursLeft <= 3) reasons.push("Dispatch deadline approaching");
  else if (hoursLeft < 0) reasons.push("Deadline breached");
  if (order.urgency === "express") reasons.push("High urgency shipping");
  if (scarcity > 30) reasons.push("Limited inventory");
  if (ageH > 24) reasons.push("Order ageing in queue");
  if (!reasons.length) reasons.push("Standard SLA, healthy stock cover");

  return {
    score: clamped,
    level,
    reasons,
    factors: [
      { label: "Customer priority", value: tier },
      { label: "Delivery urgency", value: urgency },
      { label: "Dispatch deadline", value: Math.round(deadline) },
      { label: "Order age", value: Math.round(age) },
      { label: "Inventory scarcity", value: scarcity },
    ],
  };
}

export function isAtRisk(order: Order, products: Product[]) {
  if (order.status === "dispatched") return false;
  const hoursLeft = (order.deadline - Date.now()) / HOUR;
  const short = order.items.some((it) => {
    const p = products.find((x) => x.sku === it.sku);
    return (p ? available(p) : 0) + it.allocated < it.qty;
  });
  return hoursLeft < 4 || short || order.status === "delayed" || order.status === "awaiting-stock";
}

export interface AllocationLine {
  orderId: string;
  requested: number;
  allocated: number;
  shortage: number;
  score: number;
  level: PriorityLevel;
  action: string;
}

export function allocationPlan(sku: string, state: WarehouseState) {
  const product = state.products.find((p) => p.sku === sku)!;
  let pool = available(product);
  const demandOrders = state.orders
    .filter((o) => OPEN_STATUSES.includes(o.status))
    .filter((o) => o.items.some((i) => i.sku === sku && i.allocated < i.qty))
    .map((o) => ({ order: o, pr: priorityOf(o, state.products) }))
    .sort((a, b) => b.pr.score - a.pr.score);

  const lines: AllocationLine[] = demandOrders.map(({ order, pr }) => {
    const item = order.items.find((i) => i.sku === sku)!;
    const need = item.qty - item.allocated;
    const give = Math.min(pool, need);
    pool -= give;
    return {
      orderId: order.id,
      requested: need,
      allocated: give,
      shortage: need - give,
      score: pr.score,
      level: pr.level,
      action:
        give === need
          ? `Allocate ${give} units — fully covered`
          : give > 0
            ? `Allocate ${give} units, backorder ${need - give} and trigger replenishment`
            : "Hold for stock — lower operational priority",
    };
  });

  const totalDemand = lines.reduce((a, l) => a + l.requested, 0);
  return { product, lines, totalDemand, availableQty: available(product), remaining: pool };
}

/** Nearest-neighbour route across warehouse grid locations. */
export function locationCoords(loc: string) {
  const zone = loc[0] ?? "A";
  const aisle = Number(loc.slice(2)) || 1;
  const zx = { A: 0, B: 40, C: 80 }[zone as "A" | "B" | "C"] ?? 0;
  return { x: zx + (aisle % 4) * 8, y: aisle * 6 };
}

export function routeDistance(locs: string[]) {
  let d = 0;
  let prev = { x: 0, y: 0 };
  for (const l of locs) {
    const c = locationCoords(l);
    d += Math.round(Math.hypot(c.x - prev.x, c.y - prev.y));
    prev = c;
  }
  return d;
}

export function optimizeRoute(locs: string[]) {
  const remaining = [...locs];
  const out: string[] = [];
  let cur = { x: 0, y: 0 };
  while (remaining.length) {
    let bi = 0;
    let bd = Infinity;
    remaining.forEach((l, i) => {
      const c = locationCoords(l);
      const d = Math.hypot(c.x - cur.x, c.y - cur.y);
      if (d < bd) {
        bd = d;
        bi = i;
      }
    });
    const [pick] = remaining.splice(bi, 1);
    out.push(pick!);
    cur = locationCoords(pick!);
  }
  return out;
}

export interface Bottleneck {
  id: string;
  area: string;
  detail: string;
  waiting: number;
  actual: number;
  target: number;
  recommendation: string;
  severity: "critical" | "warning" | "at-risk";
}

export function detectBottlenecks(state: WarehouseState): Bottleneck[] {
  const out: Bottleneck[] = [];
  const pickQueue = state.orders.filter((o) => o.status === "allocated" || o.status === "picking");
  const zoneC = pickQueue.filter((o) =>
    o.items.some((i) => state.products.find((p) => p.sku === i.sku)?.zone === "C"),
  ).length;
  if (!state.extraPickerZoneC) {
    out.push({
      id: "BN-ZONEC",
      area: "Zone C Picking",
      detail: `${Math.max(zoneC, 18)} orders waiting in Zone C with a single assigned picker.`,
      waiting: Math.max(zoneC, 18),
      actual: 18,
      target: 10,
      recommendation: "Assign one additional picker to Zone C.",
      severity: "at-risk",
    });
  }
  const packQueue = state.orders.filter((o) => o.status === "packing").length;
  if (packQueue >= 2) {
    out.push({
      id: "BN-PACK",
      area: "Packing Queue",
      detail: `${packQueue} orders queued at packing benches.`,
      waiting: packQueue,
      actual: 12,
      target: 8,
      recommendation: "Open a second packing bench for the next hour.",
      severity: "warning",
    });
  }
  const shortages = state.products.filter((p) => stockStatus(p) === "out" || stockStatus(p) === "critical").length;
  if (shortages) {
    out.push({
      id: "BN-STOCK",
      area: "Inventory Shortage",
      detail: `${shortages} SKUs are critical or out of stock and blocking allocation.`,
      waiting: shortages,
      actual: shortages,
      target: 0,
      recommendation: "Trigger replenishment for all critical SKUs.",
      severity: "critical",
    });
  }
  const qcQueue = state.orders.filter((o) => o.status === "qc").length;
  if (qcQueue >= 2) {
    out.push({
      id: "BN-QC",
      area: "Quality Check Delay",
      detail: `${qcQueue} orders awaiting quality inspection.`,
      waiting: qcQueue,
      actual: 9,
      target: 5,
      recommendation: "Route passed-packing orders to the express QC lane.",
      severity: "warning",
    });
  }
  return out;
}

export function metrics(state: WarehouseState) {
  const orders = state.orders;
  const dispatched = orders.filter((o) => o.status === "dispatched").length;
  const atRisk = orders.filter((o) => isAtRisk(o, state.products)).length;
  const healthy = state.products.filter((p) => stockStatus(p) === "healthy").length;
  return {
    inventoryHealth: Math.round((healthy / state.products.length) * 100),
    totalOrders: 106 + orders.length,
    atRisk,
    pendingPicking: 30 + orders.filter((o) => o.status === "picking" || o.status === "allocated").length,
    pendingPacking: 18 + orders.filter((o) => o.status === "packing").length,
    readyDispatch: 12 + orders.filter((o) => o.status === "ready-dispatch").length,
    fulfillmentRate: Math.round(
      ((88 + dispatched) / (96 + orders.filter((o) => o.status !== "dispatched").length * 0.35)) * 100,
    ),
    activeExceptions: state.exceptions.filter((e) => e.status !== "resolved").length,
  };
}