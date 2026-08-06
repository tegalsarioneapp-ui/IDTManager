import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateUnit } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Laptop, Cpu, AlertCircle, Package, DollarSign, MemoryStick, HardDrive, Monitor, ChevronsUpDown } from "lucide-react";
import { formatRupiah } from "@/lib/utils";

const formSchema = z.object({
  tipe: z.string().min(1, "Tipe wajib diisi"),
  cpu: z.string().min(1, "CPU wajib diisi"),
  ram: z.string().min(1, "RAM wajib diisi"),
  storage: z.string().min(1, "Storage wajib diisi"),
  gpu: z.string().min(1, "GPU wajib diisi"),
  display: z.string().min(1, "Display wajib diisi"),
  minus: z.string().min(1, "Kondisi minus wajib diisi, tulis 'Mulus' jika tidak ada"),
  kelengkapan: z.string().min(1, "Kelengkapan wajib diisi"),
  hargaBeli: z.coerce.number().min(0, "Harga beli tidak valid"),
});

type FormValues = z.infer<typeof formSchema>;

type MasterLaptopSuggestion = {
  id: number;
  brand: string;
  model: string;
  defaultCpu: string;
  defaultRam: string;
  defaultStorage: string;
  defaultGpu: string;
  defaultDisplay: string;
};

async function extractApiErrorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const body = await res.json();
    if (body && typeof body.error === "string" && body.error.trim().length > 0) {
      return body.error;
    }
  } catch {
    // Ignore invalid JSON body and use fallback.
  }

  return fallback;
}

