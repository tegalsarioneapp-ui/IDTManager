import { useEffect, useMemo, useState } from "react";
import {
  getGetDashboardQueryKey,
  getListUnitsQueryKey,
  useCompleteQc,
  useDeleteUnit,
  useListUnits,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  Battery,
  Check,
  ChevronsUpDown,
  ClipboardCheck,
  DollarSign,
  ShieldCheck,
  Trash2,
  Wrench,
  X,
} from "lucide-react";

import { useToast } from "@/hooks/use-toast";
import { cn, formatDate, formatRupiah } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

const CHECKLIST_TEMPLATE = {
  PHYSICAL: [
    { itemKey: "body-frame", itemLabel: "Body/frame alignment and hinge tension" },
    { itemKey: "keyboard-trackpad", itemLabel: "Keyboard and trackpad full key/gesture response" },
    { itemKey: "ports-external", itemLabel: "External casing, ports, and screw integrity" },
  ],
  DISPLAY: [
    { itemKey: "lcd-panel", itemLabel: "Panel uniformity (dead pixel, pressure mark, bleed)" },
    { itemKey: "brightness-color", itemLabel: "Brightness control and color consistency" },
    { itemKey: "webcam-mic", itemLabel: "Webcam clarity and microphone input" },
  ],
  HARDWARE_IO: [
    { itemKey: "storage-health", itemLabel: "SSD/NVMe SMART health and thermal profile" },
    { itemKey: "memory-stability", itemLabel: "RAM capacity detection and memory stability" },
    { itemKey: "io-connectivity", itemLabel: "USB/HDMI/audio/Wi-Fi/Bluetooth functional test" },
  ],
  PERFORMANCE_SOFTWARE: [
    { itemKey: "boot-performance", itemLabel: "Boot and shutdown within benchmark threshold" },
    { itemKey: "os-activation", itemLabel: "OS activation, updates, and essential drivers" },
    { itemKey: "stress-thermal", itemLabel: "Stress test and thermal throttling behavior" },
  ],
} as const;

type CategoryKey = keyof typeof CHECKLIST_TEMPLATE;
type ChecklistStatus = "PASS" | "FAIL" | "N/A";

type ChecklistFormState = Record<
  string,
  {
    category: CategoryKey;
    itemLabel: string;
    status: ChecklistStatus;
    sparepartId: number | null;
    notes: string;
  }
>;

type Sparepart = {
  id: number;
  sku: string;
  jenisBarang: string;
  hargaBeli: number;
  stock: number;
  tanggal: string;
};

const categoryLabel: Record<CategoryKey, string> = {
  PHYSICAL: "Physical",
  DISPLAY: "Display",
  HARDWARE_IO: "Hardware / IO",
  PERFORMANCE_SOFTWARE: "Performance / Software",
};

function buildChecklistInitialState(): ChecklistFormState {
  const state: ChecklistFormState = {};

  (Object.keys(CHECKLIST_TEMPLATE) as CategoryKey[]).forEach((category) => {
    CHECKLIST_TEMPLATE[category].forEach((item) => {
      state[item.itemKey] = {
        category,
        itemLabel: item.itemLabel,
        status: "PASS",
        sparepartId: null,
        notes: "",
      };
    });
  });

  return state;
}

