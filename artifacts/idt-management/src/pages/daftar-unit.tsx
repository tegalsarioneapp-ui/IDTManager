import { useState, useMemo } from "react";
import {
  useListUnits, useUpdateUnit, useDeleteUnit,
  getListUnitsQueryKey, getGetDashboardQueryKey,
} from "@workspace/api-client-react";
import { formatRupiah, formatDate, cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  Zap, Clock, PackageCheck,
  Pencil, Trash2, X, Loader2, LayoutList,
  Search, SlidersHorizontal,
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────────
type UnitStatus = "PROSES" | "READY" | "TERJUAL";

interface Unit {
  id: number;
  tipe: string;
  spek: string;
  minus: string;
  kelengkapan: string;
  hargaBeli: number;
  biayaQc: number;
  baterai?: number | null;
  fisik?: string | null;
  status: UnitStatus;
  createdAt: string;
}

// ─── Status config ─────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<UnitStatus, {
  label: string;
  icon: React.ElementType;
  chip: string;
  border: string;
  dot: string;
}> = {
  PROSES: {
    label: "Proses QC",
    icon: Clock,
    chip: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    border: "border-l-amber-500",
    dot: "bg-amber-400",
  },
  READY: {
    label: "Siap Jual",
    icon: Zap,
    chip: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    border: "border-l-emerald-500",
    dot: "bg-emerald-400",
  },
  TERJUAL: {
    label: "Terjual",
    icon: PackageCheck,
    chip: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    border: "border-l-blue-500",
    dot: "bg-blue-400",
  },
};

const STATUS_FILTERS: { value: UnitStatus | "SEMUA"; label: string }[] = [
  { value: "SEMUA", label: "Semua" },
  { value: "PROSES", label: "Proses QC" },
  { value: "READY", label: "Siap Jual" },
  { value: "TERJUAL", label: "Terjual" },
];

