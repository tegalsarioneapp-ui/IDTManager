import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateUnit } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Laptop, Cpu, AlertCircle, Package, DollarSign } from "lucide-react";
import { formatRupiah } from "@/lib/utils";

const formSchema = z.object({
  tipe: z.string().min(1, "Tipe wajib diisi"),
  spek: z.string().min(1, "Spesifikasi wajib diisi"),
  minus: z.string().min(1, "Kondisi minus wajib diisi, tulis 'Mulus' jika tidak ada"),
  kelengkapan: z.string().min(1, "Kelengkapan wajib diisi"),
  hargaBeli: z.coerce.number().min(0, "Harga beli tidak valid"),
});

type FormValues = z.infer<typeof formSchema>;

export default function Beli() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const createUnit = useCreateUnit();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tipe: "",
      spek: "",
      minus: "",
      kelengkapan: "Unit, Charger",
      hargaBeli: 0,
    },
  });

  const onSubmit = (data: FormValues) => {
    createUnit.mutate({ data }, {
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
            <input 
              {...form.register("tipe")} 
              className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              placeholder="Contoh: Asus VivoBook 14 X412FA"
            />
            {form.formState.errors.tipe && <p className="text-destructive text-xs">{form.formState.errors.tipe.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold flex items-center gap-2">
              <Cpu className="w-4 h-4 text-primary" /> Spesifikasi Utama
            </label>
            <textarea 
              {...form.register("spek")} 
              className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-sm min-h-[80px] focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              placeholder="Contoh: Core i5-8265U, RAM 8GB, SSD 512GB, Intel UHD"
            />
            {form.formState.errors.spek && <p className="text-destructive text-xs">{form.formState.errors.spek.message}</p>}
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