export default function Beli() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const createUnit = useCreateUnit();
  const modelSearchBoxRef = useRef<HTMLDivElement>(null);

  const [modelSearchTerm, setModelSearchTerm] = useState("");
  const [modelSuggestions, setModelSuggestions] = useState<MasterLaptopSuggestion[]>([]);
  const [isSearchingModel, setIsSearchingModel] = useState(false);
  const [modelSearchError, setModelSearchError] = useState<string | null>(null);
  const [showModelSuggestion, setShowModelSuggestion] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tipe: "",
      cpu: "",
      ram: "",
      storage: "",
      gpu: "",
      display: "",
      minus: "",
      kelengkapan: "Unit, Charger",
      hargaBeli: 0,
    },
  });

  const tipeValue = form.watch("tipe");

  useEffect(() => {
    setModelSearchTerm(tipeValue ?? "");
  }, [tipeValue]);

  useEffect(() => {
    const trimmed = modelSearchTerm.trim();
    if (trimmed.length < 2) {
      setModelSuggestions([]);
      setModelSearchError(null);
      setIsSearchingModel(false);
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      setIsSearchingModel(true);
      setModelSearchError(null);

      try {
        const params = new URLSearchParams({ q: trimmed, limit: "8" });
        const res = await fetch(`/api/master-laptops/search?${params.toString()}`, {
          credentials: "include",
          signal: controller.signal,
        });

        if (!res.ok) {
          throw new Error(await extractApiErrorMessage(res, "Gagal mencari model laptop"));
        }

        const data = (await res.json()) as MasterLaptopSuggestion[];
        setModelSuggestions(data);
      } catch (error) {
        if (!controller.signal.aborted) {
          setModelSuggestions([]);
          setModelSearchError((error as Error)?.message ?? "Gagal mencari model laptop");
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsSearchingModel(false);
        }
      }
    }, 300);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [modelSearchTerm]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!modelSearchBoxRef.current) return;
      if (!modelSearchBoxRef.current.contains(event.target as Node)) {
        setShowModelSuggestion(false);
      }
    };

    window.addEventListener("mousedown", handleClickOutside);
    return () => window.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectSuggestion = (item: MasterLaptopSuggestion) => {
    form.setValue("tipe", `${item.brand} ${item.model}`, { shouldDirty: true, shouldValidate: true });
    form.setValue("cpu", item.defaultCpu, { shouldDirty: true, shouldValidate: true });
    form.setValue("ram", item.defaultRam, { shouldDirty: true, shouldValidate: true });
    form.setValue("storage", item.defaultStorage, { shouldDirty: true, shouldValidate: true });
    form.setValue("gpu", item.defaultGpu, { shouldDirty: true, shouldValidate: true });
    form.setValue("display", item.defaultDisplay, { shouldDirty: true, shouldValidate: true });
    setShowModelSuggestion(false);
  };

  const onSubmit = (data: FormValues) => {
    const spek = [
      `CPU: ${data.cpu}`,
      `RAM: ${data.ram}`,
      `Storage: ${data.storage}`,
      `GPU: ${data.gpu}`,
      `Display: ${data.display}`,
    ].join(", ");

    createUnit.mutate({ data: {
      tipe: data.tipe,
      spek,
      minus: data.minus,
      kelengkapan: data.kelengkapan,
      hargaBeli: data.hargaBeli,
    } }, {
      onSuccess: () => {
        toast({
          title: "Unit Berhasil Ditambahkan",
          description: `${data.tipe} masuk ke antrean QC.`,
        });
        setLocation("/qc");
      },
      onError: (err) => {
        toast({
          title: "Gagal menyimpan",
          description: (err as any)?.error || "Terjadi kesalahan",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-foreground">Input Unit Masuk</h1>
        <p className="text-muted-foreground mt-1">Catat laptop baru yang dibeli untuk direfurbish.</p>
      </header>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 bg-card p-5 md:p-6 rounded-xl border border-border shadow-sm">
        
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold flex items-center gap-2">
              <Laptop className="w-4 h-4 text-primary" /> Tipe Laptop
            </label>
            <div className="relative" ref={modelSearchBoxRef}>
              <input
                value={tipeValue}
                onChange={(event) => {
                  form.setValue("tipe", event.target.value, { shouldDirty: true, shouldValidate: true });
                  setShowModelSuggestion(true);
                }}
                onFocus={() => setShowModelSuggestion(true)}
                className="w-full bg-secondary border border-border rounded-lg px-4 py-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                placeholder="Ketik merek atau model, contoh: ThinkPad T14"
              />
              <ChevronsUpDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />

              {showModelSuggestion ? (
                <div className="absolute z-20 mt-2 w-full rounded-lg border border-border bg-card shadow-lg overflow-hidden">
                  {isSearchingModel ? (
                    <div className="px-4 py-3 text-xs text-muted-foreground">Mencari model...</div>
                  ) : modelSuggestions.length > 0 ? (
                    <div className="max-h-64 overflow-y-auto">
                      {modelSuggestions.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleSelectSuggestion(item)}
                          className="w-full text-left px-4 py-3 hover:bg-secondary/70 transition-colors border-b last:border-b-0 border-border"
                        >
                          <p className="text-sm font-semibold text-foreground">{item.brand} {item.model}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{item.defaultCpu} • {item.defaultRam} • {item.defaultStorage}</p>
                        </button>
                      ))}
                    </div>
                  ) : modelSearchTerm.trim().length >= 2 ? (
                    <div className="px-4 py-3 text-xs text-muted-foreground">Model tidak ditemukan</div>
                  ) : (
                    <div className="px-4 py-3 text-xs text-muted-foreground">Ketik minimal 2 karakter untuk mencari model</div>
                  )}
                </div>
              ) : null}
            </div>

            {modelSearchError ? <p className="text-destructive text-xs">{modelSearchError}</p> : null}
            {form.formState.errors.tipe && <p className="text-destructive text-xs">{form.formState.errors.tipe.message}</p>}
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-semibold flex items-center gap-2">
                <Cpu className="w-4 h-4 text-primary" /> CPU
              </label>
              <input
                {...form.register("cpu")}
                className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                placeholder="Contoh: Intel Core i5-1135G7"
              />
              {form.formState.errors.cpu && <p className="text-destructive text-xs">{form.formState.errors.cpu.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold flex items-center gap-2">
                <MemoryStick className="w-4 h-4 text-primary" /> RAM
              </label>
              <input
                {...form.register("ram")}
              className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                placeholder="Contoh: 16GB DDR4"
              />
              {form.formState.errors.ram && <p className="text-destructive text-xs">{form.formState.errors.ram.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-primary" /> Storage
              </label>
              <input
                {...form.register("storage")}
                className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                placeholder="Contoh: SSD 512GB NVMe"
              />
              {form.formState.errors.storage && <p className="text-destructive text-xs">{form.formState.errors.storage.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold flex items-center gap-2">
                <Monitor className="w-4 h-4 text-primary" /> GPU
              </label>
              <input
                {...form.register("gpu")}
                className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                placeholder="Contoh: Intel Iris Xe"
              />
              {form.formState.errors.gpu && <p className="text-destructive text-xs">{form.formState.errors.gpu.message}</p>}
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-semibold flex items-center gap-2">
                <Monitor className="w-4 h-4 text-primary" /> Display
              </label>
              <input
                {...form.register("display")}
                className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                placeholder="Contoh: 14 inci FHD IPS"
              />
              {form.formState.errors.display && <p className="text-destructive text-xs">{form.formState.errors.display.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-primary" /> Minus / Kondisi Awal
            </label>
            <input 
              {...form.register("minus")} 
              className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              placeholder="Contoh: Baterai drop, lecet pojok"
            />
            {form.formState.errors.minus && <p className="text-destructive text-xs">{form.formState.errors.minus.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold flex items-center gap-2">
              <Package className="w-4 h-4 text-primary" /> Kelengkapan
            </label>
            <input 
              {...form.register("kelengkapan")} 
              className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              placeholder="Unit, Charger, Tas"
            />
            {form.formState.errors.kelengkapan && <p className="text-destructive text-xs">{form.formState.errors.kelengkapan.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-primary" /> Harga Beli (Modal Awal)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">Rp</span>
              <input 
                type="number"
                {...form.register("hargaBeli")} 
                className="w-full bg-secondary border border-border rounded-lg pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-mono"
                placeholder="0"
              />
            </div>
            {form.formState.errors.hargaBeli && <p className="text-destructive text-xs">{form.formState.errors.hargaBeli.message}</p>}
            {form.watch("hargaBeli") > 0 && (
              <p className="text-xs text-primary font-medium mt-1">
                {formatRupiah(form.watch("hargaBeli"))}
              </p>
            )}
          </div>
        </div>

        <button 
          type="submit" 
          disabled={createUnit.isPending}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold py-4 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {createUnit.isPending ? "Menyimpan..." : "Simpan Unit"}
        </button>
      </form>
    </div>
  );
}