// ─── Edit Dialog ───────────────────────────────────────────────────────────────
function EditDialog({ unit, onClose, onSaved }: {
  unit: Unit; onClose: () => void; onSaved: () => void;
}) {
  const [form, setForm] = useState({
    tipe: unit.tipe,
    spek: unit.spek,
    minus: unit.minus,
    kelengkapan: unit.kelengkapan,
    hargaBeli: String(unit.hargaBeli),
  });
  const [err, setErr] = useState("");
  const updateUnit = useUpdateUnit();
  const { toast } = useToast();

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    const harga = parseInt(form.hargaBeli.replace(/\D/g, ""), 10);
    if (!form.tipe.trim()) { setErr("Tipe wajib diisi"); return; }
    if (isNaN(harga) || harga <= 0) { setErr("Harga beli tidak valid"); return; }

    updateUnit.mutate(
      { id: unit.id, data: { tipe: form.tipe, spek: form.spek, minus: form.minus, kelengkapan: form.kelengkapan, hargaBeli: harga } },
      {
        onSuccess: () => {
          toast({ title: "Unit diperbarui ✓" });
          onSaved();
          onClose();
        },
        onError: () => setErr("Gagal menyimpan perubahan"),
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md animate-in fade-in-0 zoom-in-95">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h2 className="font-bold text-base">Edit Informasi Unit</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              <StatusChip status={unit.status} />
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-secondary text-muted-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="p-5 space-y-3.5">
          <EditField label="Tipe / Model" required>
            <input
              value={form.tipe} onChange={set("tipe")} required
              placeholder="Contoh: Samsung Galaxy S24"
              className={fieldCls}
            />
          </EditField>
          <EditField label="Spesifikasi">
            <input
              value={form.spek} onChange={set("spek")}
              placeholder="Contoh: 8/256 GB, Phantom Black"
              className={fieldCls}
            />
          </EditField>
          <EditField label="Minus / Kekurangan">
            <textarea
              value={form.minus} onChange={set("minus")}
              placeholder="Contoh: Layar normal, baterai 85%"
              rows={2}
              className={cn(fieldCls, "resize-none")}
            />
          </EditField>
          <EditField label="Kelengkapan">
            <input
              value={form.kelengkapan} onChange={set("kelengkapan")}
              placeholder="Contoh: Unit, charger, dus"
              className={fieldCls}
            />
          </EditField>
          <EditField label="Harga Beli (Rp)" required>
            <input
              value={form.hargaBeli} onChange={set("hargaBeli")}
              inputMode="numeric" placeholder="Contoh: 8500000"
              className={cn(fieldCls, "font-mono")}
            />
          </EditField>

          {err && (
            <div className="bg-destructive/10 border border-destructive/30 text-destructive text-xs rounded-lg px-3 py-2.5">
              {err}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 h-10 border border-border rounded-xl text-sm text-muted-foreground hover:bg-secondary transition-colors">
              Batal
            </button>
            <button type="submit" disabled={updateUnit.isPending}
              className="flex-1 h-10 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
              {updateUnit.isPending
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...</>
                : <><Pencil className="w-4 h-4" /> Simpan</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditField({ label, required, children }: {
  label: string; required?: boolean; children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        {label}{required && <span className="text-destructive ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}

function StatusChip({ status }: { status: UnitStatus }) {
  const cfg = STATUS_CONFIG[status];
  const Icon = cfg.icon;
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full border",
      cfg.chip
    )}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

const fieldCls =
  "w-full bg-secondary border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition-all";

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function DaftarUnit() {
  const { data: units, isLoading, error } = useListUnits();
  const deleteUnit = useDeleteUnit();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [filterStatus, setFilterStatus] = useState<UnitStatus | "SEMUA">("SEMUA");
  const [search, setSearch] = useState("");
  const [editUnit, setEditUnit] = useState<Unit | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const handleDelete = (id: number) => {
    if (confirmDeleteId === id) {
      deleteUnit.mutate({ id }, {
        onSuccess: () => {
          toast({ title: "Unit dihapus" });
          queryClient.invalidateQueries({ queryKey: getListUnitsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
          setConfirmDeleteId(null);
        },
        onError: () => {
          toast({ title: "Gagal menghapus", variant: "destructive" });
          setConfirmDeleteId(null);
        },
      });
    } else {
      setConfirmDeleteId(id);
    }
  };

  const handleEditSaved = () => {
    queryClient.invalidateQueries({ queryKey: getListUnitsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
  };

  // Derived: filter + search
  const filtered = useMemo(() => {
    if (!units) return [];
    return (units as Unit[])
      .filter((u) => filterStatus === "SEMUA" || u.status === filterStatus)
      .filter((u) => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return u.tipe.toLowerCase().includes(q) || u.spek.toLowerCase().includes(q);
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [units, filterStatus, search]);

  // Summary counts
  const counts = useMemo(() => {
    if (!units) return { SEMUA: 0, PROSES: 0, READY: 0, TERJUAL: 0 };
    const all = units as Unit[];
    return {
      SEMUA: all.length,
      PROSES: all.filter((u) => u.status === "PROSES").length,
      READY: all.filter((u) => u.status === "READY").length,
      TERJUAL: all.filter((u) => u.status === "TERJUAL").length,
    };
  }, [units]);

  if (isLoading) {
    return (
      <div className="p-8 text-center text-muted-foreground animate-pulse">
        Memuat daftar unit...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-lg font-bold text-destructive mb-1">Gagal memuat daftar unit</p>
        <p className="text-sm text-muted-foreground">Periksa koneksi server dan muat ulang halaman.</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <header>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
          <LayoutList className="w-8 h-8 text-primary" />
          Daftar Unit
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Semua unit yang pernah didaftarkan beserta status terkini.
        </p>
      </header>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {(["SEMUA", "PROSES", "READY", "TERJUAL"] as const).map((s) => {
          const cfg = s === "SEMUA" ? null : STATUS_CONFIG[s];
          const isActive = filterStatus === s;
          return (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={cn(
                "p-4 rounded-xl border text-left transition-all",
                isActive
                  ? "bg-primary/10 border-primary/40 shadow-sm"
                  : "bg-card border-border hover:bg-secondary/50"
              )}
            >
              <div className={cn(
                "text-[10px] font-bold uppercase tracking-widest mb-1",
                isActive ? "text-primary" : "text-muted-foreground"
              )}>
                {s === "SEMUA" ? "Semua Unit" : cfg!.label}
              </div>
              <div className={cn(
                "text-2xl font-black",
                isActive ? "text-primary" : "text-foreground"
              )}>
                {counts[s]}
              </div>
              {cfg && (
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span className={cn("w-1.5 h-1.5 rounded-full", cfg.dot)} />
                  <span className="text-[10px] text-muted-foreground">{cfg.label}</span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari tipe atau spesifikasi unit..."
          className="w-full bg-card border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition-all"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-secondary text-muted-foreground"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Status tab filter (mobile-friendly horizontal scroll) */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
        {STATUS_FILTERS.map(({ value, label }) => {
          const active = filterStatus === value;
          const cfg = value !== "SEMUA" ? STATUS_CONFIG[value] : null;
          return (
            <button
              key={value}
              onClick={() => setFilterStatus(value)}
              className={cn(
                "flex items-center gap-1.5 shrink-0 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all border",
                active
                  ? "bg-primary text-primary-foreground border-primary shadow-sm shadow-primary/20"
                  : "bg-card border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
              )}
            >
              {cfg && <cfg.icon className="w-3.5 h-3.5" />}
              {label}
              <span className={cn(
                "px-1.5 py-0.5 rounded-full text-[10px] font-bold",
                active ? "bg-white/20" : "bg-secondary"
              )}>
                {counts[value]}
              </span>
            </button>
          );
        })}
        {search && (
          <span className="shrink-0 flex items-center gap-1 px-3 py-2 rounded-lg bg-secondary/70 border border-border text-xs text-muted-foreground">
            <SlidersHorizontal className="w-3 h-3" />
            {filtered.length} hasil
          </span>
        )}
      </div>

      {/* Unit list */}
      {filtered.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center">
          <LayoutList className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
          <p className="font-semibold text-foreground">Tidak ada unit ditemukan</p>
          <p className="text-sm text-muted-foreground mt-1">
            {search ? `Tidak ada unit yang cocok dengan "${search}"` : "Belum ada unit pada kategori ini"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((unit) => {
            const cfg = STATUS_CONFIG[unit.status];
            const Icon = cfg.icon;
            const isDeleting = confirmDeleteId === unit.id;

            return (
              <div
                key={unit.id}
                className={cn(
                  "bg-card border border-border rounded-xl border-l-4 transition-all hover:shadow-sm hover:bg-secondary/10",
                  cfg.border
                )}
              >
                <div className="flex items-center gap-3 px-4 py-3.5">
                  {/* Status icon */}
                  <div className={cn(
                    "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
                    unit.status === "PROSES" && "bg-amber-500/10",
                    unit.status === "READY" && "bg-emerald-500/10",
                    unit.status === "TERJUAL" && "bg-blue-500/10",
                  )}>
                    <Icon className={cn(
                      "w-4.5 h-4.5",
                      unit.status === "PROSES" && "text-amber-400",
                      unit.status === "READY" && "text-emerald-400",
                      unit.status === "TERJUAL" && "text-blue-400",
                    )} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-foreground text-sm leading-tight truncate">
                        {unit.tipe}
                      </span>
                      <StatusChip status={unit.status} />
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      <span className="text-xs text-muted-foreground truncate max-w-[200px]">{unit.spek}</span>
                      <span className="text-xs font-mono font-semibold text-foreground">
                        {formatRupiah(unit.hargaBeli)}
                      </span>
                      {unit.baterai != null && (
                        <span className="text-xs text-muted-foreground">🔋 {unit.baterai}%</span>
                      )}
                    </div>
                    <div className="text-[10px] text-muted-foreground/60 mt-0.5">
                      Didaftarkan {formatDate(unit.createdAt)}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    {!isDeleting ? (
                      <>
                        <button
                          onClick={() => setEditUnit(unit)}
                          className="p-2 rounded-lg text-muted-foreground hover:text-blue-400 hover:bg-blue-400/10 transition-colors"
                          title="Edit unit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(unit.id)}
                          className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          title="Hapus unit"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <div className="flex items-center gap-1">
                        <span className="text-[11px] text-destructive font-semibold mr-1">Yakin hapus?</span>
                        <button
                          onClick={() => handleDelete(unit.id)}
                          disabled={deleteUnit.isPending}
                          className="px-2.5 py-1.5 bg-destructive text-destructive-foreground text-xs font-bold rounded-lg hover:bg-destructive/80 transition-colors disabled:opacity-50"
                        >
                          {deleteUnit.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "Hapus"}
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-2.5 py-1.5 bg-secondary text-muted-foreground text-xs rounded-lg hover:bg-secondary/80 transition-colors"
                        >
                          Batal
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Dialog */}
      {editUnit && (
        <EditDialog
          unit={editUnit}
          onClose={() => setEditUnit(null)}
          onSaved={handleEditSaved}
        />
      )}
    </div>
  );
}
