import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { PageHeader, SectionCard } from "@/components/waremind/primitives";
import { useWarehouse } from "@/lib/waremind/store";
import type { Role } from "@/lib/waremind/types";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings & Roles — WAREMIND" },
      { name: "description", content: "Switch operational role and reset the demo warehouse scenario." },
      { property: "og:title", content: "Settings & Roles — WAREMIND" },
      { property: "og:description", content: "Role-based warehouse experience configuration." },
    ],
  }),
  component: SettingsPage,
});

const ROLES: { id: Role; label: string; access: string }[] = [
  { id: "manager", label: "Warehouse Manager", access: "Full access to every module and decision control." },
  { id: "picker", label: "Picker", access: "Picking tasks, route optimization and item exceptions." },
  { id: "packer", label: "Packer", access: "Packing queue and quality check." },
  { id: "dispatch", label: "Dispatch Operator", access: "Dispatch queue and shipment tracking." },
];

function SettingsPage() {
  const { state, setRole, resetDemo } = useWarehouse();
  return (
    <div className="mx-auto max-w-[900px]">
      <PageHeader title="Settings" subtitle="Role-based experience and demo controls" actions={<Button size="sm" variant="outline" onClick={resetDemo}>Reset demo scenario</Button>} />
      <SectionCard title="Role selection">
        <div className="grid gap-3 sm:grid-cols-2">
          {ROLES.map((r) => (
            <button
              key={r.id}
              onClick={() => setRole(r.id)}
              className={`rounded-xl border p-4 text-left transition-colors ${state.role === r.id ? "border-primary bg-primary/10" : "border-border hover:border-primary/40"}`}
            >
              <p className="font-display text-sm font-semibold">{r.label}</p>
              <p className="mt-1 text-xs text-muted-foreground">{r.access}</p>
            </button>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}