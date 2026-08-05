import { useGetUnitInvoice, getGetUnitInvoiceQueryKey } from "@workspace/api-client-react";
import { formatRupiah, formatDate } from "@/lib/utils";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Printer, FileText, MessageCircle } from "lucide-react";
import { useRef } from "react";

interface Props {
  unitId: number | null;
  onClose: () => void;
}

export function InvoicePrint({ unitId, onClose }: Props) {
  const { data, isLoading } = useGetUnitInvoice(unitId ?? 0, {
    query: { queryKey: getGetUnitInvoiceQueryKey(unitId ?? 0), enabled: !!unitId },
  });
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const content = printRef.current?.innerHTML;
    if (!content) return;
    const win = window.open("", "_blank", "width=800,height=900");
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head>
      <title>Invoice ${data?.nomorInvoice}</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Arial', sans-serif; background: white; color: #1a1a1a; }
        .page { max-width: 720px; margin: 0 auto; padding: 40px; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; padding-bottom: 24px; border-bottom: 2px solid #e5e7eb; }
        .logo-area { display: flex; align-items: center; gap: 12px; }
        .logo-img { width: 60px; height: 60px; object-fit: contain; }
        .logo-box { width: 52px; height: 52px; background: #1a1a2e; color: white; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 14px; border-radius: 8px; }
        .store-name { font-size: 20px; font-weight: 900; color: #1a1a2e; }
        .store-tagline { font-size: 12px; color: #6b7280; margin-top: 2px; }
        .invoice-title { text-align: right; }
        .invoice-label { font-size: 28px; font-weight: 900; color: #1a1a2e; letter-spacing: -0.5px; }
        .invoice-number { font-size: 13px; color: #6b7280; margin-top: 4px; font-family: monospace; }
        .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 28px; }
        .meta-section h3 { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #9ca3af; margin-bottom: 8px; }
        .meta-section p { font-size: 13px; color: #374151; line-height: 1.6; }
        .meta-section .bold { font-weight: 700; color: #1a1a2e; font-size: 14px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
        thead tr { background: #1a1a2e; color: white; }
        thead th { padding: 12px 16px; text-align: left; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
        tbody tr { border-bottom: 1px solid #f3f4f6; }
        tbody td { padding: 14px 16px; font-size: 13px; vertical-align: top; color: #374151; }
        tbody td strong { color: #1a1a2e; font-size: 14px; }
        .amount-col { text-align: right; font-family: monospace; font-weight: 700; }
        .totals { margin-left: auto; width: 280px; }
        .totals-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 13px; border-bottom: 1px solid #f3f4f6; }
        .totals-row.total { border-top: 2px solid #1a1a2e; border-bottom: none; padding-top: 12px; margin-top: 4px; font-size: 16px; font-weight: 900; color: #1a1a2e; }
        .footer { margin-top: 40px; padding-top: 24px; border-top: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: flex-end; }
        .footer-left { font-size: 12px; color: #9ca3af; line-height: 1.8; }
        .signature { text-align: center; }
        .signature-line { width: 160px; border-bottom: 1px solid #1a1a2e; margin-bottom: 8px; height: 60px; }
        .signature p { font-size: 12px; color: #6b7280; }
        .badge { display: inline-block; background: #d1fae5; color: #065f46; padding: 4px 12px; border-radius: 99px; font-size: 11px; font-weight: 700; }
      </style>
    </head><body><div class="page">${content}</div></body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); }, 400);
  };

  const handleWhatsApp = () => {
    if (!data) return;
    const buyerPhone = data.unit.nomorPembeli?.replace(/\D/g, "").replace(/^0/, "62") ?? "";
    const msg = [
      `Halo ${data.unit.namaPembeli || "Pembeli"}! 👋`,
      ``,
      `Terima kasih telah berbelanja di *${data.store.namaToko || "INDO DUTA TECH"}*.`,
      ``,
      `📄 *Invoice:* ${data.nomorInvoice}`,
      `📱 *Unit:* ${data.unit.tipe}`,
      `📅 *Tanggal:* ${formatDate(data.tanggal)}`,
      `💰 *Total:* ${formatRupiah(data.total)}`,
      `✅ *Status:* LUNAS`,
      ``,
      `Semoga puas dengan pembeliannya! 😊`,
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
              <FileText className="w-5 h-5 text-primary" /> Invoice Penjualan
            </Dialog.Title>
            <div className="flex items-center gap-2">
              {data?.unit.nomorPembeli && (
                <button
                  onClick={handleWhatsApp}
                  className="flex items-center gap-2 px-3 py-2 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-500 transition-colors text-sm"
                  title="Kirim invoice ke pembeli via WhatsApp"
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
            {isLoading && <div className="text-center text-muted-foreground py-12 animate-pulse">Memuat invoice...</div>}
            {data && (
              <div ref={printRef}>
                {/* Header */}
                <div className="header flex justify-between items-start mb-8 pb-6 border-b border-border">
                  <div className="logo-area flex items-center gap-3">
                    {data.store.logo ? (
                      <img src={data.store.logo} alt="Logo" className="logo-img w-14 h-14 object-contain rounded-lg" />
                    ) : (
                      <div className="logo-box w-12 h-12 bg-primary text-primary-foreground flex items-center justify-center font-black text-sm rounded-lg">IDT</div>
                    )}
                    <div>
                      <div className="store-name font-black text-xl">{data.store.namaToko || "INDO DUTA TECH"}</div>
                      <div className="store-tagline text-xs text-muted-foreground">{data.store.tagline}</div>
                      {data.store.telepon && <div className="text-xs text-muted-foreground">📞 {data.store.telepon}</div>}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="invoice-label text-3xl font-black text-foreground">INVOICE</div>
                    <div className="invoice-number font-mono text-sm text-muted-foreground mt-1">{data.nomorInvoice}</div>
                    <div className="badge inline-block mt-2 bg-emerald-500/10 text-emerald-600 text-xs font-bold px-3 py-1 rounded-full">LUNAS</div>
                  </div>
                </div>

                {/* Meta */}
                <div className="meta grid grid-cols-2 gap-6 mb-7">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Kepada</div>
                    <div className="font-bold text-foreground">{data.unit.namaPembeli || "—"}</div>
                    {data.unit.nomorPembeli && <div className="text-sm text-muted-foreground">{data.unit.nomorPembeli}</div>}
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Tanggal</div>
                    <div className="font-bold text-foreground">{formatDate(data.tanggal)}</div>
                  </div>
                </div>

                {/* Table */}
                <table className="w-full border-collapse mb-6">
                  <thead>
                    <tr className="bg-primary text-primary-foreground">
                      <th className="p-3 text-left text-xs font-bold uppercase tracking-wider rounded-tl-lg">Item</th>
                      <th className="p-3 text-left text-xs font-bold uppercase tracking-wider">Deskripsi</th>
                      <th className="p-3 text-right text-xs font-bold uppercase tracking-wider rounded-tr-lg">Jumlah</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-border">
                      <td className="p-3 align-top">
                        <div className="font-bold text-foreground">{data.unit.tipe}</div>
                        <div className="text-xs text-muted-foreground mt-1">Unit #{data.unit.id}</div>
                      </td>
                      <td className="p-3 align-top text-sm text-muted-foreground">
                        <div>{data.unit.spek}</div>
                        {data.unit.fisik && <div>Fisik: {data.unit.fisik}</div>}
                        {data.unit.baterai && <div>Baterai: {data.unit.baterai}%</div>}
                        <div>Kelengkapan: {data.unit.kelengkapan}</div>
                      </td>
                      <td className="p-3 text-right font-bold font-mono text-foreground align-top">{formatRupiah(data.subtotal)}</td>
                    </tr>
                  </tbody>
                </table>

                {/* Total */}
                <div className="flex justify-end mb-8">
                  <div className="w-64 space-y-2">
                    <div className="flex justify-between text-sm py-2 border-b border-border">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-mono">{formatRupiah(data.subtotal)}</span>
                    </div>
                    <div className="flex justify-between py-2 font-black text-lg border-t-2 border-foreground mt-1 pt-3">
                      <span>TOTAL</span>
                      <span className="font-mono">{formatRupiah(data.total)}</span>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex justify-between items-end pt-6 border-t border-border">
                  <div className="text-xs text-muted-foreground space-y-1">
                    {data.store.alamat && <div>📍 {data.store.alamat}</div>}
                    {data.store.instagram && <div>📱 IG: @{data.store.instagram}</div>}
                    {data.store.whatsapp && <div>💬 WA: {data.store.whatsapp}</div>}
                  </div>
                  <div className="text-center">
                    <div className="w-36 border-b border-foreground mb-1 h-14" />
                    <div className="text-xs text-muted-foreground">Penjual</div>
                    <div className="text-xs font-bold">{data.store.namaToko}</div>
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
