import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Package,
  ClipboardCheck,
  Tags,
  CheckCircle2,
  BarChart3,
  Share2,
  Settings2,
  LogOut,
  Store,
  Grid3X3,
  ShoppingCart,
  Box,
  ChevronDown,
  ChevronRight,
  X,
  LayoutList,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useListUnits } from "@workspace/api-client-react";
import { useAuth } from "@/context/auth";
import { useToast } from "@/hooks/use-toast";

// ─── Route groups ──────────────────────────────────────────────────────────────
const MANAJEMEN_PATHS = ["/beli", "/spareparts", "/qc", "/jual", "/terjual"] as const;
const PROFIL_PATHS = ["/sosmed", "/settings"] as const;

const MANAJEMEN_ITEMS = [
  { href: "/daftar", label: "Daftar Unit", icon: LayoutList },
  { href: "/beli", label: "Beli Unit", icon: ShoppingCart },
  { href: "/spareparts", label: "Spareparts", icon: Box },
  { href: "/qc", label: "Quality Control", icon: ClipboardCheck, badgeKey: "qc" },
  { href: "/jual", label: "Jual", icon: Tags },
  { href: "/terjual", label: "Terjual", icon: CheckCircle2 },
] as const;

const PROFIL_ITEMS = [
  { href: "/sosmed", label: "Copywriting Sosmed", icon: Share2 },
  { href: "/settings", label: "Pengaturan Toko", icon: Settings2 },
] as const;

