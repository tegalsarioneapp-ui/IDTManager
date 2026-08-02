import { useState, useEffect } from "react";
import { useListUnits, useMarkSold, useDeleteUnit, getListUnitsQueryKey, getGetDashboardQueryKey } from "@workspace/api-client-react";
import { formatRupiah, cn, formatDate } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { Tags, Printer, DollarSign, Search, Zap, CheckCircle2, Battery, ShieldCheck, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import * as Dialog from "@radix-ui/react-dialog";

export default function JualList() {
  const { data: units, isLoading } = useListUnits({ status: "READY" });
  const [search, setSearch] = useState("");
  const [selectedUnit, setSelectedUnit] = useState<number | null>(null);
  const [printUnitId, setPrintUnitId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
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

  useEffect(() => {
    const handleAfterPrint = () => setPrintUnitId(null);
    window.addEventListener("afterprint", handleAfterPrint);
    return () => window.removeEventListener("afterprint", handleAfterPrint);
  }, []);

  const handlePrint = (id: number) => {
    setPrintUnitId(id);
    setTimeout(() => window.print(), 100);
  };

  const filteredUnits = units?.filter(u => u.tipe.toLowerCase().includes(search.toLowerCase()) || u.spek.toLowerCase().includes(search.toLowerCase()));

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse">Memuat etalase...</div>;
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

                  {/* Hidden Print Container for each unit (only visible when printing) */}
                  {printUnitId === unit.id && (
                    <div className="hidden print:block absolute top-0 left-0 w-full h-full bg-white text-black p-8 z-50" id="print-area">
                      <div className="print-border rounded-2xl overflow-hidden max-w-sm mx-auto shadow-2xl mt-12">
                        <div className="print-bg-gold text-black text-center py-4 px-6 font-black text-2xl tracking-tighter uppercase">
                          Indo Duta Tech
                        </div>
                        <div className="p-6 bg-white">
                          <h2 className="text-2xl font-bold mb-4 leading-tight">{unit.tipe}</h2>
                          
                          <div className="space-y-3 text-sm mb-6 font-medium">
                            <div className="flex pb-2 border-b border-gray-200"><span className="w-24 text-gray-500 font-normal">Spek:</span> <span className="flex-1">{unit.spek}</span></div>
                            <div className="flex pb-2 border-b border-gray-200"><span className="w-24 text-gray-500 font-normal">Baterai:</span> <span className="flex-1 text-emerald-600">{unit.baterai}% Health</span></div>
                            <div className="flex pb-2 border-b border-gray-200"><span className="w-24 text-gray-500 font-normal">Fisik:</span> <span className="flex-1">{unit.fisik}</span></div>
                            <div className="flex pb-2 border-b border-gray-200"><span className="w-24 text-gray-500 font-normal">Kelengkapan:</span> <span className="flex-1">{unit.kelengkapan}</span></div>
                            {unit.appTambahan && (
                              <div className="flex pb-2 border-b border-gray-200"><span className="w-24 text-gray-500 font-normal">Software:</span> <span className="flex-1">{unit.appTambahan}</span></div>
                            )}
                          </div>

                          <div className="text-center pt-2">
                            <div className="text-sm text-gray-500 mb-1">HARGA SPESIAL</div>
                            <div className="text-3xl font-black text-black tracking-tight">{formatRupiah(estimasi)}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
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

  // Initialize input when unit opens
  if (unit && hargaJual === 0) {
    setHargaJual(estimasi);
  }

  const profit = hargaJual - modal;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!unitId) return;

    markSold.mutate({ id: unitId, data: { hargaJual } }, {
      onSuccess: () => {
        toast({ title: "Selamat! Unit terjual 🎉", description: `Profit: ${formatRupiah(profit)}` });
        queryClient.invalidateQueries({ queryKey: getListUnitsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
        onClose();
      }
    });
  };

  return (
    <Dialog.Root open={!!unitId} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] bg-card border border-border p-6 rounded-2xl shadow-xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          <Dialog.Title className="text-xl font-bold flex items-center gap-2 mb-2">
            <Zap className="w-5 h-5 text-emerald-500 fill-emerald-500" />
            Tandai Terjual
          </Dialog.Title>
          <Dialog.Description className="text-muted-foreground text-sm mb-6">
            Masukkan harga kesepakatan akhir (deal) untuk unit <span className="font-bold text-foreground">{unit?.tipe}</span>.
          </Dialog.Description>

          <form onSubmit={handleSubmit} className="space-y-4">
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
                  autoFocus
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
                onClick={onClose}
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
