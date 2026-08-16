import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { initialState } from "./data";
import { allocationPlan, available, optimizeRoute, priorityOf, reorderPlan } from "./engine";
import type {
  ActivityEntry,
  AppNotification,
  DecisionLog,
  Order,
  Role,
  WarehouseException,
  WarehouseState,
} from "./types";

let uid = 0;
const nid = (p: string) => `${p}-${Date.now().toString(36)}-${uid++}`;

interface Ctx {
  state: WarehouseState;
  setRole: (r: Role) => void;
  applyStockRecommendation: (exceptionId: string, strategy?: string) => void;
  applyAllocation: (sku: string) => void;
  advanceOrder: (orderId: string, to: Order["status"]) => void;
  markItem: (orderId: string, sku: string, result: "picked" | "missing" | "damaged") => void;
  runQC: (orderId: string, pass: boolean) => void;
  dispatchOrder: (orderId: string) => void;
  triggerReorder: (sku: string) => void;
  resolveException: (id: string, note?: string) => void;
  dismissException: (id: string) => void;
  optimizeOrderRoute: (orderId: string) => void;
  applyBottleneck: (id: string, area: string, recommendation: string) => void;
  markNotificationsRead: () => void;
  resetDemo: () => void;
}

const WarehouseContext = createContext<Ctx | null>(null);