// ─── Shell ─────────────────────────────────────────────────────────────────────
export function Shell({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { data: units } = useListUnits({ status: "PROSES" });
  const { logout } = useAuth();
  const { toast } = useToast();

  const qcCount = units?.length ?? 0;

  // Mobile: which slide-up panel is open
  const [mobilePanel, setMobilePanel] = useState<"manajemen" | "profil" | null>(null);

  // Desktop: which accordion groups are expanded
  const [openGroups, setOpenGroups] = useState<Set<string>>(() => {
    const s = new Set<string>();
    if ((MANAJEMEN_PATHS as readonly string[]).includes(location)) s.add("manajemen");
    if ((PROFIL_PATHS as readonly string[]).includes(location)) s.add("profil");
    return s;
  });

  // Auto-expand relevant sidebar group on navigation; close mobile panel
  useEffect(() => {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if ((MANAJEMEN_PATHS as readonly string[]).includes(location)) next.add("manajemen");
      if ((PROFIL_PATHS as readonly string[]).includes(location)) next.add("profil");
      return next;
    });
    setMobilePanel(null);
  }, [location]);

  const toggleGroup = (id: string) =>
    setOpenGroups((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const isManajemenActive = (MANAJEMEN_PATHS as readonly string[]).includes(location);
  const isProfilActive = (PROFIL_PATHS as readonly string[]).includes(location);
  const getBadge = (key?: string) => (key === "qc" ? qcCount : 0);

  const handleLainnya = () => {
    setMobilePanel(null);
    toast({ title: "Segera Hadir ✨", description: "Fitur tambahan sedang dalam pengembangan." });
  };

  return (
    <div className="min-h-[100dvh] flex flex-col md:flex-row bg-background">

      {/* ── Desktop Sidebar ──────────────────────────────────────────────── */}
      <aside className="hidden md:flex w-64 flex-col fixed inset-y-0 border-r border-border bg-card z-20">

        {/* Logo */}
        <div className="px-5 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-black text-sm shrink-0 shadow-lg shadow-primary/30">
              IDT
            </div>
            <div>
              <div className="font-black text-sm text-foreground leading-tight tracking-tight">
                INDO DUTA TECH
              </div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">
                Premium Reseller
              </div>
            </div>
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">

          <SidebarLink href="/" label="Dashboard" icon={LayoutDashboard} active={location === "/"} />

          <SidebarGroup
            label="Manajemen"
            icon={Package}
            active={isManajemenActive}
            open={openGroups.has("manajemen")}
            onToggle={() => toggleGroup("manajemen")}
          >
            {MANAJEMEN_ITEMS.map((item) => (
              <SidebarSubLink
                key={item.href}
                href={item.href}
                label={item.label}
                icon={item.icon}
                active={location === item.href}
                badge={getBadge("badgeKey" in item ? item.badgeKey : undefined)}
              />
            ))}
          </SidebarGroup>

          <SidebarLink href="/laporan" label="Laporan" icon={BarChart3} active={location === "/laporan"} />

          <SidebarGroup
            label="Profil Toko"
            icon={Store}
            active={isProfilActive}
            open={openGroups.has("profil")}
            onToggle={() => toggleGroup("profil")}
          >
            {PROFIL_ITEMS.map((item) => (
              <SidebarSubLink
                key={item.href}
                href={item.href}
                label={item.label}
                icon={item.icon}
                active={location === item.href}
              />
            ))}
          </SidebarGroup>

          <button
            onClick={handleLainnya}
            className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors group"
          >
            <Grid3X3 className="w-5 h-5 shrink-0" />
            <span className="text-sm">Menu Lainnya</span>
          </button>
        </nav>

        {/* Logout */}
        <div className="px-3 pb-5 pt-2 border-t border-border">
          <button
            onClick={() => void logout()}
            className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors group"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            <span className="text-sm">Keluar</span>
          </button>
        </div>
      </aside>

      {/* ── Main Content ─────────────────────────────────────────────────── */}
      <main className="flex-1 md:ml-64 pb-[72px] md:pb-0 min-h-[100dvh]">
        {children}
      </main>

      {/* ── Mobile Bottom Nav ─────────────────────────────────────────────── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-md border-t border-border z-30"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="flex h-[58px]">
          <MobileNavItem
            href="/"
            label="Dashboard"
            icon={LayoutDashboard}
            active={location === "/" && mobilePanel === null}
            onClick={() => setMobilePanel(null)}
          />
          <MobileNavItem
            label="Manajemen"
            icon={Package}
            active={isManajemenActive || mobilePanel === "manajemen"}
            panelOpen={mobilePanel === "manajemen"}
            onClick={() => setMobilePanel((p) => (p === "manajemen" ? null : "manajemen"))}
            badge={qcCount}
          />
          <MobileNavItem
            href="/laporan"
            label="Laporan"
            icon={BarChart3}
            active={location === "/laporan" && mobilePanel === null}
            onClick={() => setMobilePanel(null)}
          />
          <MobileNavItem
            label="Profil Toko"
            icon={Store}
            active={isProfilActive || mobilePanel === "profil"}
            panelOpen={mobilePanel === "profil"}
            onClick={() => setMobilePanel((p) => (p === "profil" ? null : "profil"))}
          />
          <MobileNavItem
            label="Lainnya"
            icon={Grid3X3}
            active={false}
            onClick={handleLainnya}
          />
        </div>
      </nav>

      {/* ── Mobile Slide-Up Panel ─────────────────────────────────────────── */}
      {mobilePanel && (
        <>
          {/* Scrim */}
          <div
            className="md:hidden fixed inset-0 bg-background/60 backdrop-blur-sm z-40"
            onClick={() => setMobilePanel(null)}
          />
          {/* Sheet */}
          <div className="md:hidden fixed bottom-[58px] left-0 right-0 z-50 rounded-t-2xl bg-card border-t border-border shadow-2xl shadow-black/40 animate-in slide-in-from-bottom-3 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
              <div className="flex items-center gap-2.5">
                {mobilePanel === "manajemen" ? (
                  <Package className="w-5 h-5 text-primary" />
                ) : (
                  <Store className="w-5 h-5 text-primary" />
                )}
                <span className="font-bold text-base">
                  {mobilePanel === "manajemen" ? "Manajemen" : "Profil Toko"}
                </span>
              </div>
              <button
                onClick={() => setMobilePanel(null)}
                className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Items */}
            <div className="p-3 pb-4 space-y-1">
              {(mobilePanel === "manajemen" ? MANAJEMEN_ITEMS : PROFIL_ITEMS).map((item) => {
                const itemBadge = "badgeKey" in item ? getBadge(item.badgeKey) : 0;
                const isActive = location === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3.5 px-4 py-3.5 rounded-xl transition-all",
                      isActive
                        ? "bg-primary/10 text-primary font-semibold"
                        : "text-foreground hover:bg-secondary/70"
                    )}
                  >
                    <item.icon
                      className={cn(
                        "w-5 h-5 shrink-0",
                        isActive ? "text-primary" : "text-muted-foreground"
                      )}
                    />
                    <span className="flex-1 text-sm">{item.label}</span>
                    {itemBadge > 0 && (
                      <span className="bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full min-w-[22px] text-center">
                        {itemBadge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Sidebar helpers ───────────────────────────────────────────────────────────

function SidebarLink({
  href, label, icon: Icon, active,
}: {
  href: string; label: string; icon: React.ElementType; active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group",
        active
          ? "bg-primary/10 text-primary font-semibold"
          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
      )}
    >
      <Icon className={cn("w-5 h-5 shrink-0", active ? "text-primary" : "group-hover:text-foreground")} />
      <span className="text-sm">{label}</span>
    </Link>
  );
}

function SidebarGroup({
  label, icon: Icon, active, open, onToggle, children,
}: {
  label: string; icon: React.ElementType; active: boolean; open: boolean;
  onToggle: () => void; children: React.ReactNode;
}) {
  return (
    <div>
      <button
        onClick={onToggle}
        className={cn(
          "flex w-full items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group",
          active && !open
            ? "bg-primary/10 text-primary font-semibold"
            : "text-muted-foreground hover:bg-secondary hover:text-foreground"
        )}
      >
        <Icon className={cn("w-5 h-5 shrink-0", active && !open ? "text-primary" : "group-hover:text-foreground")} />
        <span className="text-sm flex-1 text-left">{label}</span>
        {open ? (
          <ChevronDown className="w-4 h-4 shrink-0 opacity-60" />
        ) : (
          <ChevronRight className="w-4 h-4 shrink-0 opacity-60" />
        )}
      </button>

      {/* Accordion body */}
      {open && (
        <div className="ml-5 pl-3.5 border-l border-border my-1 space-y-0.5">
          {children}
        </div>
      )}
    </div>
  );
}

function SidebarSubLink({
  href, label, icon: Icon, active, badge,
}: {
  href: string; label: string; icon: React.ElementType; active: boolean; badge?: number;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors text-sm group",
        active
          ? "bg-primary/10 text-primary font-semibold"
          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
      )}
    >
      <Icon className={cn("w-4 h-4 shrink-0", active ? "text-primary" : "group-hover:text-foreground")} />
      <span className="flex-1">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
          {badge}
        </span>
      )}
    </Link>
  );
}

// ─── Mobile nav item ───────────────────────────────────────────────────────────
function MobileNavItem({
  href, label, icon: Icon, active, panelOpen, onClick, badge,
}: {
  href?: string;
  label: string;
  icon: React.ElementType;
  active: boolean;
  panelOpen?: boolean;
  onClick: () => void;
  badge?: number;
}) {
  const inner = (
    <span
      className={cn(
        "flex flex-col items-center justify-center gap-[3px] w-full h-full relative transition-colors",
        active ? "text-primary" : "text-muted-foreground"
      )}
    >
      {/* Active indicator bar at top */}
      {active && (
        <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-[2px] bg-primary rounded-full" />
      )}
      <span className="relative">
        <Icon className="w-5 h-5" />
        {badge !== undefined && badge > 0 && (
          <span className="absolute -top-1.5 -right-2.5 bg-primary text-primary-foreground text-[9px] font-bold px-1 leading-[14px] rounded-full min-w-[15px] text-center shadow-[0_0_0_2px_hsl(var(--card))]">
            {badge}
          </span>
        )}
      </span>
      <span className="text-[9px] font-semibold tracking-wide leading-none">{label}</span>
      {/* Sub-menu indicator */}
      {panelOpen !== undefined && (
        <span className={cn("w-1 h-1 rounded-full transition-colors", panelOpen ? "bg-primary" : "bg-transparent")} />
      )}
    </span>
  );

  const cls = "flex-1 flex items-center justify-center";

  return href ? (
    <Link href={href} onClick={onClick} className={cls}>
      {inner}
    </Link>
  ) : (
    <button onClick={onClick} className={cls}>
      {inner}
    </button>
  );
}