export default function QcList() {
  const { data: units, isLoading, error } = useListUnits({ status: "PROSES" });
  const [selectedUnit, setSelectedUnit] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const deleteUnit = useDeleteUnit();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleDelete = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (confirmDeleteId === id) {
      deleteUnit.mutate(
        { id },
        {
          onSuccess: () => {
            toast({ title: "Unit dihapus", description: "Unit berhasil dihapus dari antrean." });
            queryClient.invalidateQueries({ queryKey: getListUnitsQueryKey() });
            queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
            setConfirmDeleteId(null);
          },
          onError: () => {
            toast({ title: "Gagal menghapus", variant: "destructive" });
            setConfirmDeleteId(null);
          },
        },
      );
    } else {
      setConfirmDeleteId(id);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse">Memuat antrean QC...</div>;
  }

  if (error) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <p className="text-lg font-bold text-destructive mb-1">Gagal memuat data QC</p>
        <p className="text-sm">Periksa koneksi server dan muat ulang halaman.</p>
      </div>
    );
  }

  if (selectedUnit) {
    return <QcForm id={selectedUnit} onBack={() => setSelectedUnit(null)} />;
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
      <header className="flex items-center justify-between rounded-2xl border border-border bg-card p-5">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">QC Workbench</h1>
          <p className="text-muted-foreground mt-1">Professional refurbishment inspection queue.</p>
        </div>
        <div className="bg-amber-500/15 text-amber-700 dark:text-amber-300 px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-2">
          <Wrench className="w-4 h-4" />
          {units?.length || 0} Unit Pending
        </div>
      </header>

      {!units || units.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center flex flex-col items-center">
          <Check className="w-12 h-12 text-emerald-500 mb-3 opacity-20" />
          <h3 className="text-lg font-semibold">All clear</h3>
          <p className="text-muted-foreground">Tidak ada unit yang menunggu QC saat ini.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {units.map((unit) => (
            <div
              key={unit.id}
              onClick={() => {
                setConfirmDeleteId(null);
                setSelectedUnit(unit.id);
              }}
              className="bg-card border border-border hover:border-primary/50 p-5 rounded-xl cursor-pointer transition-all hover:shadow-[0_8px_30px_-18px_rgba(0,0,0,0.3)] group"
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">{unit.tipe}</h3>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{formatDate(unit.createdAt)}</span>
                  {confirmDeleteId === unit.id ? (
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => handleDelete(e, unit.id)}
                        disabled={deleteUnit.isPending}
                        className="text-xs bg-destructive text-destructive-foreground px-2 py-1 rounded font-semibold hover:bg-destructive/80 transition-colors"
                      >
                        Yakin?
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmDeleteId(null);
                        }}
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
  const unit = units?.find((u) => u.id === id);
  const completeQc = useCompleteQc();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [baterai, setBaterai] = useState<number>(85);
  const [fisik, setFisik] = useState<string>("Refurbished Grade A");
  const [appTambahan, setAppTambahan] = useState<string>("");
  const [activeTab, setActiveTab] = useState<CategoryKey>("PHYSICAL");

  const [spareparts, setSpareparts] = useState<Sparepart[]>([]);
  const [loadingSpareparts, setLoadingSpareparts] = useState(false);
  const [checklistState, setChecklistState] = useState<ChecklistFormState>(() => buildChecklistInitialState());

  useEffect(() => {
    setChecklistState(buildChecklistInitialState());
  }, [id]);

  useEffect(() => {
    const run = async () => {
      setLoadingSpareparts(true);
      try {
        const res = await fetch("/api/spareparts?limit=500", { credentials: "include" });
        if (!res.ok) throw new Error("Gagal memuat sparepart");
        const data: Sparepart[] = await res.json();
        setSpareparts(data.filter((item) => item.stock > 0));
      } catch {
        setSpareparts([]);
      } finally {
        setLoadingSpareparts(false);
      }
    };

    void run();
  }, []);

  const selectedFailItems = useMemo(
    () => Object.entries(checklistState).filter(([, value]) => value.status === "FAIL"),
    [checklistState],
  );

  const sparepartById = useMemo(
    () => new Map(spareparts.map((item) => [item.id, item])),
    [spareparts],
  );

  const totalSparepartCost = useMemo(() => {
    return selectedFailItems.reduce((total, [, item]) => {
      if (!item.sparepartId) return total;
      return total + (sparepartById.get(item.sparepartId)?.hargaBeli ?? 0);
    }, 0);
  }, [selectedFailItems, sparepartById]);

  const restorationCost = (unit?.hargaBeli ?? 0) + totalSparepartCost;

  const handleStatusChange = (itemKey: string, status: ChecklistStatus) => {
    setChecklistState((prev) => ({
      ...prev,
      [itemKey]: {
        ...prev[itemKey],
        status,
        sparepartId: status === "FAIL" ? prev[itemKey].sparepartId : null,
      },
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const failWithoutSparepart = selectedFailItems.find(([, item]) => !item.sparepartId);
    if (failWithoutSparepart) {
      toast({
        title: "Sparepart wajib diisi",
        description: `Item gagal \"${failWithoutSparepart[1].itemLabel}\" harus pilih sparepart pengganti.`,
        variant: "destructive",
      });
      return;
    }

    const checklistItems = Object.entries(checklistState).map(([itemKey, value]) => ({
      category: value.category,
      itemKey,
      itemLabel: value.itemLabel,
      status: value.status,
      sparepartId: value.status === "FAIL" ? value.sparepartId : undefined,
      notes: value.notes ? value.notes : undefined,
    }));

    completeQc.mutate(
      {
        id,
        data: {
          baterai,
          fisik,
          appTambahan: appTambahan || undefined,
          checklistItems,
        },
      },
      {
        onSuccess: () => {
          toast({
            title: "QC selesai",
            description: "Checklist tersimpan, stok sparepart terpotong, unit berpindah ke READY.",
          });
          queryClient.invalidateQueries({ queryKey: getListUnitsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
          onBack();
        },
        onError: (err: any) => {
          toast({
            title: "Gagal menyimpan QC",
            description: err?.error ?? "Periksa data checklist dan coba lagi.",
            variant: "destructive",
          });
        },
      },
    );
  };

  if (!unit) return null;

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      <header className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 bg-secondary rounded-lg hover:bg-secondary/80 text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">QC Refurbishment Form</h1>
            <p className="text-primary font-medium">{unit.tipe}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Initial Cost</p>
          <p className="text-lg font-semibold">{formatRupiah(unit.hargaBeli)}</p>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Sparepart Cost</p>
            <p className="text-xl font-semibold mt-1">{formatRupiah(totalSparepartCost)}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Restoration Cost</p>
            <p className="text-xl font-semibold mt-1">{formatRupiah(restorationCost)}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Failed Checks</p>
            <p className="text-xl font-semibold mt-1">{selectedFailItems.length} item</p>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-4 lg:col-span-2 space-y-4">
            <h2 className="font-semibold flex items-center gap-2">
              <ClipboardCheck className="w-4 h-4 text-primary" />
              Detailed International QC Checklist
            </h2>

            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as CategoryKey)} className="space-y-4">
              <TabsList className="h-auto w-full grid grid-cols-2 gap-1 md:grid-cols-4">
                {(Object.keys(CHECKLIST_TEMPLATE) as CategoryKey[]).map((category) => (
                  <TabsTrigger key={category} value={category} className="text-xs md:text-sm py-2">
                    {categoryLabel[category]}
                  </TabsTrigger>
                ))}
              </TabsList>

              {(Object.keys(CHECKLIST_TEMPLATE) as CategoryKey[]).map((category) => (
                <TabsContent key={category} value={category} className="space-y-3 mt-0">
                  {CHECKLIST_TEMPLATE[category].map((item) => {
                    const current = checklistState[item.itemKey];
                    return (
                      <div key={item.itemKey} className="rounded-lg border border-border p-4 bg-background/60 space-y-3">
                        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                          <p className="text-sm font-medium text-foreground">{item.itemLabel}</p>

                          <div className="inline-flex rounded-lg border border-border overflow-hidden">
                            {(["PASS", "FAIL", "N/A"] as ChecklistStatus[]).map((status) => (
                              <button
                                key={status}
                                type="button"
                                onClick={() => handleStatusChange(item.itemKey, status)}
                                className={cn(
                                  "px-3 py-1.5 text-xs font-semibold transition-colors",
                                  current.status === status
                                    ? status === "PASS"
                                      ? "bg-emerald-500 text-white"
                                      : status === "FAIL"
                                        ? "bg-red-500 text-white"
                                        : "bg-slate-500 text-white"
                                    : "bg-transparent text-muted-foreground hover:bg-secondary",
                                )}
                              >
                                {status}
                              </button>
                            ))}
                          </div>
                        </div>

                        {current.status === "FAIL" ? (
                          <div className="grid gap-3 md:grid-cols-2">
                            <SparepartPicker
                              itemKey={item.itemKey}
                              currentSparepartId={current.sparepartId}
                              spareparts={spareparts}
                              loading={loadingSpareparts}
                              onSelect={(sparepartId) => {
                                setChecklistState((prev) => ({
                                  ...prev,
                                  [item.itemKey]: { ...prev[item.itemKey], sparepartId },
                                }));
                              }}
                            />
                            <input
                              value={current.notes}
                              onChange={(event) => {
                                const notes = event.target.value;
                                setChecklistState((prev) => ({
                                  ...prev,
                                  [item.itemKey]: { ...prev[item.itemKey], notes },
                                }));
                              }}
                              placeholder="Catatan teknisi (opsional)"
                              className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                            />
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </TabsContent>
              ))}
            </Tabs>
          </div>

          <div className="rounded-xl border border-border bg-card p-4 space-y-4 h-fit">
            <h2 className="font-semibold flex items-center gap-2 border-b border-border pb-3">
              <ShieldCheck className="w-4 h-4 text-primary" />
              Final Condition
            </h2>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Battery className="w-4 h-4 text-primary" /> Battery Health (%)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={baterai}
                  onChange={(e) => setBaterai(parseInt(e.target.value, 10))}
                  className="flex-1 accent-primary"
                />
                <span className="font-mono bg-secondary px-2 py-1 rounded-md min-w-[58px] text-center text-sm font-semibold">
                  {baterai}%
                </span>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-border">
              <label className="text-sm font-medium">Physical Grade</label>
              <input
                value={fisik}
                onChange={(e) => setFisik(e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="Contoh: Refurbished Grade A"
              />
            </div>

            <div className="space-y-2 pt-2 border-t border-border">
              <label className="text-sm font-medium">Installed Software Notes</label>
              <input
                value={appTambahan}
                onChange={(e) => setAppTambahan(e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="Contoh: Office 365, Adobe Reader, BIOS update"
              />
            </div>

            <div className="rounded-lg border border-border bg-secondary/60 p-3 text-sm">
              <p className="font-medium flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-primary" />
                Cost Formula
              </p>
              <p className="text-muted-foreground mt-1">Total restorasi dihitung otomatis: Harga Beli + total sparepart item FAIL.</p>
            </div>

            <Button type="submit" disabled={completeQc.isPending} className="w-full">
              {completeQc.isPending ? "Menyimpan QC..." : "Simpan QC dan Tandai READY"}
            </Button>
          </div>
        </section>
      </form>
    </div>
  );
}

function SparepartPicker({
  itemKey,
  currentSparepartId,
  spareparts,
  loading,
  onSelect,
}: {
  itemKey: string;
  currentSparepartId: number | null;
  spareparts: Sparepart[];
  loading: boolean;
  onSelect: (sparepartId: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = spareparts.find((item) => item.id === currentSparepartId);

  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground">Replacement Sparepart</p>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="w-full h-10 rounded-lg border border-border bg-secondary px-3 text-left text-sm flex items-center justify-between"
            aria-label={`Pilih sparepart untuk ${itemKey}`}
          >
            <span className={cn("truncate", selected ? "text-foreground" : "text-muted-foreground") }>
              {selected
                ? `${selected.sku} - ${selected.jenisBarang} (${formatRupiah(selected.hargaBeli)}, stok ${selected.stock})`
                : "Pilih sparepart..."}
            </span>
            <ChevronsUpDown className="h-4 w-4 opacity-60" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-[460px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Cari SKU atau nama sparepart..." />
            <CommandList>
              <CommandEmpty>{loading ? "Memuat sparepart..." : "Sparepart tidak ditemukan"}</CommandEmpty>
              <CommandGroup>
                {spareparts.map((sparepart) => (
                  <CommandItem
                    key={sparepart.id}
                    value={`${sparepart.sku} ${sparepart.jenisBarang}`}
                    onSelect={() => {
                      onSelect(sparepart.id);
                      setOpen(false);
                    }}
                  >
                    <div className="flex w-full items-center justify-between gap-3">
                      <span className="truncate">{sparepart.sku} - {sparepart.jenisBarang}</span>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {formatRupiah(sparepart.hargaBeli)} | stok {sparepart.stock}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
