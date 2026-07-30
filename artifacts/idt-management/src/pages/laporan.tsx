import { useGetDashboard } from "@workspace/api-client-react";
import { formatRupiah } from "@/lib/utils";
import { PieChart, LineChart, Wallet, TrendingUp, AlertTriangle } from "lucide-react";
import { ResponsiveContainer, PieChart as RePieChart, Pie, Cell, Tooltip, Legend } from "recharts";

export default function Laporan() {
  const { data: dashboard, isLoading } = useGetDashboard();

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse">Menghitung data keuangan...</div>;
  }

  if (!dashboard) return null;

  // Simple distribution data for chart
  const statusData = [
    { name: 'PROSES (Antrean)', value: dashboard.totalUnitProses, color: '#f59e0b' },
    { name: 'READY (Etalase)', value: dashboard.totalUnitReady, color: '#10b981' },
    { name: 'TERJUAL (Sukses)', value: dashboard.totalUnitTerjual, color: '#3b82f6' }
  ];

  const totalAset = dashboard.totalModal; 
  const roa = dashboard.totalModal > 0 ? (dashboard.realisasiProfit / dashboard.totalModal) * 100 : 0;

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-foreground">Rekap Keuangan</h1>
        <p className="text-muted-foreground mt-1">Laporan aset berjalan dan performa profit.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Left Column: Financial Numbers */}
        <div className="space-y-6">
          <div className="bg-card border border-border p-6 rounded-2xl">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-6 flex items-center gap-2">
              <Wallet className="w-4 h-4 text-primary" /> Ringkasan Aset Aktif
            </h2>
            <div className="space-y-5">
              <div>
                <div className="text-xs text-muted-foreground mb-1">Total Modal Mengendap (READY)</div>
                <div className="text-3xl font-black text-foreground">{formatRupiah(dashboard.totalModal)}</div>
              </div>
              <div className="pt-5 border-t border-border">
                <div className="text-xs text-muted-foreground mb-1">Estimasi Nilai Jual (Aset)</div>
                <div className="text-xl font-bold text-primary">{formatRupiah(dashboard.estimasiNilaiJual)}</div>
              </div>
              <div className="pt-5 border-t border-border">
                <div className="text-xs text-muted-foreground mb-1">Potensi Profit (Belum Terealisasi)</div>
                <div className="text-lg font-bold text-amber-500">{formatRupiah(dashboard.potensiProfit)}</div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-card to-secondary/30 border border-border p-6 rounded-2xl">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-6 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" /> Performa Bisnis
            </h2>
            <div className="space-y-5">
              <div>
                <div className="text-xs text-muted-foreground mb-1">Total Realisasi Profit Bersih</div>
                <div className="text-3xl font-black text-emerald-500">{formatRupiah(dashboard.realisasiProfit)}</div>
              </div>
              <div className="pt-5 border-t border-border flex items-center justify-between">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Return on Asset (ROA)</div>
                  <div className="text-lg font-bold text-foreground">{roa.toFixed(1)}%</div>
                </div>
                {roa < 10 && roa > 0 && (
                  <div className="bg-amber-500/10 text-amber-500 px-3 py-1 rounded flex items-center gap-2 text-xs font-bold">
                    <AlertTriangle className="w-3 h-3" /> Margin Tipis
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Charts */}
        <div className="bg-card border border-border p-6 rounded-2xl flex flex-col">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-6 flex items-center gap-2">
            <PieChart className="w-4 h-4 text-primary" /> Distribusi Unit
          </h2>
          
          <div className="flex-1 min-h-[300px] flex items-center justify-center">
            {statusData.every(d => d.value === 0) ? (
              <div className="text-center text-muted-foreground">Belum ada data unit.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={110}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Legend verticalAlign="bottom" height={36} />
                </RePieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-border">
            {statusData.map(d => (
              <div key={d.name} className="text-center">
                <div className="text-[10px] text-muted-foreground truncate" title={d.name}>{d.name}</div>
                <div className="text-xl font-bold" style={{ color: d.color }}>{d.value}</div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
