import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { PageHeader, SectionCard, StatusBadge } from "@/components/waremind/primitives";
import { useWarehouse } from "@/lib/waremind/store";
import { detectBottlenecks } from "@/lib/waremind/engine";
import type { Role } from "@/lib/waremind/types";

export const Route = createFileRoute("/users")({
  head: () => ({
    meta: [
      { title: "Users & Work — Smart Warehouse Operations" },
      {
        name: "description",
        content: "Role-based work centre: who is doing what, current workload, zone coverage and reassignment advice.",
      },
      { property: "og:title", content: "Users & Work — Smart Warehouse Operations" },
      { property: "og:description", content: "Live workload balancing across pickers, packers, QC and dispatch." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: UsersPage,
});

const ROLE_LABEL: Record<Role, string> = {
  manager: "Warehouse Manager",
  inventory: "Inventory Manager",
  picker: "Picker",
  packer: "Packer",
  qc: "Quality Check",
  dispatch: "Dispatch Operator",
};

function loadTone(pct: number) {
  if (pct >= 85) return "bg-critical";
  if (pct >= 60) return "bg-warning";
  return "bg-success";
}

function UsersPage() {
  const { state, applyBottleneck } = useWarehouse();
  const bottlenecks = detectBottlenecks(state);
  const activeExceptions = state.exceptions.filter((e) => e.status !== "resolved");

  const picking = state.orders.filter((o) => o.status === "picking" || o.status === "allocated");
  const packing = state.orders.filter((o) => o.status === "packing");
  const qc = state.orders.filter((o) => o.status === "qc");
  const dispatch = state.orders.filter((o) => o.status === "ready-dispatch");

  const staff: {
    id: string;
    name: string;
    role: Role;
    zone: string;
    task: string;
    workload: number;
    status: string;
    performance: string;
    exceptions: number;
  }[] = [
    ...state.pickers.map((p, i) => {
      const zoneOrders = picking.filter((o) =>
        o.items.some((it) => state.products.find((x) => x.sku === it.sku)?.zone === p.zone),
      );
      return {
        id: p.id,
        name: p.name,
        role: "picker" as Role,
        zone: `Zone ${p.zone}`,
        task: zoneOrders[0] ? `Picking ${zoneOrders[0].id}` : "Awaiting task",
        workload: Math.min(100, 25 + zoneOrders.length * 22 + p.load * 5),
        status: zoneOrders.length ? "Active" : "Idle",
        performance: `${94 - i * 3}% on-time`,
        exceptions: activeExceptions.filter((e) => e.kind === "missing-item" || e.kind === "damaged-item").length && i === 0 ? 1 : 0,
      };
    }),
    {
      id: "PK-01",
      name: "Daniel Okafor",
      role: "packer",
      zone: "Packing bench 1",
      task: packing[0] ? `Packing ${packing[0].id}` : "Awaiting orders",
      workload: Math.min(100, 30 + packing.length * 20),
      status: packing.length ? "Active" : "Idle",
      performance: "91% on-time",
      exceptions: 0,
    },
    {
      id: "QC-01",
      name: "Meera Iyer",
      role: "qc",
      zone: "QC lane",
      task: qc[0] ? `Inspecting ${qc[0].id}` : "Queue clear",
      workload: Math.min(100, 20 + qc.length * 25),
      status: qc.length ? "Active" : "Idle",
      performance: "98% accuracy",
      exceptions: activeExceptions.filter((e) => e.kind === "qc-failure").length,
    },
    {
      id: "DS-01",
      name: "Tomas Berg",
      role: "dispatch",
      zone: "Dispatch dock",
      task: dispatch[0] ? `Loading ${dispatch[0].id}` : "Dock ready",
      workload: Math.min(100, 20 + dispatch.length * 18),
      status: dispatch.length ? "Active" : "Idle",
      performance: "96% SLA",
      exceptions: activeExceptions.filter((e) => e.kind === "deadline-risk").length,
    },
    {
      id: "IM-01",
      name: "Sofia Marchetti",
      role: "inventory",
      zone: "All zones",
      task: "Reviewing replenishment proposals",
      workload: 48,
      status: "Active",
      performance: "99% stock accuracy",
      exceptions: activeExceptions.filter((e) => e.kind === "stock-shortage").length,
    },
  ];

  const overloaded = staff.filter((s) => s.workload >= 85);

  return (
    <div className="mx-auto max-w-[1300px]">
      <PageHeader title="Users & Work" subtitle="Role-based work centre with live workload balancing" />

      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <SectionCard title="Team" description="Current task, zone, workload, status, performance and assigned exceptions">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-xs">
              <thead className="text-muted-foreground">
                <tr>
                  <th className="pb-2 font-medium">User</th>
                  <th className="pb-2 font-medium">Role</th>
                  <th className="pb-2 font-medium">Zone</th>
                  <th className="pb-2 font-medium">Current task</th>
                  <th className="pb-2 font-medium">Workload</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium">Performance</th>
                  <th className="pb-2 font-medium">Exceptions</th>
                </tr>
              </thead>
              <tbody>
                {staff.map((s) => (
                  <tr key={s.id} className="border-t border-border/50">
                    <td className="py-2.5">
                      <p className="font-medium">{s.name}</p>
                      <p className="font-mono text-[10px] text-muted-foreground">{s.id}</p>
                    </td>
                    <td className="py-2.5 text-muted-foreground">{ROLE_LABEL[s.role]}</td>
                    <td className="py-2.5 text-muted-foreground">{s.zone}</td>
                    <td className="py-2.5">{s.task}</td>
                    <td className="py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-20 overflow-hidden rounded-full bg-secondary">
                          <div className={`h-full rounded-full ${loadTone(s.workload)}`} style={{ width: `${s.workload}%` }} />
                        </div>
                        <span className="tabular-nums text-[11px] text-muted-foreground">{s.workload}%</span>
                      </div>
                    </td>
                    <td className="py-2.5">
                      <StatusBadge status={s.status === "Active" ? "healthy" : "created"} label={s.status} />
                    </td>
                    <td className="py-2.5 text-muted-foreground">{s.performance}</td>
                    <td className="py-2.5">
                      {s.exceptions ? (
                        <span className="rounded-full bg-critical/15 px-2 py-0.5 font-semibold text-critical">{s.exceptions}</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>

        <div className="space-y-4">
          <SectionCard title="Workload balancing" description="Detected overload and recommended reassignment">
            {overloaded.length || bottlenecks.length ? (
              <div className="space-y-3">
                {overloaded.map((s) => (
                  <div key={s.id} className="rounded-xl border border-warning/40 bg-warning/8 p-3 text-xs">
                    <p className="font-semibold text-warning">{s.name} is overloaded ({s.workload}%)</p>
                    <p className="mt-1 text-muted-foreground">
                      Recommendation: move the lowest-priority task in {s.zone} to an idle operator.
                    </p>
                  </div>
                ))}
                {bottlenecks.map((b) => (
                  <div key={b.id} className="rounded-xl border border-border/70 bg-background/30 p-3 text-xs">
                    <p className="font-semibold">{b.area}</p>
                    <p className="mt-1 text-muted-foreground">{b.detail}</p>
                    <p className="mt-1.5 text-primary">{b.recommendation}</p>
                    <Button
                      size="sm"
                      className="mt-2"
                      onClick={() => applyBottleneck(b.id, b.area, b.recommendation)}
                    >
                      Apply reassignment
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Workload is balanced across every zone and station.</p>
            )}
          </SectionCard>

          <SectionCard title="Role coverage" description="What each role sees first">
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li><span className="font-medium text-foreground">Warehouse Manager</span> — command center, allocation, exceptions, analytics</li>
              <li><span className="font-medium text-foreground">Inventory Manager</span> — inventory, adjustments, reorder proposals</li>
              <li><span className="font-medium text-foreground">Picker</span> — picking tasks, optimized route, item exceptions</li>
              <li><span className="font-medium text-foreground">Packer</span> — packing queue and quantity verification</li>
              <li><span className="font-medium text-foreground">Quality Check</span> — QC queue, approve / reject / damage</li>
              <li><span className="font-medium text-foreground">Dispatch Operator</span> — ready queue, SLA monitoring, dispatch</li>
            </ul>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}