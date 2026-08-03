import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  PlusCircle, 
  ClipboardCheck, 
  Tags, 
  CheckCircle2, 
  PieChart, 
  Share2,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useListUnits } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useCallback } from "react";

const SIDEBAR_KEY = "idt_sidebar_open";

export function Shell({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { data: units } = useListUnits({ status: "PROSES" });
  const { user, invalidate } = useAuth();
  const queryClient = useQueryClient();

  // Sidebar collapsed state — persisted in localStorage
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(SIDEBAR_KEY);
      return stored === null ? true : stored === "true";
    } catch {
      return true;
    }
  });

  const toggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => {
      const next = !prev;
      try { localStorage.setItem(SIDEBAR_KEY, String(next)); } catch {}
      return next;
    });
  }, []);

  // Sync to localStorage whenever it changes
  useEffect(() => {
    try { localStorage.setItem(SIDEBAR_KEY, String(sidebarOpen)); } catch {}
  }, [sidebarOpen]);

  const qcCount = units?.length || 0;

  const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/beli", label: "Beli", icon: PlusCircle },
    { href: "/qc", label: "QC", icon: ClipboardCheck, badge: qcCount },
    { href: "/jual", label: "Jual", icon: Tags },
    { href: "/terjual", label: "Terjual", icon: CheckCircle2 },
    { href: "/laporan", label: "Laporan", icon: PieChart },
    { href: "/sosmed", label: "Sosmed", icon: Share2 },
    { href: "/settings", label: "Setting", icon: Settings },
  ];

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    queryClient.clear();
    invalidate();
  };

  return (
    <div className="min-h-[100dvh] flex flex-col md:flex-row bg-background">
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden md:flex flex-col fixed inset-y-0 border-r border-border bg-card z-20 transition-all duration-300 ease-in-out",
          sidebarOpen ? "w-64" : "w-16"
        )}
      >
        {/* Header / Logo */}
        <div className={cn("p-4 flex items-center gap-3 min-h-[72px]", !sidebarOpen && "justify-center")}>
          <div className="w-8 h-8 rounded-md bg-primary text-primary-foreground flex items-center justify-center text-xs font-black flex-shrink-0">
            IDT
          </div>
          {sidebarOpen && (
            <div className="overflow-hidden">
              <div className="text-primary font-bold text-base tracking-tight whitespace-nowrap">
                INDO DUTA TECH
              </div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">
                Premium Reseller
              </div>
            </div>
          )}
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-2 space-y-1 overflow-y-auto overflow-x-hidden">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={!sidebarOpen ? item.label : undefined}
                className={cn(
                  "flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group relative",
                  !sidebarOpen && "justify-center px-0",
                  isActive
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <item.icon
                  className={cn(
                    "w-5 h-5 flex-shrink-0",
                    isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                  )}
                />
                {sidebarOpen && (
                  <span className="whitespace-nowrap overflow-hidden text-ellipsis">{item.label}</span>
                )}
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={cn(
                      "bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-5 text-center flex-shrink-0",
                      sidebarOpen ? "ml-auto" : "absolute -top-1 -right-1"
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer: user + logout + toggle */}
        <div className="border-t border-border p-2 space-y-1">
          {/* User info */}
          {user && sidebarOpen && (
            <div className="px-3 py-2">
              <div className="text-xs font-semibold text-foreground truncate">{user.displayName}</div>
              <div className="text-[10px] text-muted-foreground truncate">@{user.username}</div>
            </div>
          )}

          {/* Logout */}
          <button
            onClick={handleLogout}
            title={!sidebarOpen ? "Logout" : undefined}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors",
              !sidebarOpen && "justify-center px-0"
            )}
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {sidebarOpen && <span className="text-sm">Logout</span>}
          </button>

          {/* Toggle button */}
          <button
            onClick={toggleSidebar}
            title={sidebarOpen ? "Kecilkan sidebar" : "Perbesar sidebar"}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors",
              !sidebarOpen && "justify-center px-0"
            )}
          >
            {sidebarOpen ? (
              <>
                <ChevronLeft className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm">Kecilkan</span>
              </>
            ) : (
              <ChevronRight className="w-4 h-4 flex-shrink-0" />
            )}
          </button>
        </div>
      </aside>

      {/* Main Content — offset matches sidebar width */}
      <main
        className={cn(
          "flex-1 pb-20 md:pb-0 relative min-h-[100dvh] transition-all duration-300 ease-in-out",
          sidebarOpen ? "md:ml-64" : "md:ml-16"
        )}
      >
        {children}
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-30 pb-safe">
        <div className="flex items-center justify-around px-2 py-2">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center py-2 px-1 w-full relative transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                <div className="relative">
                  <item.icon className="w-6 h-6 mb-1" />
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="absolute -top-1 -right-2 bg-primary text-primary-foreground text-[9px] font-bold px-1 py-0.5 rounded-full min-w-[16px] text-center shadow-[0_0_0_2px_hsl(var(--card))]">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-medium tracking-wide">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
