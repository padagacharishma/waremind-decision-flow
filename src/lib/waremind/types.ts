export type Role = "manager" | "picker" | "packer" | "dispatch";

export type OrderStatus =
  | "created"
  | "prioritized"
  | "awaiting-stock"
  | "allocated"
  | "picking"
  | "packing"
  | "qc"
  | "ready-dispatch"
  | "dispatched"
  | "delayed";

export type PriorityLevel = "critical" | "high" | "medium" | "low";

export interface Product {
  sku: string;
  name: string;
  category: string;
  zone: "A" | "B" | "C";
  location: string;
  stock: number;
  reserved: number;
  dailyDemand: number;
  incoming: number;
  leadTimeDays: number;
  reorderThreshold: number;
  quarantined: number;
}

export interface OrderItem {
  sku: string;
  qty: number;
  allocated: number;
  picked: number;
  status: "pending" | "picked" | "missing" | "damaged";
}

export interface Order {
  id: string;
  customer: string;
  customerTier: "premium" | "standard" | "basic";
  urgency: "express" | "standard" | "economy";
  createdAt: number;
  deadline: number;
  items: OrderItem[];
  status: OrderStatus;
  picker?: string;
  packer?: string;
  qc?: "pending" | "pass" | "fail";
  dispatchedAt?: number;
  timeline: TimelineEntry[];
}

export interface TimelineEntry {
  at: number;
  label: string;
  detail?: string;
  actor: string;
  kind: "info" | "exception" | "decision" | "resolution" | "success";
}

export type ExceptionKind =
  | "stock-shortage"
  | "missing-item"
  | "damaged-item"
  | "qc-failure"
  | "bottleneck"
  | "deadline-risk";

export interface WarehouseException {
  id: string;
  kind: ExceptionKind;
  title: string;
  severity: "critical" | "warning" | "at-risk";
  orderId?: string;
  sku?: string;
  problem: string;
  recommendation: string;
  reason: string;
  alternatives: { label: string; impact: string }[];
  status: "reported" | "investigating" | "action-recommended" | "resolved";
  createdAt: number;
  resolvedAt?: number;
  timeline: TimelineEntry[];
}

export interface DecisionLog {
  id: string;
  at: number;
  actor: string;
  title: string;
  detail: string;
  outcome: string;
  relatedOrder?: string;
  relatedSku?: string;
}

export interface ActivityEntry {
  id: string;
  at: number;
  text: string;
  kind: "info" | "exception" | "decision" | "success";
}

export interface AppNotification {
  id: string;
  at: number;
  title: string;
  body: string;
  severity: "critical" | "warning" | "info" | "success";
  read: boolean;
}

export interface Replenishment {
  id: string;
  sku: string;
  qty: number;
  at: number;
  status: "requested" | "in-transit";
  reason: string;
}

export interface AllocationRecord {
  id: string;
  at: number;
  sku: string;
  orderId: string;
  requested: number;
  allocated: number;
  shortage: number;
  reason: string;
}

export interface WarehouseState {
  role: Role;
  products: Product[];
  orders: Order[];
  exceptions: WarehouseException[];
  decisions: DecisionLog[];
  activity: ActivityEntry[];
  notifications: AppNotification[];
  replenishments: Replenishment[];
  allocations: AllocationRecord[];
  pickers: { id: string; name: string; zone: "A" | "B" | "C"; load: number }[];
  routeOptimized: Record<string, boolean>;
  extraPickerZoneC: boolean;
}