export function WarehouseProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<WarehouseState>(() => initialState());

  const log = (
    s: WarehouseState,
    text: string,
    kind: ActivityEntry["kind"] = "info",
  ): ActivityEntry[] => [{ id: nid("ACT"), at: Date.now(), text, kind }, ...s.activity].slice(0, 60);

  const notify = (
    s: WarehouseState,
    n: Omit<AppNotification, "id" | "at" | "read">,
  ): AppNotification[] => [{ ...n, id: nid("N"), at: Date.now(), read: false }, ...s.notifications].slice(0, 40);

  const decision = (s: WarehouseState, d: Omit<DecisionLog, "id" | "at">): DecisionLog[] => [
    { ...d, id: nid("DEC"), at: Date.now() },
    ...s.decisions,
  ];

  const setRole = useCallback((role: Role) => {
    setState((s) => ({ ...s, role }));
    toast.success(`Role switched to ${role}`);
  }, []);

  const allocateFor = (s: WarehouseState, sku: string) => {
    const plan = allocationPlan(sku, s);
    const products = s.products.map((p) =>
      p.sku === sku ? { ...p, reserved: p.reserved + plan.lines.reduce((a, l) => a + l.allocated, 0) } : p,
    );
    const shortageTotal = plan.lines.reduce((a, l) => a + l.shortage, 0);
    const orders = s.orders.map((o) => {
      const line = plan.lines.find((l) => l.orderId === o.id);
      if (!line) return o;
      const items = o.items.map((it) =>
        it.sku === sku ? { ...it, allocated: it.allocated + line.allocated } : it,
      );
      const fully = items.every((it) => it.allocated >= it.qty);
      const status: Order["status"] = line.allocated > 0 ? (fully ? "allocated" : "picking") : "awaiting-stock";
      return {
        ...o,
        items,
        status,
        timeline: [
          ...o.timeline,
          {
            at: Date.now(),
            label: line.allocated > 0 ? `Allocated ${line.allocated} × ${sku}` : `Held — awaiting stock (${sku})`,
            detail: line.action,
            actor: "WAREMIND Engine",
            kind: (line.allocated > 0 ? "resolution" : "info") as const,
          },
        ],
      };
    });
    const allocations = [
      ...plan.lines.map((l) => ({
        id: nid("ALLOC"),
        at: Date.now(),
        sku,
        orderId: l.orderId,
        requested: l.requested,
        allocated: l.allocated,
        shortage: l.shortage,
        reason: l.action,
      })),
      ...s.allocations,
    ];
    const replenishments = shortageTotal
      ? [
          {
            id: nid("REP"),
            sku,
            qty: Math.max(shortageTotal, reorderPlan(s.products.find((p) => p.sku === sku)!).qty),
            at: Date.now(),
            status: "requested" as const,
            reason: `Backorder of ${shortageTotal} units created during allocation.`,
          },
          ...s.replenishments,
        ]
      : s.replenishments;
    return { products, orders, allocations, replenishments, plan, shortageTotal };
  };

  const applyAllocation = useCallback((sku: string) => {
    setState((s) => {
      const r = allocateFor(s, sku);
      const summary = r.plan.lines
        .map((l) => `${l.orderId}: ${l.allocated}/${l.requested}`)
        .join(" · ");
      return {
        ...s,
        products: r.products,
        orders: r.orders,
        allocations: r.allocations,
        replenishments: r.replenishments,
        activity: log(s, `AI allocated ${sku} across ${r.plan.lines.length} orders (${summary}).`, "decision"),
        decisions: decision(s, {
          actor: "WAREMIND Engine",
          title: `Smart allocation applied for ${sku}`,
          detail: summary,
          outcome: r.shortageTotal
            ? `${r.shortageTotal} units backordered, replenishment triggered.`
            : "All demand covered.",
          relatedSku: sku,
        }),
      };
    });
    toast.success(`Allocation applied for ${sku}`, { description: "Inventory, orders and metrics updated." });
  }, []);

  const applyStockRecommendation = useCallback((exceptionId: string, strategy?: string) => {
    setState((s) => {
      const exc = s.exceptions.find((e) => e.id === exceptionId);
      if (!exc?.sku) return s;
      const r = allocateFor(s, exc.sku);
      const line = r.plan.lines[0];
      const exceptions = s.exceptions.map((e) =>
        e.id === exceptionId
          ? {
              ...e,
              status: "resolved" as const,
              resolvedAt: Date.now(),
              timeline: [
                ...e.timeline,
                {
                  at: Date.now(),
                  label: `DECISION: ${strategy ?? e.recommendation}`,
                  actor: "Warehouse Manager",
                  kind: "decision" as const,
                },
                {
                  at: Date.now() + 1,
                  label: "RESOLUTION: Allocation executed",
                  detail: r.plan.lines.map((l) => `${l.orderId} → ${l.allocated}`).join(" · "),
                  actor: "WAREMIND Engine",
                  kind: "resolution" as const,
                },
                {
                  at: Date.now() + 2,
                  label: "STATUS: Exception resolved",
                  actor: "System",
                  kind: "success" as const,
                },
              ],
            }
          : e,
      );
      return {
        ...s,
        products: r.products,
        orders: r.orders,
        allocations: r.allocations,
        replenishments: r.replenishments,
        exceptions,
        activity: log(
          s,
          `AI allocated ${line?.allocated ?? 0} units of ${exc.sku} to Order ${line?.orderId ?? ""}; replenishment triggered.`,
          "decision",
        ),
        notifications: notify(s, {
          title: "Exception resolved",
          body: `${exc.title} — recommendation applied.`,
          severity: "success",
        }),
        decisions: decision(s, {
          actor: "Warehouse Manager",
          title: strategy ?? "Recommendation applied",
          detail: exc.recommendation,
          outcome: `${r.plan.lines.map((l) => `${l.orderId}: ${l.allocated}`).join(", ")} · ${r.shortageTotal} backordered.`,
          relatedSku: exc.sku,
          relatedOrder: exc.orderId,
        }),
      };
    });
    toast.success("Recommendation applied", {
      description: "Inventory allocated, replenishment triggered, exception resolved.",
    });
  }, []);

  const advanceOrder = useCallback((orderId: string, to: Order["status"]) => {
    setState((s) => ({
      ...s,
      orders: s.orders.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status: to,
              qc: to === "qc" ? "pending" : o.qc,
              timeline: [
                ...o.timeline,
                { at: Date.now(), label: `Moved to ${to}`, actor: "Operator", kind: "info" as const },
              ],
            }
          : o,
      ),
      activity: log(s, `Order ${orderId} moved to ${to}.`),
    }));
    toast.success(`Order ${orderId} → ${to}`);
  }, []);

  const markItem = useCallback((orderId: string, sku: string, result: "picked" | "missing" | "damaged") => {
    setState((s) => {
      let orders = s.orders.map((o) =>
        o.id === orderId
          ? {
              ...o,
              items: o.items.map((it) =>
                it.sku === sku
                  ? { ...it, status: result, picked: result === "picked" ? it.qty : it.picked }
                  : it,
              ),
              timeline: [
                ...o.timeline,
                {
                  at: Date.now(),
                  label: `Item ${sku} marked ${result}`,
                  actor: "Picker",
                  kind: (result === "picked" ? "info" : "exception") as const,
                },
              ],
            }
          : o,
      );
      const order = orders.find((o) => o.id === orderId)!;
      if (order.items.every((i) => i.status === "picked")) {
        orders = orders.map((o) => (o.id === orderId ? { ...o, status: "packing" as const } : o));
      }
      if (result === "picked") {
        return { ...s, orders, activity: log(s, `Picker marked ${sku} picked for order ${orderId}.`) };
      }
      const damaged = result === "damaged";
      const exc: WarehouseException = {
        id: nid("EXC"),
        kind: damaged ? "damaged-item" : "missing-item",
        title: `${damaged ? "Damaged" : "Missing"} item — ${sku} (Order ${orderId})`,
        severity: "warning",
        orderId,
        sku,
        problem: damaged
          ? `Picker reported physical damage on ${sku} while picking order ${orderId}.`
          : `${sku} could not be located at its assigned bin during picking of order ${orderId}.`,
        recommendation: damaged
          ? "Replace item from available stock and move the damaged unit to quarantine inventory."
          : "Reallocate replacement inventory from the same SKU and re-issue the pick task.",
        reason: damaged
          ? "Damaged goods cannot pass quality check; replacement keeps the order inside its dispatch window."
          : "Inventory record shows units on hand — a bin-level variance is the most probable cause.",
        alternatives: [
          { label: "Replace from available stock", impact: "Order stays on time, available stock −1 unit." },
          { label: "Partial ship now", impact: "On-time dispatch at reduced fill rate." },
          { label: "Hold for cycle count", impact: "Accuracy restored, order delayed ~40 min." },
        ],
        status: "action-recommended",
        createdAt: Date.now(),
        timeline: [
          {
            at: Date.now(),
            label: `EXCEPTION: ${damaged ? "Damaged" : "Missing"} item reported`,
            actor: "Picker",
            kind: "exception",
          },
        ],
      };
      const products = damaged
        ? s.products.map((p) => (p.sku === sku ? { ...p, stock: Math.max(0, p.stock - 1), quarantined: p.quarantined + 1 } : p))
        : s.products;
      return {
        ...s,
        orders,
        products,
        exceptions: [exc, ...s.exceptions],
        activity: log(s, `Picker reported ${result} item ${sku} on order ${orderId}.`, "exception"),
        notifications: notify(s, {
          title: damaged ? "Damaged item" : "Missing item",
          body: `${sku} on order ${orderId} — recommendation ready.`,
          severity: "warning",
        }),
      };
    });
    toast[result === "picked" ? "success" : "warning"](
      result === "picked" ? `${sku} picked` : `${sku} reported ${result} — exception created`,
    );
  }, []);

  const runQC = useCallback((orderId: string, pass: boolean) => {
    setState((s) => {
      const orders = s.orders.map((o) =>
        o.id === orderId
          ? {
              ...o,
              qc: (pass ? "pass" : "fail") as "pass" | "fail",
              status: (pass ? "ready-dispatch" : "packing") as Order["status"],
              timeline: [
                ...o.timeline,
                {
                  at: Date.now(),
                  label: pass ? "Quality check passed" : "Quality check failed",
                  actor: "QC Station",
                  kind: (pass ? "success" : "exception") as const,
                },
              ],
            }
          : o,
      );
      if (pass) {
        return { ...s, orders, activity: log(s, `Order ${orderId} passed QC and is ready for dispatch.`, "success") };
      }
      const exc: WarehouseException = {
        id: nid("EXC"),
        kind: "qc-failure",
        title: `Quality check failed — Order ${orderId}`,
        severity: "critical",
        orderId,
        problem: "Damaged item detected during final quality inspection.",
        recommendation: "Replace damaged item from available stock and repeat quality check.",
        reason: "Shipping a damaged unit would trigger a return and an SLA penalty for this customer.",
        alternatives: [
          { label: "Replace and re-inspect", impact: "Dispatch delayed ~25 min, zero return risk." },
          { label: "Ship partial", impact: "On-time dispatch, 1 line item backordered." },
        ],
        status: "action-recommended",
        createdAt: Date.now(),
        timeline: [{ at: Date.now(), label: "EXCEPTION: QC failure", actor: "QC Station", kind: "exception" }],
      };
      return {
        ...s,
        orders,
        exceptions: [exc, ...s.exceptions],
        activity: log(s, `Order ${orderId} failed QC — exception created.`, "exception"),
        notifications: notify(s, {
          title: "QC failure",
          body: `Order ${orderId} failed quality check.`,
          severity: "critical",
        }),
      };
    });
    toast[pass ? "success" : "error"](pass ? `Order ${orderId} passed QC` : `Order ${orderId} failed QC`);
  }, []);

  const dispatchOrder = useCallback((orderId: string) => {
    setState((s) => {
      const order = s.orders.find((o) => o.id === orderId);
      if (!order) return s;
      const products = s.products.map((p) => {
        const item = order.items.find((i) => i.sku === p.sku);
        if (!item) return p;
        return {
          ...p,
          stock: Math.max(0, p.stock - item.qty),
          reserved: Math.max(0, p.reserved - item.allocated),
        };
      });
      return {
        ...s,
        products,
        orders: s.orders.map((o) =>
          o.id === orderId
            ? {
                ...o,
                status: "dispatched" as const,
                dispatchedAt: Date.now(),
                timeline: [
                  ...o.timeline,
                  { at: Date.now(), label: "Dispatched", actor: "Dispatch Operator", kind: "success" as const },
                ],
              }
            : o,
        ),
        activity: log(s, `Order ${orderId} dispatched to ${order.customer}.`, "success"),
        notifications: notify(s, {
          title: "Order dispatched",
          body: `${orderId} left the dock for ${order.customer}.`,
          severity: "success",
        }),
      };
    });
    toast.success(`Order ${orderId} dispatched`, { description: "Inventory and fulfillment metrics updated." });
  }, []);

  const triggerReorder = useCallback((sku: string) => {
    setState((s) => {
      const p = s.products.find((x) => x.sku === sku)!;
      const plan = reorderPlan(p);
      const qty = Math.max(plan.qty, 10);
      return {
        ...s,
        products: s.products.map((x) => (x.sku === sku ? { ...x, incoming: x.incoming + qty } : x)),
        replenishments: [
          { id: nid("REP"), sku, qty, at: Date.now(), status: "requested" as const, reason: plan.reason },
          ...s.replenishments,
        ],
        activity: log(s, `Replenishment requested for ${sku} (${qty} units).`, "decision"),
        decisions: decision(s, {
          actor: "Warehouse Manager",
          title: `Reorder triggered for ${sku}`,
          detail: plan.reason,
          outcome: `${qty} units ordered · lead time ${p.leadTimeDays} days.`,
          relatedSku: sku,
        }),
      };
    });
    toast.success(`Replenishment requested for ${sku}`);
  }, []);

  const resolveException = useCallback((id: string, note?: string) => {
    setState((s) => {
      const exc = s.exceptions.find((e) => e.id === id);
      let products = s.products;
      if (exc?.kind === "damaged-item" && exc.sku) {
        products = products.map((p) => (p.sku === exc.sku ? { ...p, reserved: Math.max(0, p.reserved) } : p));
      }
      return {
        ...s,
        products,
        exceptions: s.exceptions.map((e) =>
          e.id === id
            ? {
                ...e,
                status: "resolved" as const,
                resolvedAt: Date.now(),
                timeline: [
                  ...e.timeline,
                  {
                    at: Date.now(),
                    label: `DECISION: ${note ?? e.recommendation}`,
                    actor: "Warehouse Manager",
                    kind: "decision" as const,
                  },
                  { at: Date.now() + 1, label: "STATUS: Exception resolved", actor: "System", kind: "success" as const },
                ],
              }
            : e,
        ),
        activity: log(s, `Exception ${id} resolved — ${note ?? exc?.recommendation ?? ""}`, "decision"),
        decisions: exc
          ? decision(s, {
              actor: "Warehouse Manager",
              title: `Resolved: ${exc.title}`,
              detail: note ?? exc.recommendation,
              outcome: "Exception closed and warehouse state updated.",
              relatedOrder: exc.orderId,
              relatedSku: exc.sku,
            })
          : s.decisions,
      };
    });
    toast.success("Exception resolved");
  }, []);

  const dismissException = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      exceptions: s.exceptions.filter((e) => e.id !== id),
      activity: log(s, `Exception ${id} dismissed by manager.`),
    }));
    toast("Exception dismissed");
  }, []);

  const optimizeOrderRoute = useCallback((orderId: string) => {
    setState((s) => ({
      ...s,
      routeOptimized: { ...s.routeOptimized, [orderId]: true },
      activity: log(s, `Optimized picking route generated for order ${orderId}.`, "decision"),
    }));
    toast.success("Route optimized", { description: "Travel distance reduced with nearest-bin sequencing." });
  }, []);

  const applyBottleneck = useCallback((id: string, area: string, recommendation: string) => {
    setState((s) => ({
      ...s,
      extraPickerZoneC: id === "BN-ZONEC" ? true : s.extraPickerZoneC,
      pickers:
        id === "BN-ZONEC"
          ? [...s.pickers, { id: `P-0${s.pickers.length + 1}`, name: "Aisha Rahman", zone: "C" as const, load: 0 }]
          : s.pickers,
      activity: log(s, `Bottleneck action applied — ${area}: ${recommendation}`, "decision"),
      decisions: decision(s, {
        actor: "Warehouse Manager",
        title: `Bottleneck action — ${area}`,
        detail: recommendation,
        outcome: "Capacity rebalanced; queue projected to clear within the hour.",
      }),
    }));
    toast.success("Recommendation applied", { description: recommendation });
  }, []);

  const markNotificationsRead = useCallback(() => {
    setState((s) => ({ ...s, notifications: s.notifications.map((n) => ({ ...n, read: true })) }));
  }, []);

  const resetDemo = useCallback(() => {
    setState(initialState());
    toast.success("Demo scenario reset");
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      state,
      setRole,
      applyStockRecommendation,
      applyAllocation,
      advanceOrder,
      markItem,
      runQC,
      dispatchOrder,
      triggerReorder,
      resolveException,
      dismissException,
      optimizeOrderRoute,
      applyBottleneck,
      markNotificationsRead,
      resetDemo,
    }),
    [
      state,
      setRole,
      applyStockRecommendation,
      applyAllocation,
      advanceOrder,
      markItem,
      runQC,
      dispatchOrder,
      triggerReorder,
      resolveException,
      dismissException,
      optimizeOrderRoute,
      applyBottleneck,
      markNotificationsRead,
      resetDemo,
    ],
  );

  return <WarehouseContext.Provider value={value}>{children}</WarehouseContext.Provider>;
}

export function useWarehouse() {
  const ctx = useContext(WarehouseContext);
  if (!ctx) throw new Error("useWarehouse must be used inside WarehouseProvider");
  return ctx;
}

export { available, optimizeRoute, priorityOf };