import type { Order, Product, WarehouseException, WarehouseState, ActivityEntry } from "./types";

const HOUR = 3600_000;

// Deterministic base time so SSR and client agree; offsets are relative.
export const NOW_ANCHOR = 0;

export function makeProducts(): Product[] {
  const raw: [string, string, string, "A" | "B" | "C", string, number, number, number, number, number, number][] = [
    ["SKU-109", "Product A — Titan Hydration Flask", "Consumer Goods", "A", "A-01", 7, 0, 9, 0, 3, 25],
    ["SKU-204", "Aurora LED Desk Lamp", "Electronics", "A", "A-05", 18, 4, 12, 0, 2, 40],
    ["SKU-311", "NovaBook Sleeve 14\"", "Accessories", "B", "B-03", 132, 12, 9, 60, 4, 45],
    ["SKU-402", "Helix Cable Kit", "Electronics", "B", "B-10", 0, 0, 7, 80, 5, 30],
    ["SKU-118", "Cobalt Bluetooth Speaker", "Electronics", "A", "A-08", 46, 8, 11, 0, 3, 40],
    ["SKU-527", "Vertex Office Chair Mat", "Furniture", "C", "C-02", 24, 6, 5, 20, 6, 20],
    ["SKU-633", "Lumen Smart Bulb 4-pack", "Electronics", "C", "C-07", 9, 2, 8, 0, 4, 35],
    ["SKU-741", "Everest Backpack 30L", "Apparel", "B", "B-06", 88, 10, 6, 0, 5, 30],
    ["SKU-802", "Pulse Fitness Band", "Wearables", "A", "A-12", 61, 5, 14, 40, 3, 50],
    ["SKU-915", "Zenith Noise Cancel Headset", "Electronics", "B", "B-01", 15, 3, 10, 0, 4, 38],
    ["SKU-121", "Terra Ceramic Mug Set", "Home", "C", "C-04", 210, 18, 12, 0, 7, 60],
    ["SKU-238", "Nimbus Air Purifier", "Appliances", "C", "C-09", 12, 4, 3, 15, 8, 12],
    ["SKU-344", "Orbit Wireless Mouse", "Electronics", "A", "A-03", 154, 20, 22, 0, 3, 80],
    ["SKU-455", "Slate Standing Desk Riser", "Furniture", "C", "C-11", 33, 5, 4, 0, 9, 18],
    ["SKU-560", "Flint Camping Lantern", "Outdoor", "B", "B-14", 5, 1, 6, 30, 6, 25],
    ["SKU-678", "Quartz Wall Clock", "Home", "C", "C-05", 74, 6, 3, 0, 5, 15],
    ["SKU-789", "Atlas Travel Adapter", "Accessories", "A", "A-10", 96, 14, 16, 0, 2, 55],
    ["SKU-830", "Delta Mechanical Keyboard", "Electronics", "B", "B-08", 27, 9, 13, 0, 4, 48],
    ["SKU-902", "Cirrus Yoga Mat", "Fitness", "C", "C-14", 41, 3, 5, 0, 6, 20],
    ["SKU-950", "Ember Insulated Lunchbox", "Home", "A", "A-15", 3, 0, 4, 0, 5, 22],
    ["SKU-977", "Vanta Webcam 4K", "Electronics", "B", "B-12", 58, 7, 9, 25, 3, 35],
    ["SKU-991", "Solstice Sunglasses", "Apparel", "A", "A-06", 122, 4, 7, 0, 4, 30],
  ];
  return raw.map(
    ([sku, name, category, zone, location, stock, reserved, dailyDemand, incoming, leadTimeDays, reorderThreshold]) => ({
      sku,
      name,
      category,
      zone,
      location,
      stock,
      reserved,
      dailyDemand,
      incoming,
      leadTimeDays,
      reorderThreshold,
      quarantined: 0,
    }),
  );
}

let seq = 0;
const t = (h: number) => Date.now() + h * HOUR;

function order(
  id: string,
  customer: string,
  tier: Order["customerTier"],
  urgency: Order["urgency"],
  ageH: number,
  deadlineH: number,
  items: [string, number][],
  status: Order["status"] = "created",
  extra: Partial<Order> = {},
): Order {
  seq++;
  return {
    id,
    customer,
    customerTier: tier,
    urgency,
    createdAt: t(-ageH),
    deadline: t(deadlineH),
    items: items.map(([sku, qty]) => ({
      sku,
      qty,
      allocated: ["allocated", "picking", "packing", "qc", "ready-dispatch", "dispatched"].includes(status) ? qty : 0,
      picked: ["packing", "qc", "ready-dispatch", "dispatched"].includes(status) ? qty : 0,
      status: "pending" as const,
    })),
    status,
    qc: status === "qc" ? "pending" : undefined,
    timeline: [
      { at: t(-ageH), label: "Order created", actor: "System", kind: "info" },
      { at: t(-ageH + 0.05), label: "Priority calculated", actor: "WAREMIND Engine", kind: "decision" },
    ],
    ...extra,
  };
}

