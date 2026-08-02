import { useState } from "react";
import { useListUnits, useCompleteQc, useDeleteUnit, getListUnitsQueryKey, getGetDashboardQueryKey } from "@workspace/api-client-react";
import { formatRupiah, cn, formatDate } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { Wrench, Battery, ShieldCheck, DollarSign, Check, X, AlertCircle, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function QcList() {
  const { data: units, isLoading } = useListUnits({ status: "PROSES" });
  const [selectedUnit, setSelectedUnit] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const deleteUnit = useDeleteUnit();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleDelete = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (confirmDeleteId === id) {
      deleteUnit.mutate({ id }, {
        onSuccess: () => {
          toast({ title: "Unit dihapus", description: "Unit berhasil dihapus dari antrean." });
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
    return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading QC queue...</div>;
  }

  if (selectedUnit) {
    return <QcForm id={selectedUnit} onBack={() => setSelectedUnit(null)} />;
  }

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Quality Control</h1>
          <p className="text-muted-foreground mt-1">Antrean unit untuk inspeksi & perbaikan.</p>
        </div>
        <div className="bg-amber-500/20 text-amber-500 px-3 py-1 rounded-full text-sm font-bold flex items-center gap-2">
          <Wrench className="w-4 h-4" />
          {units?.length || 0} Antrean
        </div>
      </header>

      {(!units || units.length === 0) ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center flex flex-col items-center">
          <Check className="w-12 h-12 text-emerald-500 mb-3 opacity-20" />
          <h3 className="text-lg font-bold">Semua beres!</h3>
          <p className="text-muted-foreground">Tidak ada unit yang menunggu QC saat ini.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {units.map((unit) => (
            <div 
              key={unit.id}
              onClick={() => { setConfirmDeleteId(null); setSelectedUnit(unit.id); }}
              className="bg-card border border-border hover:border-primary/50 p-5 rounded-xl cursor-pointer transition-all hover:shadow-[0_4px_20px_-10px_rgba(247,171,12,0.3)] group"
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-lg group-hover:text-primary transition-colors">{unit.tipe}</h3>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{formatDate(unit.createdAt)}</span>
                  {confirmDeleteId === unit.id ? (
                    <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={(e) => handleDelete(e, unit.id)}
                        disabled={deleteUnit.isPending}
                        className="text-xs bg-destructive text-destructive-foreground px-2 py-1 rounded font-semibold hover:bg-destructive/80 transition-colors"
                      >
                        Yakin?
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(null); }}
                        className="text-xs bg-secondary text-muted-foreground px-2 py-1 rounded hover:bg-secondary/80 transition-colors"
                      >
                        Batal
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={(e) => handleDelete(e, unit.id)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      title="Hapus unit"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-3 line-clamp-1">{unit.spek}</p>
              
              <div className="flex items-start gap-3 bg-secondary/50 p-3 rounded-lg border border-border/50">
                <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <span className="font-semibold text-foreground">Minus Tercatat: </span>
                  <span className="text-muted-foreground">{unit.minus}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function QcForm({ id, onBack }: { id: number; onBack: () => void }) {
  const { data: units } = useListUnits({ status: "PROSES" });
  const unit = units?.find(u => u.id === id);
  const completeQc = useCompleteQc();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [baterai, setBaterai] = useState<number>(85);
  const [fisik, setFisik] = useState<"Mulus Like New" | "Lecet Pemakaian Wajar" | "Ada Dent/Sedikit Pecah">("Lecet Pemakaian Wajar");
  const [biayaQc, setBiayaQc] = useState<number>(0);
  const [appTambahan, setAppTambahan] = useState<string>("");

  const [checks, setChecks] = useState({
    speaker: false,
    layar: false,
    ssd: false,
    ram: false,
    keyboard: false
  });

  const allChecked = Object.values(checks).every(Boolean);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!allChecked) {
      toast({ title: "Belum Selesai", description: "Semua checklist dasar wajib dicentang sebelum unit dinyatakan READY.", variant: "destructive" });
      return;
    }

    completeQc.mutate({
      id,
      data: {
        baterai,
        fisik,
        biayaQc,
        appTambahan: appTambahan || ""
      }
    }, {
      onSuccess: () => {
        toast({ title: "QC Selesai!", description: "Unit dipindahkan ke status READY." });
        queryClient.invalidateQueries({ queryKey: getListUnitsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
        onBack();
      }
    });
  };

  if (!unit) return null;

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto space-y-6">
      <header className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 bg-secondary rounded-lg hover:bg-secondary/80 text-foreground transition-colors">
          <X className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Form Inspeksi QC</h1>
          <p className="text-primary font-medium">{unit.tipe}</p>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Hardware Checks */}
        <section className="bg-card border border-border p-5 rounded-xl space-y-4">
          <h2 className="font-bold flex items-center gap-2 border-b border-border pb-3">
            <ShieldCheck className="w-5 h-5 text-primary" /> Cek Fungsi Dasar
          </h2>
          <div className="grid gap-3 pt-2">
            {[
              { id: 'speaker', label: 'Speaker Jernih & Tidak Sember' },
              { id: 'layar', label: 'Layar Aman (No Whitespot/Deadpixel)' },
              { id: 'ssd', label: 'SSD Terpasang & Health Baik' },
              { id: 'ram', label: 'RAM Minimal 8GB' },
              { id: 'keyboard', label: 'Keyboard & Touchpad 100% OK' }
            ].map(item => (
              <label key={item.id} className="flex items-center gap-3 p-3 bg-secondary/40 rounded-lg cursor-pointer hover:bg-secondary transition-colors border border-transparent has-[:checked]:border-primary/50 has-[:checked]:bg-primary/5">
                <input 
                  type="checkbox" 
                  checked={(checks as any)[item.id]} 
                  onChange={(e) => setChecks(c => ({...c, [item.id]: e.target.checked}))}
                  className="w-5 h-5 rounded border-border text-primary focus:ring-primary accent-primary"
                />
                <span className={cn("font-medium select-none", (checks as any)[item.id] ? "text-foreground" : "text-muted-foreground")}>{item.label}</span>
              </label>
            ))}
          </div>
        </section>

        {/* Condition details */}
        <section className="bg-card border border-border p-5 rounded-xl space-y-5">
          <div className="space-y-3">
            <label className="text-sm font-semibold flex items-center gap-2">
              <Battery className="w-4 h-4 text-primary" /> Health Baterai (%)
            </label>
            <div className="flex items-center gap-4">
              <input 
                type="range" min="0" max="100" 
                value={baterai} onChange={(e) => setBaterai(parseInt(e.target.value))}
                className="flex-1 accent-primary"
              />
              <span className="font-mono bg-secondary px-3 py-1 rounded-md min-w-[60px] text-center font-bold">{baterai}%</span>
            </div>
          </div>

          <div className="space-y-3 pt-3 border-t border-border">
            <label className="text-sm font-semibold">Kondisi Fisik Akhir</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {["Mulus Like New", "Lecet Pemakaian Wajar", "Ada Dent/Sedikit Pecah"].map(opt => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setFisik(opt as any)}
                  className={cn(
                    "px-3 py-2 rounded-lg border text-sm font-medium transition-all text-left",
                    fisik === opt 
                      ? "border-primary bg-primary/10 text-primary" 
                      : "border-border bg-secondary text-muted-foreground hover:bg-secondary/80"
                  )}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3 pt-3 border-t border-border">
            <label className="text-sm font-semibold">Software Tambahan (Opsional)</label>
            <input 
              value={appTambahan} onChange={(e) => setAppTambahan(e.target.value)}
              className="w-full bg-secondary border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Misal: AutoCAD, Premiere Pro, CorelDraw"
            />
          </div>

          <div className="space-y-3 pt-3 border-t border-border">
            <label className="text-sm font-semibold flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-primary" /> Biaya QC & Sparepart
            </label>
            <p className="text-xs text-muted-foreground -mt-2">Biaya untuk ganti sparepart, thermal paste, dll. (Masuk ke modal)</p>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">Rp</span>
              <input 
                type="number"
                value={biayaQc} onChange={(e) => setBiayaQc(parseInt(e.target.value) || 0)}
                className="w-full bg-secondary border border-border rounded-lg pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono"
              />
            </div>
            {biayaQc > 0 && (
              <p className="text-xs text-primary font-medium mt-1 text-right">
                + {formatRupiah(biayaQc)}
              </p>
            )}
          </div>
        </section>

        <button 
          type="submit"
          disabled={!allChecked || completeQc.isPending}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold py-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
        >
          {completeQc.isPending ? "Menyimpan..." : "Selesai QC & Mark READY"}
        </button>
      </form>
    </div>
  );
}
