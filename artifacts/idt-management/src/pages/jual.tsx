import { useState, useEffect } from "react";
import { useListUnits, useMarkSold, useDeleteUnit, getListUnitsQueryKey, getGetDashboardQueryKey } from "@workspace/api-client-react";
import { formatRupiah, cn, formatDate } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { Tags, Printer, DollarSign, Search, Zap, CheckCircle2, Battery, ShieldCheck, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import * as Dialog from "@radix-ui/react-dialog";
import { useLocation } from "wouter";

export default function JualList() {
  const { data: units, isLoading, error } = useListUnits({ status: "READY" });
  const [search, setSearch] = useState("");
  const [selectedUnit, setSelectedUnit] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [, setLocation] = useLocation();
  const deleteUnit = useDeleteUnit();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleDelete = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (confirmDeleteId === id) {
      deleteUnit.mutate({ id }, {
        onSuccess: () => {
          toast({ title: "Unit dihapus", description: "Unit berhasil dihapus dari etalase." });
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

  const handlePrint = (id: number) => {
    setLocation(`/print-label/${id}`);
  };

  const filteredUnits = units?.filter(u => u.tipe.toLowerCase().includes(search.toLowerCase()) || u.spek.toLowerCase().includes(search.toLowerCase()));

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse">Memuat etalase...</div>;
  }

  if (error) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <p className="text-lg font-bold text-destructive mb-1">Gagal memuat etalase</p>
        <p className="text-sm">Periksa koneksi server dan muat ulang halaman.</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
      {/* Hide this entire block when printing */}
      <div className="print:hidden space-y-6">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Siap Jual (Etalase)</h1>
            <p className="text-muted-foreground mt-1">Unit yang sudah melewati QC dan siap dipasarkan.</p>
          </div>
          
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Cari tipe atau spek..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-card border border-border rounded-full pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </header>

        {(!filteredUnits || filteredUnits.length === 0) ? (
          <div className="bg-card border border-border rounded-xl p-12 text-center flex flex-col items-center">
            <Tags className="w-12 h-12 text-muted-foreground mb-3 opacity-20" />
            <h3 className="text-lg font-bold">Etalase Kosong</h3>
            <p className="text-muted-foreground">Tidak ada unit READY yang sesuai pencarian.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredUnits.map((unit) => {
              const modal = unit.hargaBeli + unit.biayaQc;
              const estimasi = modal * 1.05; // 5% margin default

              return (
                <div key={unit.id} className="bg-card border border-border p-5 rounded-xl flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start gap-2">
                      <h3 className="font-bold text-lg text-foreground line-clamp-2">{unit.tipe}</h3>
                      <div className="flex items-center gap-1 shrink-0">
                        {confirmDeleteId === unit.id ? (
                          <>
                            <button
                              onClick={(e) => handleDelete(e, unit.id)}
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
                          </>
                        ) : (
                          <button
                            onClick={(e) => handleDelete(e, unit.id)}
                            className="p-2 bg-secondary text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                            title="Hapus unit"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                        <button 
                          onClick={() => handlePrint(unit.id)}
                          className="p-2 bg-secondary text-muted-foreground hover:text-foreground rounded-lg transition-colors"
                          title="Cetak Price Tag"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground line-clamp-2">{unit.spek}</p>
                    
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center gap-1.5 bg-secondary/50 p-1.5 rounded"><Battery className="w-3 h-3 text-emerald-500" /> {unit.baterai}% Health</div>
                      <div className="flex items-center gap-1.5 bg-secondary/50 p-1.5 rounded truncate"><ShieldCheck className="w-3 h-3 text-blue-500" /> {unit.fisik}</div>
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-border flex items-end justify-between">
                    <div>
                      <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-1">Estimasi Jual</div>
                      <div className="text-xl font-bold text-primary">{formatRupiah(estimasi)}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">Modal: {formatRupiah(modal)}</div>
                    </div>
                    
                    <button 
                      onClick={() => setSelectedUnit(unit.id)}
                      className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 shadow-lg shadow-emerald-500/20"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Laku!
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Sold Dialog */}
      <SoldDialog 
        unitId={selectedUnit} 
        onClose={() => setSelectedUnit(null)} 
        units={units}
      />
    </div>
  );
}

function SoldDialog({ unitId, onClose, units }: { unitId: number | null, onClose: () => void, units: any[] | undefined }) {
  const unit = units?.find(u => u.id === unitId);
  const markSold = useMarkSold();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const modal = unit ? unit.hargaBeli + unit.biayaQc : 0;
  const estimasi = modal * 1.05;
  const [hargaJual, setHargaJual] = useState<number>(0);
  const [namaPembeli, setNamaPembeli] = useState("");
  const [nomorPembeli, setNomorPembeli] = useState("");

  // Initialize hargaJual setiap kali dialog dibuka (unitId berubah dari null ke nilai)
  useEffect(() => {
    if (unit && unitId) {
      setHargaJual(Math.round(estimasi));
    }
  // estimasi bergantung pada unit.hargaBeli + unit.biayaQc; unitId cukup sebagai trigger
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unitId]);

  const profit = hargaJual - modal;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!unitId) return;

    if (hargaJual <= 0) {
      toast({ title: "Harga jual tidak valid", description: "Harga jual harus lebih dari Rp 0.", variant: "destructive" });
      return;
    }

    markSold.mutate({ id: unitId, data: { hargaJual, namaPembeli, nomorPembeli } }, {
      onSuccess: () => {
        toast({ title: "Selamat! Unit terjual 🎉", description: `Profit: ${formatRupiah(profit)}` });
        queryClient.invalidateQueries({ queryKey: getListUnitsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
        setNamaPembeli("");
        setNomorPembeli("");
        setHargaJual(0);
        onClose();
      },
      onError: () => {
        toast({ title: "Gagal menyimpan penjualan", description: "Periksa koneksi dan coba lagi.", variant: "destructive" });
      }
    });
  };

  return (
    <Dialog.Root open={!!unitId} onOpenChange={(open) => { if (!open) { setNamaPembeli(""); setNomorPembeli(""); setHargaJual(0); onClose(); } }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] bg-card border border-border p-6 rounded-2xl shadow-xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          <Dialog.Title className="text-xl font-bold flex items-center gap-2 mb-2">
            <Zap className="w-5 h-5 text-emerald-500 fill-emerald-500" />
            Tandai Terjual
          </Dialog.Title>
          <Dialog.Description className="text-muted-foreground text-sm mb-4">
            Isi data pembeli & harga deal untuk unit <span className="font-bold text-foreground">{unit?.tipe}</span>.
          </Dialog.Description>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Buyer info */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Nama Pembeli</label>
                <input
                  type="text"
                  value={namaPembeli}
                  onChange={e => setNamaPembeli(e.target.value)}
                  placeholder="Nama lengkap"
                  required
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">No. HP / WA</label>
                <input
                  type="text"
                  value={nomorPembeli}
                  onChange={e => setNomorPembeli(e.target.value)}
                  placeholder="08xxxxxxxxxx"
                  required
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>

            <div className="p-3 bg-secondary/50 rounded-lg flex justify-between items-center text-sm border border-border">
              <span className="text-muted-foreground">Total Modal (Beli + QC)</span>
              <span className="font-mono font-medium">{formatRupiah(modal)}</span>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-primary" /> Harga Jual (Deal)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">Rp</span>
                <input 
                  type="number"
                  value={hargaJual}
                  onChange={(e) => setHargaJual(parseInt(e.target.value) || 0)}
                  className="w-full bg-secondary border border-border rounded-lg pl-10 pr-4 py-3 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono"
                />
              </div>
            </div>

            <div className={cn(
              "p-4 rounded-xl flex items-center justify-between font-bold border transition-colors",
              profit >= 0 ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" : "bg-destructive/10 border-destructive/20 text-destructive"
            )}>
              <span>{profit >= 0 ? "Profit Bersih" : "Rugi"}</span>
              <span className="text-lg">{formatRupiah(profit)}</span>
            </div>

            <div className="flex gap-3 pt-2">
              <button 
                type="button" 
                onClick={() => { setNamaPembeli(""); setNomorPembeli(""); setHargaJual(0); onClose(); }}
                className="flex-1 px-4 py-3 bg-secondary hover:bg-secondary/80 text-foreground font-semibold rounded-xl transition-colors"
              >
                Batal
              </button>
              <button 
                type="submit"
                disabled={markSold.isPending}
                className="flex-1 px-4 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-colors disabled:opacity-50"
              >
                {markSold.isPending ? "Menyimpan..." : "Simpan Penjualan"}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
