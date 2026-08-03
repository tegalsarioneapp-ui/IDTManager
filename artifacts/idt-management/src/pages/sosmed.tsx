import { useState } from "react";
import { useListUnits, useGetUnitCaption, getGetUnitCaptionQueryKey } from "@workspace/api-client-react";
import { Share2, Copy, Check, Instagram, Image as ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function Sosmed() {
  const { data: units, isLoading: unitsLoading, error: unitsError } = useListUnits({ status: "READY" });
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const { data: captionData, isFetching: captionLoading, error: captionError } = useGetUnitCaption(selectedId!, {
    query: { 
      enabled: !!selectedId,
      queryKey: getGetUnitCaptionQueryKey(selectedId!)
    }
  });

  const handleCopy = () => {
    if (!captionData?.caption) return;
    navigator.clipboard.writeText(captionData.caption).then(() => {
      setCopied(true);
      toast({ title: "Tersalin!", description: "Caption berhasil disalin ke clipboard." });
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-foreground">Copywriting Sosmed</h1>
        <p className="text-muted-foreground mt-1">Generate caption otomatis untuk unit READY.</p>
      </header>

      <div className="bg-card border border-border p-5 md:p-6 rounded-2xl space-y-6">
        
        <div className="space-y-2">
          <label className="text-sm font-semibold flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-primary" /> Pilih Unit
          </label>
          {unitsLoading ? (
            <div className="h-12 bg-secondary animate-pulse rounded-lg w-full"></div>
          ) : (units?.length === 0) ? (
            <div className="p-4 bg-secondary text-muted-foreground rounded-lg text-sm text-center border border-border">
              Tidak ada unit READY. Selesaikan QC unit dulu.
            </div>
          ) : (
            <select
              className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground font-medium"
              value={selectedId || ""}
              onChange={(e) => setSelectedId(Number(e.target.value))}
            >
              <option value="" disabled>-- Pilih Unit Siap Jual --</option>
              {units?.map(unit => (
                <option key={unit.id} value={unit.id}>
                  {unit.tipe} (Baterai: {unit.baterai}%)
                </option>
              ))}
            </select>
          )}
        </div>

        {selectedId && (
          <div className="space-y-3 pt-6 border-t border-border relative">
            <label className="text-sm font-semibold flex items-center justify-between">
              <span className="flex items-center gap-2 text-primary">
                <Instagram className="w-4 h-4" /> Hasil Caption
              </span>
              {captionLoading && <span className="text-xs text-muted-foreground animate-pulse">Generating...</span>}
            </label>
            
            <div className="relative">
              <textarea 
                readOnly
                value={captionData?.caption || (captionLoading ? "Menyusun kata-kata..." : captionError ? "Gagal generate caption. Coba pilih unit lain." : "")}
                className={cn(
                  "w-full bg-secondary border border-border rounded-xl p-5 text-sm min-h-[300px] resize-none focus:outline-none leading-relaxed",
                  captionLoading && "opacity-50 blur-[2px]"
                )}
              />
              
              {captionData?.caption && !captionLoading && (
                <button
                  onClick={handleCopy}
                  className="absolute bottom-4 right-4 bg-primary text-primary-foreground p-3 rounded-lg hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 flex items-center gap-2 font-bold text-sm"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? "Tersalin" : "Salin Caption"}
                </button>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
