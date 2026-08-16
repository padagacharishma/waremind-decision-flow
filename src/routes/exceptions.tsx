import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ExceptionCard } from "@/components/waremind/ExceptionUI";
import { EmptyState, PageHeader } from "@/components/waremind/primitives";
import { useWarehouse } from "@/lib/waremind/store";

export const Route = createFileRoute("/exceptions")({
  head: () => ({
    meta: [
      { title: "Exceptions — WAREMIND" },
      { name: "description", content: "Detect, explain, decide and resolve every warehouse exception in one place." },
      { property: "og:title", content: "Exceptions — WAREMIND" },
      { property: "og:description", content: "Exception → Decision → Resolution, with a full audit timeline." },
    ],
  }),
  component: ExceptionsPage,
});

function ExceptionsPage() {
  const { state } = useWarehouse();
  const [tab, setTab] = useState<"active" | "resolved">("active");
  const list = state.exceptions.filter((e) => (tab === "active" ? e.status !== "resolved" : e.status === "resolved"));

  return (
    <div className="mx-auto max-w-[1100px]">
      <PageHeader
        title="Exceptions"
        subtitle="Exception → Decision → Resolution"
        actions={
          <>
            <Button size="sm" variant={tab === "active" ? "default" : "outline"} onClick={() => setTab("active")}>Active</Button>
            <Button size="sm" variant={tab === "resolved" ? "default" : "outline"} onClick={() => setTab("resolved")}>Resolved</Button>
          </>
        }
      />
      {list.length ? (
        <div className="space-y-4">{list.map((e) => <ExceptionCard key={e.id} exception={e} />)}</div>
      ) : (
        <EmptyState title={tab === "active" ? "No active exceptions" : "No resolved exceptions yet"} body="WAREMIND continuously monitors inventory, picking, QC and dispatch for new risks." />
      )}
    </div>
  );
}