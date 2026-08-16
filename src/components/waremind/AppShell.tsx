import { Link, useRouterState } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import {
  Activity,
  AlertTriangle,
  Bell,
  Bot,
  Boxes,
  ChevronLeft,
  ClipboardList,
  FlaskConical,
  Gauge,
  LayoutDashboard,
  Menu,
  PackageCheck,
  Route as RouteIcon,
  Settings,
  Split,
  Truck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useWarehouse } from "@/lib/waremind/store";
import type { Role } from "@/lib/waremind/types";
import { Logo, timeAgo } from "./primitives";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, roles: ["manager", "picker", "packer", "dispatch"] },
  { to: "/orders", label: "Orders", icon: ClipboardList, roles: ["manager", "dispatch"] },
  { to: "/inventory", label: "Inventory", icon: Boxes, roles: ["manager"] },
  { to: "/allocation", label: "Allocation", icon: Split, roles: ["manager"] },
  { to: "/picking", label: "Picking", icon: RouteIcon, roles: ["manager", "picker"] },
  { to: "/packing", label: "Packing", icon: PackageCheck, roles: ["manager", "packer"] },
  { to: "/dispatch", label: "Dispatch", icon: Truck, roles: ["manager", "dispatch"] },
  { to: "/exceptions", label: "Exceptions", icon: AlertTriangle, roles: ["manager", "picker", "packer", "dispatch"] },
  { to: "/analytics", label: "Analytics", icon: Gauge, roles: ["manager"] },
  { to: "/simulator", label: "What-If Simulator", icon: FlaskConical, roles: ["manager"] },
  { to: "/assistant", label: "AI Assistant", icon: Bot, roles: ["manager", "picker", "packer", "dispatch"] },
  { to: "/decisions", label: "Decision History", icon: Activity, roles: ["manager"] },
  { to: "/settings", label: "Settings", icon: Settings, roles: ["manager", "picker", "packer", "dispatch"] },
] as const;

const ROLE_LABEL: Record<Role, string> = {
  manager: "Warehouse Manager",
  picker: "Picker",
  packer: "Packer",
  dispatch: "Dispatch Operator",
};

function NavList({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const { state } = useWarehouse();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const items = NAV.filter((n) => (n.roles as readonly string[]).includes(state.role));
  return (
    <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto wm-scroll px-2">
      {items.map((item) => {
        const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
        const Icon = item.icon;
        const exceptions = item.to === "/exceptions" ? state.exceptions.filter((e) => e.status !== "resolved").length : 0;
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={cn(
              "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
            )}
            title={collapsed ? item.label : undefined}
          >
            {active && <span className="absolute left-0 h-5 w-[3px] rounded-r bg-primary" />}
            <Icon className={cn("size-4 shrink-0", active && "text-primary")} />
            {!collapsed && <span className="truncate">{item.label}</span>}
            {!collapsed && exceptions > 0 && (
              <span className="ml-auto rounded-full bg-critical/20 px-1.5 text-[10px] font-semibold text-critical">
                {exceptions}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

function NotificationBell() {
  const { state, markNotificationsRead } = useWarehouse();
  const unread = state.notifications.filter((n) => !n.read).length;
  return (
    <Popover onOpenChange={(o) => o && markNotificationsRead()}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="size-4" />
          {unread > 0 && (
            <span className="absolute right-1.5 top-1.5 grid size-4 place-items-center rounded-full bg-critical text-[9px] font-bold text-white">
              {unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(22rem,90vw)] p-0">
        <div className="border-b border-border px-4 py-2.5 text-sm font-semibold">Notification Center</div>
        <div className="max-h-80 overflow-y-auto wm-scroll">
          {state.notifications.map((n) => (
            <div key={n.id} className="border-b border-border/60 px-4 py-3 last:border-0">
              <div className="flex items-center justify-between gap-2">
                <span
                  className={cn(
                    "text-xs font-semibold",
                    n.severity === "critical" && "text-critical",
                    n.severity === "warning" && "text-warning",
                    n.severity === "success" && "text-success",
                    n.severity === "info" && "text-info",
                  )}
                >
                  {n.title}
                </span>
                <span className="text-[10px] text-muted-foreground">{timeAgo(n.at)}</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{n.body}</p>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function RoleSwitcher() {
  const { state, setRole } = useWarehouse();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <span className="grid size-5 place-items-center rounded-full bg-primary/20 text-[10px] font-bold text-primary">
            {ROLE_LABEL[state.role].slice(0, 1)}
          </span>
          <span className="hidden truncate sm:inline">{ROLE_LABEL[state.role]}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Switch role</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {(Object.keys(ROLE_LABEL) as Role[]).map((r) => (
          <DropdownMenuItem key={r} onClick={() => setRole(r)}>
            {ROLE_LABEL[r]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      <aside
        className={cn(
          "sticky top-0 hidden h-screen shrink-0 flex-col gap-4 border-r border-sidebar-border bg-sidebar py-4 transition-[width] duration-200 lg:flex",
          collapsed ? "w-[74px]" : "w-64",
        )}
      >
        <div className="flex items-center justify-between px-4">
          <Logo compact={collapsed} />
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={() => setCollapsed((c) => !c)}
            aria-label="Toggle sidebar"
          >
            <ChevronLeft className={cn("size-4 transition-transform", collapsed && "rotate-180")} />
          </Button>
        </div>
        <NavList collapsed={collapsed} />
        {!collapsed && (
          <div className="mx-3 rounded-xl border border-border/70 bg-background/40 p-3 text-[11px] text-muted-foreground">
            <p className="font-display font-semibold text-foreground">WAREMIND</p>
            <p className="mt-1">The decision engine for smarter warehouse operations.</p>
          </div>
        )}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-2 border-b border-border/70 bg-background/80 px-3 py-2.5 backdrop-blur-xl sm:px-6">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open navigation">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 bg-sidebar p-0 pt-4">
              <SheetTitle className="px-4">
                <Logo />
              </SheetTitle>
              <div className="mt-4 flex h-[calc(100%-5rem)] flex-col">
                <NavList collapsed={false} onNavigate={() => setMobileOpen(false)} />
              </div>
            </SheetContent>
          </Sheet>
          <div className="lg:hidden">
            <Logo compact />
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <span className="mr-1 hidden items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-2.5 py-1 text-[11px] font-medium text-success md:inline-flex">
              <span className="size-1.5 animate-pulse rounded-full bg-success" /> Live warehouse feed
            </span>
            <NotificationBell />
            <RoleSwitcher />
          </div>
        </header>
        <main className="min-w-0 flex-1 px-3 py-5 sm:px-6 sm:py-6">{children}</main>
      </div>
    </div>
  );
}