import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { formatDate, formatRupiah } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { getListUnitsQueryKey } from "@workspace/api-client-react";
import { Wrench, CalendarDays } from "lucide-react";

const buySparepartSchema = z.object({
  jenisBarang: z.string().min(1, "Jenis Barang wajib diisi"),
  hargaBeli: z.coerce.number().min(0, "Harga Beli tidak valid"),
  stock: z.coerce.number().int().min(1, "Stock minimal 1"),
  tanggal: z.string().optional(),
});

type BuySparepartValues = z.infer<typeof buySparepartSchema>;

const qcUsageSchema = z.object({
  sparepartId: z.coerce.number().positive("Pilih sparepart"),
  hargaPenggantian: z.coerce.number().min(0, "Harga Penggantian tidak valid"),
  catatan: z.string().optional(),
});

type QcUsageValues = z.infer<typeof qcUsageSchema>;

type Sparepart = {
  id: number;
  sku: string;
  jenisBarang: string;
  hargaBeli: number;
  stock: number;
  tanggal: string;
};

export default function SparepartsPage() {
  const [activeTab, setActiveTab] = useState("beli");
  const [spareparts, setSpareparts] = useState<Sparepart[]>([]);
  const [isLoadingSpareparts, setIsLoadingSpareparts] = useState(false);
  const [sparepartError, setSparepartError] = useState<string | null>(null);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    void handleLoadSpareparts();
  }, []);

  const buyForm = useForm<BuySparepartValues>({
    resolver: zodResolver(buySparepartSchema),
    defaultValues: {
      jenisBarang: "",
      hargaBeli: 0,
      stock: 1,
      tanggal: new Date().toISOString().slice(0, 10),
    },
  });

  const qcForm = useForm<QcUsageValues>({
    resolver: zodResolver(qcUsageSchema),
    defaultValues: {
      sparepartId: 0,
      hargaPenggantian: 0,
      catatan: "",
    },
  });

  const selectedSparepart = useMemo(() => {
    return spareparts.find((item) => item.id === Number(qcForm.watch("sparepartId")));
  }, [qcForm.watch("sparepartId"), spareparts]);

  const handleLoadSpareparts = async () => {
    setIsLoadingSpareparts(true);
    setSparepartError(null);

    try {
      const res = await fetch("/api/spareparts?limit=200", { credentials: "include" });
      if (!res.ok) {
        throw new Error("Gagal memuat sparepart");
      }
      const data = await res.json();
      setSpareparts(data);
    } catch (error) {
      setSparepartError((error as Error)?.message || "Terjadi kesalahan saat mengambil data");
    } finally {
      setIsLoadingSpareparts(false);
    }
  };

  const handleBuySubmit = async (values: BuySparepartValues) => {
    try {
      const res = await fetch("/api/spareparts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, tanggal: values.tanggal }),
        credentials: "include",
      });

      if (!res.ok) {
        const errorBody = await res.json();
        throw new Error(errorBody?.error || "Gagal menyimpan sparepart");
      }

      const created = await res.json();
      toast({ title: "Sparepart disimpan", description: `${created.jenisBarang} berhasil ditambahkan dengan SKU ${created.sku}.` });
      buyForm.reset({ jenisBarang: "", hargaBeli: 0, stock: 1, tanggal: new Date().toISOString().slice(0, 10) });
      await handleLoadSpareparts();
      queryClient.invalidateQueries({ queryKey: getListUnitsQueryKey() });
    } catch (error) {
      toast({ title: "Gagal menyimpan", description: (error as Error).message, variant: "destructive" });
    }
  };

  const handleQcSubmit = async (values: QcUsageValues) => {
    try {
      const res = await fetch("/api/spareparts/qc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
        credentials: "include",
      });

      if (!res.ok) {
        const errorBody = await res.json();
        throw new Error(errorBody?.error || "Gagal menyimpan QC");
      }

      await res.json();
      toast({ title: "QC Penggantian tercatat", description: "Data QC penggantian berhasil disimpan." });
      qcForm.reset({ sparepartId: 0, hargaPenggantian: 0, catatan: "" });
      await handleLoadSpareparts();
    } catch (error) {
      toast({ title: "Gagal menyimpan QC", description: (error as Error).message, variant: "destructive" });
    }
  };

  const handleSelectSparepart = (id: number) => {
    const selected = spareparts.find((item) => item.id === id);
    if (!selected) return;
    qcForm.setValue("sparepartId", selected.id);
    qcForm.setValue("hargaPenggantian", selected.hargaBeli);
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-8">
      <header className="space-y-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Sparepart Purchase & QC Replacement</h1>
            <p className="text-muted-foreground mt-1">Input pembelian sparepart dan catat penggantian QC secara terpisah.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleLoadSpareparts} variant="secondary" disabled={isLoadingSpareparts}>
              {isLoadingSpareparts ? "Memuat..." : "Segarkan Spareparts"}
            </Button>
            <Button onClick={() => setActiveTab("beli")}>Tab Beli</Button>
            <Button onClick={() => setActiveTab("qc")}>Tab QC</Button>
          </div>
        </div>
        {sparepartError ? <p className="text-destructive text-sm">{sparepartError}</p> : null}
      </header>

      <Tabs defaultValue={activeTab} value={activeTab} onValueChange={(value) => setActiveTab(value)} className="space-y-6">
        <TabsList>
          <TabsTrigger value="beli">Beli Sparepart</TabsTrigger>
          <TabsTrigger value="qc">QC Penggantian</TabsTrigger>
        </TabsList>

        <TabsContent value="beli" className="rounded-xl border border-border bg-card p-6">
          <form onSubmit={buyForm.handleSubmit(handleBuySubmit)} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="jenisBarang">Jenis Barang</Label>
                <Input id="jenisBarang" placeholder="Contoh: Kabel HDMI, Baterai" {...buyForm.register("jenisBarang")} />
                {buyForm.formState.errors.jenisBarang ? <p className="text-destructive text-sm">{buyForm.formState.errors.jenisBarang.message}</p> : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="hargaBeli">Harga Beli</Label>
                <Input id="hargaBeli" type="number" placeholder="0" {...buyForm.register("hargaBeli")} />
                {buyForm.formState.errors.hargaBeli ? <p className="text-destructive text-sm">{buyForm.formState.errors.hargaBeli.message}</p> : null}
                {buyForm.watch("hargaBeli") > 0 ? <p className="text-sm text-primary">{formatRupiah(buyForm.watch("hargaBeli"))}</p> : null}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="stock">Jumlah Stock</Label>
                <Input id="stock" type="number" min={1} placeholder="1" {...buyForm.register("stock")} />
                {buyForm.formState.errors.stock ? <p className="text-destructive text-sm">{buyForm.formState.errors.stock.message}</p> : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="tanggal">Tanggal</Label>
                <Input id="tanggal" type="date" {...buyForm.register("tanggal")} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>SKU Backend</Label>
              <div className="rounded-md border border-border bg-secondary px-4 py-3 text-sm text-muted-foreground">Dihasilkan otomatis setelah simpan</div>
            </div>

            <Button type="submit">Simpan Pembelian</Button>
          </form>
        </TabsContent>

        <TabsContent value="qc" className="rounded-xl border border-border bg-card p-6">
          <form onSubmit={qcForm.handleSubmit(handleQcSubmit)} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sparepartId">Pilih Sparepart</Label>
                <select
                  id="sparepartId"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm shadow-sm"
                  value={qcForm.watch("sparepartId")}
                  onChange={(event) => handleSelectSparepart(Number(event.target.value))}
                >
                  <option value={0}>Pilih sparepart...</option>
                  {spareparts.map((sparepart) => (
                    <option key={sparepart.id} value={sparepart.id}>
                      {sparepart.sku} — {sparepart.jenisBarang}
                    </option>
                  ))}
                </select>
                {qcForm.formState.errors.sparepartId ? <p className="text-destructive text-sm">{qcForm.formState.errors.sparepartId.message}</p> : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="hargaPenggantian">Harga Penggantian</Label>
                <Input
                  id="hargaPenggantian"
                  type="number"
                  placeholder="0"
                  {...qcForm.register("hargaPenggantian")}
                />
                {qcForm.formState.errors.hargaPenggantian ? <p className="text-destructive text-sm">{qcForm.formState.errors.hargaPenggantian.message}</p> : null}
                {selectedSparepart ? <p className="text-sm text-primary">Harga pembelian: {formatRupiah(selectedSparepart.hargaBeli)}</p> : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="catatan">Catatan Penggantian</Label>
                <Input id="catatan" placeholder="Opsional" {...qcForm.register("catatan")} />
              </div>
            </div>

            <div className="rounded-xl border border-border bg-secondary/70 p-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2 font-semibold text-foreground">
                <Wrench className="h-4 w-4" />
                Info QC Penggantian
              </div>
              <p className="mt-1">Pilih sparepart yang tersedia, lalu gunakan harga beli sebagai referensi harga penggantian.</p>
            </div>

            <Button type="submit">Simpan QC Penggantian</Button>
          </form>
        </TabsContent>
      </Tabs>

      <section className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-xl font-bold">Daftar Spareparts</h2>
            <p className="text-sm text-muted-foreground">Data sparepart terbaru tersedia di sini.</p>
          </div>
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            {spareparts.length} item
          </div>
        </div>

        {isLoadingSpareparts ? (
          <div className="text-center py-10 text-sm text-muted-foreground">Memuat sparepart...</div>
        ) : spareparts.length === 0 ? (
          <div className="text-center py-10 text-sm text-muted-foreground">Belum ada sparepart. Klik tombol Segarkan Spareparts untuk memuat data.</div>
        ) : (
          <div className="grid gap-3">
            {spareparts.map((item) => (
              <div key={item.id} className="rounded-xl border border-border p-4 bg-background">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="font-semibold">{item.sku}</div>
                    <div className="text-sm text-muted-foreground">{item.jenisBarang}</div>
                  </div>
                  <div className="text-sm text-muted-foreground">{formatDate(item.tanggal)}</div>
                </div>
                <div className="mt-3 text-sm text-foreground">Harga Beli: {formatRupiah(item.hargaBeli)}</div>
                <div className="mt-1 text-xs text-muted-foreground">Stock tersedia: {item.stock}</div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