export function makeOrders(): Order[] {
  return [
    order("#1042", "Northwind Retail Group", "premium", "express", 5, 2, [["SKU-109", 10]], "created"),
    order("#1043", "Bluepeak Supplies", "standard", "standard", 7, 8, [["SKU-109", 5]], "created"),
    order("#1044", "Harbor Lane Store", "basic", "economy", 10, 26, [["SKU-109", 2]], "created"),
    order("#1045", "Copperfield Mart", "basic", "economy", 3, 40, [["SKU-121", 12], ["SKU-678", 3]], "created"),
    order("#1038", "Vertex Industries", "standard", "express", 14, 6, [["SKU-204", 8], ["SKU-344", 4]], "allocated"),
    order("#1039", "Silverline Traders", "premium", "standard", 12, 5, [["SKU-915", 6]], "picking", {
      picker: "P-02",
    }),
    order("#1040", "Kestrel Logistics", "standard", "express", 9, 3, [["SKU-633", 5], ["SKU-118", 2]], "picking", {
      picker: "P-01",
    }),
    order("#1041", "Moonrise Outfitters", "basic", "standard", 20, 12, [["SKU-741", 4]], "packing", {
      packer: "K-01",
    }),
    order("#1046", "Ironwood Supply Co.", "premium", "express", 6, 4, [["SKU-830", 6], ["SKU-977", 2]], "packing", {
      packer: "K-02",
    }),
    order("#1047", "Lakeshore Depot", "standard", "standard", 16, 9, [["SKU-902", 5]], "qc", { packer: "K-01" }),
    order("#1048", "Granite Peak Ltd", "premium", "standard", 18, 7, [["SKU-789", 10]], "qc", { packer: "K-02" }),
    order("#1049", "Redwood Retail", "standard", "economy", 24, 14, [["SKU-991", 8]], "ready-dispatch"),
    order("#1050", "Halcyon Home", "basic", "standard", 26, 10, [["SKU-121", 20]], "ready-dispatch"),
    order("#1051", "Summit Traders", "premium", "express", 30, -1, [["SKU-560", 4]], "delayed"),
    order("#1052", "Willow & Co", "standard", "standard", 40, -6, [["SKU-238", 3]], "dispatched", {
      dispatchedAt: t(-6),
    }),
    order("#1053", "Beacon Supplies", "basic", "economy", 44, -9, [["SKU-344", 15]], "dispatched", {
      dispatchedAt: t(-9),
    }),
    order("#1054", "Cinder Works", "standard", "express", 4, 5, [["SKU-402", 6]], "awaiting-stock"),
    order("#1055", "Pinehurst Group", "premium", "standard", 2, 11, [["SKU-950", 5], ["SKU-118", 3]], "created"),
  ];
}

export function makeExceptions(): WarehouseException[] {
  const now = Date.now();
  return [
    {
      id: "EXC-001",
      kind: "stock-shortage",
      title: "Critical inventory conflict — SKU-109 (Product A)",
      severity: "critical",
      orderId: "#1042",
      sku: "SKU-109",
      problem:
        "Product SKU-109 has 7 units available but 17 units are demanded across 3 pending orders. Order #1042 requires 10 units with a dispatch deadline in 2 hours.",
      recommendation:
        "Allocate all 7 available units to Order #1042, place the remaining 3 units on backorder, and trigger replenishment.",
      reason:
        "Order #1042 has a higher priority score and an earlier dispatch deadline than competing orders #1043 and #1044.",
      alternatives: [
        { label: "Maximize urgent orders", impact: "1 express order fulfilled on time, 2 orders delayed by ~1 day." },
        { label: "Maximize number of orders completed", impact: "#1043 + #1044 fulfilled (7 units), #1042 misses SLA." },
        { label: "Maximize premium customer fulfillment", impact: "Premium SLA protected, 2 standard orders delayed." },
      ],
      status: "action-recommended",
      createdAt: now - 12 * 60_000,
      timeline: [
        {
          at: now - 12 * 60_000,
          label: "EXCEPTION: Stock shortage detected",
          detail: "Available 7 · Demand 17",
          actor: "WAREMIND Engine",
          kind: "exception",
        },
      ],
    },
    {
      id: "EXC-002",
      kind: "missing-item",
      title: "Missing item reported during picking — SKU-204",
      severity: "warning",
      orderId: "#1038",
      sku: "SKU-204",
      problem: "Picker P-03 could not locate 2 units of SKU-204 at location A-05 during picking of Order #1038.",
      recommendation: "Reallocate replacement inventory from incoming buffer and re-issue the pick task.",
      reason: "Inventory record shows 18 units on hand but cycle-count variance detected at A-05.",
      alternatives: [
        { label: "Cycle count zone A first", impact: "Accuracy restored, order delayed ~35 min." },
        { label: "Partial ship now", impact: "Order ships on time at 75% fill rate." },
      ],
      status: "investigating",
      createdAt: now - 46 * 60_000,
      timeline: [
        {
          at: now - 46 * 60_000,
          label: "EXCEPTION: Missing item reported",
          actor: "Picker P-03",
          kind: "exception",
        },
      ],
    },
    {
      id: "EXC-003",
      kind: "bottleneck",
      title: "Zone C picking bottleneck",
      severity: "at-risk",
      problem: "18 orders are waiting in Zone C. Average processing time is 18 min/order versus a 10 min target.",
      recommendation: "Assign one additional picker to Zone C for the next 2 hours.",
      reason: "Zone C holds 42% of pending picking tasks with only one assigned picker.",
      alternatives: [
        { label: "Rebalance Zone A picker to Zone C", impact: "Zone C −38% wait, Zone A +12% wait." },
        { label: "Batch-pick Zone C orders", impact: "Travel distance −22%, setup time +10 min." },
      ],
      status: "action-recommended",
      createdAt: now - 90 * 60_000,
      timeline: [
        { at: now - 90 * 60_000, label: "EXCEPTION: Bottleneck detected", actor: "WAREMIND Engine", kind: "exception" },
      ],
    },
  ];
}

