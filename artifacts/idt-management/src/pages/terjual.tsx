import { useState } from "react";
import { useListUnits, useDeleteUnit, getListUnitsQueryKey, getGetDashboardQueryKey } from "@workspace/api-client-react";
import { formatRupiah, formatDate, cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, TrendingUp, CalendarDays, Wallet, Trash2, FileText, Receipt, Pencil, X, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { InvoicePrint } from "@/components/InvoicePrint";
import { KuitansiPrint } from "@/components/KuitansiPrint";

// ─── Edit Sale Dialog ──────────────────────────────────────────────────────────
interface EditUnit {
  id: number;
  tipe: string;
  namaPembeli?: string | null;
  nomorPembeli?: string | null;
  hargaJual?: number | null;
  tanggalJual?: string | null;
}

function EditSaleDialog({ unit, onClose, onSaved }: { unit: EditUnit; onClose: () => void; onSaved: () => void }) {
  const [namaPembeli, setNamaPembeli] = useState(unit.namaPembeli ?? "");
  const [nomorPembeli, setNomorPembeli] = useState(unit.nomorPembeli ?? "");
  const [hargaJual, setHargaJual] = useState(String(unit.hargaJual ?? ""));
  const [tanggalJual, setTanggalJual] = useState(
    unit.tanggalJual ? new Date(unit.tanggalJual).toISOString().split("T")[0] : new Date().toISOString().split("T")[0]
  );
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const { toast } = useToast();

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    const harga = Number(hargaJual.replace(/\D/g, ""));
    if (!harga || harga <= 0) { setErr("Harga jual tidak valid"); return; }
    setBusy(true);
    try {
      const res = await fetch(`/api/units/${unit.id}/jual`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ namaPembeli, nomorPembeli, hargaJual: harga, tanggalJual }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      toast({ title: "Data penjualan diperbarui" });
      onSaved();
      onClose();
    } catch (e: any) {
      setErr(e.message ?? "Gagal menyimpan");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md animate-in fade-in-0 zoom-in-95">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <h2 className="font-bold text-lg">Edit Data Penjualan</h2>
            <p className="text-xs text-muted-foreground">{unit.tipe}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-secondary rounded-lg transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSave} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Nama Pembeli</label>
            <input
              value={namaPembeli} onChange={e => setNamaPembeli(e.target.value)}
              placeholder="Nama pembeli"
              className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Nomor HP Pembeli</label>
            <input
              value={nomorPembeli} onChange={e => setNomorPembeli(e.target.value)}
              placeholder="cth: 08123456789"
              className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Harga Jual (Rp)</label>
            <input
              value={hargaJual} onChange={e => setHargaJual(e.target.value)}
              placeholder="cth: 3500000"
              inputMode="numeric"
              className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Tanggal Jual</label>
            <input
              type="date" value={tanggalJual} onChange={e => setTanggalJual(e.target.value)}
              className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary"
            />
          </div>
          {err && (
            <div className="bg-destructive/10 border border-destructive/30 text-destructive text-xs rounded-lg px-3 py-2.5">{err}</div>
          )}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 h-10 border border-border rounded-xl text-sm text-muted-foreground hover:bg-secondary transition-colors">
              Batal
            </button>
            <button type="submit" disabled={busy} className="flex-1 h-10 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Pencil className="w-4 h-4" />}
              {busy ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function TerjualList() {
  const { data: units, isLoading, error } = useListUnits({ status: "TERJUAL" });
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [invoiceUnitId, setInvoiceUnitId] = useState<number | null>(null);
  const [kuitansiUnitId, setKuitansiUnitId] = useState<number | null>(null);
  const [editUnit, setEditUnit] = useState<EditUnit | null>(null);
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

  const handleEditSaved = () => {
    queryClient.invalidateQueries({ queryKey: getListUnitsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
  };

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse">Memuat riwayat penjualan...</div>;
  }

  if (error) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <p className="text-lg font-bold text-destructive mb-1">Gagal memuat riwayat penjualan</p>
        <p className="text-sm">Periksa koneksi server dan muat ulang halaman.</p>
      </div>
    );
  }

  const sortedUnits = units?.slice().sort((a, b) =>
    new Date(b.tanggalJual || b.createdAt).getTime() - new Date(a.tanggalJual || a.createdAt).getTime()
  );

  const totalRealisasi = sortedUnits?.reduce((sum, u) => {
    return sum + ((u.hargaJual || 0) - (u.hargaBeli + u.biayaQc));
  }, 0) || 0;

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-8">
      <header className="flex flex-col gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Riwayat Terjual</h1>
          <p className="text-muted-foreground mt-1">Daftar unit yang sukses terjual dan realisasi profit.</p>
        </div>

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
              <div key={unit.id} className="bg-card border border-border rounded-xl overflow-hidden transition-all hover:bg-secondary/20">
                {/* Main info row */}
                <div className="p-4 md:p-5 flex flex-col md:flex-row gap-4 md:items-center justify-between">
                  <div className="space-y-1.5 flex-1">
                    <h3 className="font-bold text-lg text-foreground">{unit.tipe}</h3>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <CalendarDays className="w-3.5 h-3.5" />
                        {unit.tanggalJual ? formatDate(unit.tanggalJual) : '-'}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Wallet className="w-3.5 h-3.5" />
                        Modal: {formatRupiah(modal)}
                      </span>
                      {unit.namaPembeli && (
                        <span className="text-foreground font-medium">👤 {unit.namaPembeli}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 md:gap-4 justify-between md:justify-end border-t md:border-t-0 border-border pt-3 md:pt-0">
                    <div className="text-left md:text-right">
                      <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Harga Deal</div>
                      <div className="font-bold text-foreground text-lg font-mono">{formatRupiah(jual)}</div>
                    </div>

                    <div className={cn(
                      "px-3 py-1.5 rounded-lg text-right min-w-[100px]",
                      isProfit ? "bg-emerald-500/10 text-emerald-500" : "bg-destructive/10 text-destructive"
                    )}>
                      <div className="text-[10px] font-bold uppercase tracking-wider opacity-80">{isProfit ? "Profit" : "Rugi"}</div>
                      <div className="font-bold">{isProfit ? '+' : ''}{formatRupiah(profit)}</div>
                    </div>
                  </div>
                </div>

                {/* Action bar */}
                <div className="border-t border-border bg-secondary/30 px-4 py-2 flex items-center gap-1 flex-wrap">
                  <ActionBtn
                    icon={<Pencil className="w-3.5 h-3.5" />}
                    label="Edit"
                    onClick={() => setEditUnit({
                      id: unit.id, tipe: unit.tipe,
                      namaPembeli: unit.namaPembeli, nomorPembeli: unit.nomorPembeli,
                      hargaJual: unit.hargaJual, tanggalJual: unit.tanggalJual,
                    })}
                    color="blue"
                  />
                  <ActionBtn
                    icon={<FileText className="w-3.5 h-3.5" />}
                    label="Invoice"
                    onClick={() => setInvoiceUnitId(unit.id)}
                    color="default"
                  />
                  <ActionBtn
                    icon={<Receipt className="w-3.5 h-3.5" />}
                    label="Kuitansi"
                    onClick={() => setKuitansiUnitId(unit.id)}
                    color="emerald"
                  />

                  <div className="ml-auto">
                    {confirmDeleteId === unit.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleDelete(unit.id)}
                          disabled={deleteUnit.isPending}
                          className="text-xs bg-destructive text-destructive-foreground px-3 py-1.5 rounded-lg font-semibold hover:bg-destructive/80 transition-colors"
                        >
                          Yakin?
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="text-xs bg-secondary text-muted-foreground px-3 py-1.5 rounded-lg hover:bg-secondary/80 transition-colors"
                        >
                          Batal
                        </button>
                      </div>
                    ) : (
                      <ActionBtn
                        icon={<Trash2 className="w-3.5 h-3.5" />}
                        label="Hapus"
                        onClick={() => handleDelete(unit.id)}
                        color="red"
                      />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <InvoicePrint unitId={invoiceUnitId} onClose={() => setInvoiceUnitId(null)} />
      <KuitansiPrint unitId={kuitansiUnitId} onClose={() => setKuitansiUnitId(null)} />
      {editUnit && (
        <EditSaleDialog
          unit={editUnit}
          onClose={() => setEditUnit(null)}
          onSaved={handleEditSaved}
        />
      )}
    </div>
  );
}

function ActionBtn({ icon, label, onClick, color }: {
  icon: React.ReactNode; label: string; onClick: () => void;
  color: "default" | "blue" | "emerald" | "red";
}) {
  const colorMap = {
    default: "text-muted-foreground hover:text-primary hover:bg-primary/10",
    blue: "text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10",
    emerald: "text-muted-foreground hover:text-emerald-500 hover:bg-emerald-500/10",
    red: "text-muted-foreground hover:text-destructive hover:bg-destructive/10",
  };
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${colorMap[color]}`}
    >
      {icon}{label}
    </button>
  );
}
