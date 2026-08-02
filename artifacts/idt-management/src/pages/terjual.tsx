import { useState } from "react";
import { useListUnits, useDeleteUnit, getListUnitsQueryKey, getGetDashboardQueryKey } from "@workspace/api-client-react";
import { formatRupiah, formatDate, cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, TrendingUp, CalendarDays, Wallet, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function TerjualList() {
  const { data: units, isLoading } = useListUnits({ status: "TERJUAL" });
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const deleteUnit = useDeleteUnit();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleDelete = (id: number) => {
    if (confirmDeleteId === id) {
      deleteUnit.mutate({ id }, {
        onSuccess: () => {
          toast({ title: "Unit dihapus", description: "Riwayat penjualan unit telah dihapus." });
          queryClient.invalidateQueries({ queryKey: getListUnitsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
          setConfirmDeleteId(null);
        },
        onError: () => {
          toast({ title: "Gagal menghapus", variant: "destructive" });
          setConfirmDeleteId(null);
        }
      });
    } else {
      setConfirmDeleteId(id);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse">Memuat riwayat penjualan...</div>;
  }

  // Sort by sell date descending
  const sortedUnits = units?.slice().sort((a, b) => {
    return new Date(b.tanggalJual || b.createdAt).getTime() - new Date(a.tanggalJual || a.createdAt).getTime();
  });

  const totalRealisasi = sortedUnits?.reduce((sum, u) => {
    const modal = u.hargaBeli + u.biayaQc;
    const jual = u.hargaJual || 0;
    return sum + (jual - modal);
  }, 0) || 0;

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-8">
      <header className="flex flex-col gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Riwayat Terjual</h1>
          <p className="text-muted-foreground mt-1">Daftar unit yang sukses terjual dan realisasi profit.</p>
        </div>
        
        {/* Sticky Profit Banner */}
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-400 p-5 rounded-xl text-white shadow-lg shadow-emerald-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <div className="text-emerald-50 text-sm font-medium">Total Realisasi Profit</div>
              <div className="text-2xl md:text-3xl font-black">{formatRupiah(totalRealisasi)}</div>
            </div>
          </div>
          <div className="text-sm bg-black/20 px-4 py-2 rounded-lg font-medium self-start md:self-auto backdrop-blur-sm">
            {sortedUnits?.length || 0} Unit Terjual
          </div>
        </div>
      </header>

      {(!sortedUnits || sortedUnits.length === 0) ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center flex flex-col items-center">
          <CheckCircle2 className="w-12 h-12 text-muted-foreground mb-3 opacity-20" />
          <h3 className="text-lg font-bold">Belum ada penjualan</h3>
          <p className="text-muted-foreground">Unit yang laku akan muncul di sini.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedUnits.map((unit) => {
            const modal = unit.hargaBeli + unit.biayaQc;
            const jual = unit.hargaJual || 0;
            const profit = jual - modal;
            const isProfit = profit >= 0;

            return (
              <div key={unit.id} className="bg-card border border-border p-4 md:p-5 rounded-xl flex flex-col md:flex-row gap-4 md:items-center justify-between transition-all hover:bg-secondary/20">
                
                <div className="space-y-2 flex-1">
                  <h3 className="font-bold text-lg text-foreground">{unit.tipe}</h3>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5"><CalendarDays className="w-3.5 h-3.5" /> Terjual: {unit.tanggalJual ? formatDate(unit.tanggalJual) : '-'}</span>
                    <span className="hidden md:inline text-border">•</span>
                    <span className="flex items-center gap-1.5"><Wallet className="w-3.5 h-3.5" /> Modal: {formatRupiah(modal)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 md:gap-6 justify-between md:justify-end border-t md:border-t-0 border-border pt-3 md:pt-0">
                  <div className="text-left md:text-right">
                    <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Harga Deal</div>
                    <div className="font-bold text-foreground text-lg font-mono">{formatRupiah(jual)}</div>
                  </div>
                  
                  <div className={cn(
                    "px-4 py-2 rounded-lg text-right min-w-[120px]",
                    isProfit ? "bg-emerald-500/10 text-emerald-500" : "bg-destructive/10 text-destructive"
                  )}>
                    <div className="text-[10px] font-bold uppercase tracking-wider opacity-80">{isProfit ? "Profit" : "Rugi"}</div>
                    <div className="font-bold text-lg">{isProfit ? '+' : ''}{formatRupiah(profit)}</div>
                  </div>

                  {confirmDeleteId === unit.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDelete(unit.id)}
                        disabled={deleteUnit.isPending}
                        className="text-xs bg-destructive text-destructive-foreground px-2 py-1 rounded font-semibold hover:bg-destructive/80 transition-colors"
                      >
                        Yakin?
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="text-xs bg-secondary text-muted-foreground px-2 py-1 rounded hover:bg-secondary/80 transition-colors"
                      >
                        Batal
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleDelete(unit.id)}
                      className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                      title="Hapus unit"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
