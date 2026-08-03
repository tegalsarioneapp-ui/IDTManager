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
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useListUnits } from "@workspace/api-client-react";
import { useAuth } from "@/context/auth";

export function Shell({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { data: units } = useListUnits({ status: "PROSES" });
  const { logout } = useAuth();
  
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

  return (
    <div className="min-h-[100dvh] flex flex-col md:flex-row bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col fixed inset-y-0 border-r border-border bg-card z-20">
        <div className="p-6">
          <div className="flex items-center gap-3 text-primary font-bold text-xl tracking-tight">
            <div className="w-8 h-8 rounded-md bg-primary text-primary-foreground flex items-center justify-center">
              IDT
            </div>
            <span>INDO DUTA TECH</span>
          </div>
          <div className="text-xs text-muted-foreground mt-1 uppercase tracking-widest font-semibold">Premium Reseller</div>
        </div>
        <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href} className={cn(
                "flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group relative",
                isActive ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}>
                <item.icon className={cn("w-5 h-5", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                <span>{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute right-3 bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-5 text-center">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
        {/* Logout — desktop sidebar footer */}
        <div className="px-4 pb-6 pt-2 border-t border-border mt-2">
          <button
            onClick={() => void logout()}
            className="flex items-center gap-3 px-3 py-3 rounded-lg w-full text-muted-foreground hover:bg-secondary hover:text-foreground transition-all duration-200 group"
          >
            <LogOut className="w-5 h-5 text-muted-foreground group-hover:text-foreground" />
            <span className="text-sm">Keluar</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 pb-20 md:pb-0 relative min-h-[100dvh]">
        {children}
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-30 pb-safe">
        <div className="flex items-center justify-around px-2 py-2">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href} className={cn(
                "flex flex-col items-center justify-center py-2 px-1 w-full relative transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )}>
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
