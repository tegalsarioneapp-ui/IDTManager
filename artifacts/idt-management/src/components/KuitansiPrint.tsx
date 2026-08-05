import { useGetUnitKuitansi, getGetUnitKuitansiQueryKey } from "@workspace/api-client-react";
import { formatRupiah, formatDate } from "@/lib/utils";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Printer, Receipt, MessageCircle } from "lucide-react";
import { useRef } from "react";

interface Props {
  unitId: number | null;
  onClose: () => void;
}

export function KuitansiPrint({ unitId, onClose }: Props) {
  const { data, isLoading } = useGetUnitKuitansi(unitId ?? 0, {
    query: { queryKey: getGetUnitKuitansiQueryKey(unitId ?? 0), enabled: !!unitId },
  });
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const content = printRef.current?.innerHTML;
    if (!content) return;
    const win = window.open("", "_blank", "width=700,height=500");
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head>
      <title>Kuitansi ${data?.nomorKuitansi}</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Arial', sans-serif; background: white; color: #1a1a1a; }
        .page { max-width: 640px; margin: 0 auto; padding: 32px; }
        .outer { border: 2px solid #1a1a2e; border-radius: 12px; overflow: hidden; }
        .top-bar { background: #1a1a2e; color: white; padding: 14px 24px; display: flex; justify-content: space-between; align-items: center; }
        .store-left { display: flex; align-items: center; gap: 12px; }
        .logo-img { width: 42px; height: 42px; object-fit: contain; background: white; border-radius: 6px; padding: 2px; }
        .logo-box { width: 38px; height: 38px; background: white; color: #1a1a2e; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 12px; border-radius: 6px; }
        .store-name { font-size: 16px; font-weight: 900; }
        .store-tagline { font-size: 10px; opacity: 0.7; margin-top: 1px; }
        .kwitansi-label { text-align: right; }
        .kwitansi-label .title { font-size: 22px; font-weight: 900; letter-spacing: 2px; }
        .kwitansi-label .nomor { font-size: 11px; opacity: 0.7; font-family: monospace; margin-top: 2px; }
        .body { padding: 24px; }
        .row { display: flex; border-bottom: 1px dotted #d1d5db; padding: 10px 0; align-items: center; }
        .row-label { width: 160px; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.3px; shrink: 0; }
        .row-colon { width: 20px; color: #9ca3af; }
        .row-value { flex: 1; font-size: 14px; font-weight: 600; color: #1a1a2e; }
        .amount-row { background: #f0fdf4; border-radius: 8px; padding: 14px 16px; margin: 20px 0; border: 1px solid #bbf7d0; }
        .amount-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #065f46; margin-bottom: 4px; }
        .amount-value { font-size: 26px; font-weight: 900; color: #15803d; font-family: monospace; }
        .terbilang { font-size: 12px; color: #6b7280; margin-top: 4px; font-style: italic; text-transform: capitalize; }
        .footer { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 28px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
        .footer-contact { font-size: 11px; color: #9ca3af; line-height: 1.8; }
        .signature { text-align: center; }
        .sig-line { width: 130px; border-bottom: 1px solid #1a1a2e; height: 50px; margin-bottom: 6px; }
        .sig-label { font-size: 11px; color: #6b7280; }
        .sig-name { font-size: 12px; font-weight: 700; color: #1a1a2e; margin-top: 2px; }
      </style>
    </head><body><div class="page">${content}</div></body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); }, 400);
  };

  const handleWhatsApp = () => {
    if (!data) return;
    const buyerPhone = data.unit.nomorPembeli?.replace(/\D/g, "").replace(/^0/, "62") ?? "";
    const terbilangCap = data.terbilang.charAt(0).toUpperCase() + data.terbilang.slice(1);
    const msg = [
      `Halo ${data.unit.namaPembeli || "Pembeli"}! 👋`,
      ``,
      `Berikut kuitansi pembayaran Anda dari *${data.store.namaToko || "INDO DUTA TECH"}*:`,
      ``,
      `📝 *No. Kuitansi:* ${data.nomorKuitansi}`,
      `📱 *Item:* ${data.unit.tipe}`,
      `📅 *Tanggal:* ${formatDate(data.tanggal)}`,
      `💰 *Jumlah:* ${formatRupiah(data.jumlah)}`,
      `✍️ *Terbilang:* ${terbilangCap}`,
      ``,
      `Terima kasih telah berbelanja! 😊`,
      data.store.whatsapp ? `\nInfo & garansi: wa.me/${data.store.whatsapp.replace(/\D/g, "").replace(/^0/, "62")}` : "",
    ].filter(l => l !== undefined).join("\n").trim();

    const url = buyerPhone
      ? `https://wa.me/${buyerPhone}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
  };

  return (
    <Dialog.Root open={!!unitId} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 animate-in fade-in-0" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-2xl max-h-[90vh] translate-x-[-50%] translate-y-[-50%] bg-card border border-border rounded-2xl shadow-2xl flex flex-col animate-in fade-in-0 zoom-in-95 overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
            <Dialog.Title className="text-lg font-bold flex items-center gap-2">
              <Receipt className="w-5 h-5 text-primary" /> Kuitansi Penjualan
            </Dialog.Title>
            <div className="flex items-center gap-2">
              {data?.unit.nomorPembeli && (
                <button
                  onClick={handleWhatsApp}
                  className="flex items-center gap-2 px-3 py-2 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-500 transition-colors text-sm"
                  title="Kirim kuitansi ke pembeli via WhatsApp"
                >
                  <MessageCircle className="w-4 h-4" /> WhatsApp
                </button>
              )}
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors text-sm"
              >
                <Printer className="w-4 h-4" /> Cetak / PDF
              </button>
              <button onClick={onClose} className="p-2 hover:bg-secondary rounded-lg transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="overflow-y-auto flex-1 p-6">
            {isLoading && <div className="text-center text-muted-foreground py-12 animate-pulse">Memuat kuitansi...</div>}
            {data && (
              <div ref={printRef}>
                <div className="outer border-2 border-foreground rounded-xl overflow-hidden">
                  {/* Top bar */}
                  <div className="top-bar flex justify-between items-center bg-primary text-primary-foreground p-4">
                    <div className="store-left flex items-center gap-3">
                      {data.store.logo ? (
                        <img src={data.store.logo} alt="Logo" className="logo-img w-10 h-10 object-contain bg-white rounded-md p-0.5" />
                      ) : (
                        <div className="logo-box w-9 h-9 bg-white text-primary flex items-center justify-center font-black text-xs rounded-md">IDT</div>
                      )}
                      <div>
                        <div className="store-name font-black text-base">{data.store.namaToko || "INDO DUTA TECH"}</div>
                        <div className="store-tagline text-xs opacity-70">{data.store.tagline}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="kwitansi-label text-2xl font-black tracking-widest">KUITANSI</div>
                      <div className="text-xs opacity-70 font-mono mt-0.5">{data.nomorKuitansi}</div>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="body p-6 space-y-1">
                    <div className="row flex items-center border-b border-dashed border-border py-2.5">
                      <div className="row-label w-40 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Diterima dari</div>
                      <div className="row-colon mx-2 text-muted-foreground">:</div>
                      <div className="row-value font-bold text-foreground">{data.unit.namaPembeli || "—"}</div>
                    </div>
                    {data.unit.nomorPembeli && (
                      <div className="row flex items-center border-b border-dashed border-border py-2.5">
                        <div className="row-label w-40 text-xs font-semibold text-muted-foreground uppercase tracking-wide">No. HP</div>
                        <div className="row-colon mx-2 text-muted-foreground">:</div>
                        <div className="row-value text-foreground">{data.unit.nomorPembeli}</div>
                      </div>
                    )}
                    <div className="row flex items-center border-b border-dashed border-border py-2.5">
                      <div className="row-label w-40 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Untuk Pembayaran</div>
                      <div className="row-colon mx-2 text-muted-foreground">:</div>
                      <div className="row-value text-foreground">{data.unit.tipe} — {data.unit.spek}</div>
                    </div>
                    <div className="row flex items-center py-2.5">
                      <div className="row-label w-40 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Tanggal</div>
                      <div className="row-colon mx-2 text-muted-foreground">:</div>
                      <div className="row-value text-foreground">{formatDate(data.tanggal)}</div>
                    </div>

                    {/* Amount highlight */}
                    <div className="amount-row my-5 bg-emerald-500/10 rounded-xl p-4 border border-emerald-500/20">
                      <div className="amount-label text-xs font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-400 mb-1">Jumlah Uang</div>
                      <div className="amount-value text-2xl font-black text-emerald-600 font-mono">{formatRupiah(data.jumlah)}</div>
                      <div className="terbilang text-xs text-muted-foreground mt-1 italic capitalize">
                        Terbilang: <span className="font-semibold">{data.terbilang.charAt(0).toUpperCase() + data.terbilang.slice(1)}</span>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="footer flex justify-between items-end pt-5 border-t border-border mt-4">
                      <div className="text-xs text-muted-foreground space-y-1">
                        {data.store.alamat && <div>📍 {data.store.alamat}</div>}
                        {data.store.whatsapp && <div>💬 WA: {data.store.whatsapp}</div>}
                        {data.store.instagram && <div>📱 IG: @{data.store.instagram}</div>}
                      </div>
                      <div className="signature text-center">
                        <div className="sig-line w-36 border-b border-foreground h-12 mb-1" />
                        <div className="sig-label text-xs text-muted-foreground">Yang Menerima</div>
                        <div className="sig-name text-xs font-bold">{data.store.namaToko}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