export function makeActivity(): ActivityEntry[] {
  const now = Date.now();
  const rows: [number, ActivityEntry["kind"], string][] = [
    [3, "exception", "Critical inventory conflict detected on SKU-109 (demand 17 · available 7)."],
    [14, "info", "Order #1046 moved to Packing."],
    [28, "exception", "Picker P-03 reported missing item SKU-204."],
    [41, "decision", "Reorder recommendation created for SKU-204 (60 units)."],
    [55, "info", "Order #1040 moved to Picking · Zone A route generated."],
    [72, "exception", "Zone C bottleneck detected — 18 orders queued."],
    [96, "success", "Order #1052 dispatched to Willow & Co."],
    [140, "success", "Order #1053 dispatched to Beacon Supplies."],
  ];
  return rows.map(([m, kind, text], i) => ({ id: `ACT-${i}`, at: now - m * 60_000, kind, text }));
}

export function initialState(): WarehouseState {
  const now = Date.now();
  return {
    role: "manager",
    products: makeProducts(),
    orders: makeOrders(),
    exceptions: makeExceptions(),
    decisions: [
      {
        id: "DEC-001",
        at: now - 5 * HOUR,
        actor: "WAREMIND Engine",
        title: "Priority re-ranking executed",
        detail: "18 open orders scored across customer tier, urgency, deadline, age and inventory availability.",
        outcome: "Order #1042 promoted to CRITICAL (score 94).",
        relatedOrder: "#1042",
      },
      {
        id: "DEC-002",
        at: now - 3 * HOUR,
        actor: "Warehouse Manager",
        title: "Replenishment approved for SKU-402",
        detail: "Stockout detected with 7 units/day demand and 5-day lead time.",
        outcome: "80 units inbound, ETA 2 days.",
        relatedSku: "SKU-402",
      },
    ],
    activity: makeActivity(),
    notifications: [
      {
        id: "N1",
        at: now - 2 * 60_000,
        title: "Critical inventory conflict",
        body: "SKU-109 — 17 units demanded, 7 available across 3 orders.",
        severity: "critical",
        read: false,
      },
      {
        id: "N2",
        at: now - 22 * 60_000,
        title: "Stockout",
        body: "SKU-402 is out of stock. 80 units inbound.",
        severity: "critical",
        read: false,
      },
      {
        id: "N3",
        at: now - 35 * 60_000,
        title: "Reorder recommendation",
        body: "SKU-204 has 1.5 days of cover remaining. Order 60 units.",
        severity: "warning",
        read: false,
      },
      {
        id: "N4",
        at: now - 48 * 60_000,
        title: "Dispatch deadline approaching",
        body: "Order #1042 must dispatch within 2 hours.",
        severity: "warning",
        read: false,
      },
      {
        id: "N5",
        at: now - 70 * 60_000,
        title: "Picking bottleneck",
        body: "Zone C average 18 min/order vs 10 min target.",
        severity: "info",
        read: true,
      },
    ],
    replenishments: [
      {
        id: "REP-001",
        sku: "SKU-402",
        qty: 80,
        at: now - 3 * HOUR,
        status: "in-transit",
        reason: "Stockout with 7 units/day demand.",
      },
    ],
    allocations: [],
    pickers: [
      { id: "P-01", name: "Ravi Kumar", zone: "A", load: 6 },
      { id: "P-02", name: "Elena Duarte", zone: "B", load: 5 },
      { id: "P-03", name: "Marcus Bell", zone: "C", load: 9 },
    ],
    routeOptimized: {},
    extraPickerZoneC: false,
  };
}