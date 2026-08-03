import { useGetDashboard } from "@workspace/api-client-react";
import { formatRupiah, formatDate } from "@/lib/utils";
import { 
  Wallet, 
  TrendingUp, 
  LineChart, 
  Laptop, 
  CheckCircle2, 
  Wrench, 
  Tags 
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function Dashboard() {
  const { data: dashboard, isLoading, error } = useGetDashboard();

  if (isLoading) {
    return (
      <div className="p-6 md:p-8 space-y-6 animate-pulse">
        <div className="h-8 bg-secondary rounded w-1/3"></div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-28 bg-card rounded-xl"></div>)}
        </div>
      </div>
    );
  }

  if (error || !dashboard) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <p className="text-lg font-bold text-destructive mb-1">Gagal memuat dashboard</p>
        <p className="text-sm">Periksa koneksi server dan muat ulang halaman.</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
      <header>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overview operasional & keuangan hari ini.</p>
      </header>

      {/* KPI Cards */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard 
          title="Total Modal (READY)" 
          value={formatRupiah(dashboard.totalModal)} 
          icon={Wallet} 
          trend="Nilai aset siap jual"
          color="blue"
        />
        <KpiCard 
          title="Estimasi Jual" 
          value={formatRupiah(dashboard.estimasiNilaiJual)} 
          icon={TrendingUp} 
          trend="+5% margin default"
          color="amber"
        />
        <KpiCard 
          title="Potensi Profit" 
          value={formatRupiah(dashboard.potensiProfit)} 
          icon={LineChart} 
          trend="Dari unit READY"
          color="emerald"
        />
        <KpiCard 
          title="Realisasi Profit" 
          value={formatRupiah(dashboard.realisasiProfit)} 
          icon={CheckCircle2} 
          trend="Dari unit TERJUAL"
          color="emerald"
          solid
        />
      </section>

      {/* Unit Status Cards */}
      <section>
        <h2 className="text-xl font-bold mb-4">Status Unit</h2>
        <div className="grid grid-cols-3 gap-4">
          <StatusCard title="PROSES QC" count={dashboard.totalUnitProses} icon={Wrench} color="text-amber-500" bg="bg-amber-500/10" border="border-amber-500/20" />
          <StatusCard title="SIAP JUAL" count={dashboard.totalUnitReady} icon={Tags} color="text-emerald-500" bg="bg-emerald-500/10" border="border-emerald-500/20" />
          <StatusCard title="TERJUAL" count={dashboard.totalUnitTerjual} icon={Laptop} color="text-blue-500" bg="bg-blue-500/10" border="border-blue-500/20" />
        </div>
      </section>

      {/* Recent Units */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Unit Terbaru</h2>
        </div>
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          {dashboard.recentUnits.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">Belum ada data unit.</div>
          ) : (
            <div className="divide-y divide-border">
              {dashboard.recentUnits.map((unit) => (
                <div key={unit.id} className="p-4 flex items-center justify-between hover:bg-secondary/50 transition-colors">
                  <div>
                    <h3 className="font-bold text-foreground">{unit.tipe}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-1 max-w-[200px] md:max-w-md">{unit.spek}</p>
                    <div className="text-xs text-muted-foreground mt-1">{formatDate(unit.createdAt)}</div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className={cn(
                      "px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase",
                      unit.status === 'PROSES' && "bg-amber-500/20 text-amber-500",
                      unit.status === 'READY' && "bg-emerald-500/20 text-emerald-500",
                      unit.status === 'TERJUAL' && "bg-blue-500/20 text-blue-500"
                    )}>
                      {unit.status}
                    </span>
                    <span className="text-sm font-semibold mt-2">{formatRupiah(unit.hargaBeli)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function KpiCard({ title, value, icon: Icon, trend, color, solid }: any) {
  return (
    <div className={cn(
      "p-4 md:p-5 rounded-xl border flex flex-col justify-between",
      solid 
        ? "bg-primary text-primary-foreground border-primary" 
        : "bg-card border-border"
    )}>
      <div className="flex justify-between items-start mb-4">
        <h3 className={cn("text-xs md:text-sm font-medium", solid ? "text-primary-foreground/80" : "text-muted-foreground")}>{title}</h3>
        <div className={cn(
          "p-2 rounded-lg",
          solid ? "bg-primary-foreground/20 text-primary-foreground" : "bg-secondary text-primary"
        )}>
          <Icon className="w-4 h-4 md:w-5 md:h-5" />
        </div>
      </div>
      <div>
        <div className="text-lg md:text-2xl font-bold tracking-tight">{value}</div>
        <div className={cn("text-[10px] md:text-xs mt-1", solid ? "text-primary-foreground/70" : "text-muted-foreground")}>{trend}</div>
      </div>
    </div>
  );
}

function StatusCard({ title, count, icon: Icon, color, bg, border }: any) {
  return (
    <div className={cn("p-4 rounded-xl border flex flex-col items-center text-center justify-center gap-2", bg, border)}>
      <Icon className={cn("w-6 h-6 md:w-8 md:h-8 mb-1", color)} />
      <div className={cn("text-2xl md:text-3xl font-black", color)}>{count}</div>
      <div className={cn("text-[10px] md:text-xs font-bold uppercase tracking-wider", color)}>{title}</div>
    </div>
  );
}
