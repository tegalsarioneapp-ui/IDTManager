import { useMemo } from "react";
import { Link, useRoute } from "wouter";
import { QRCodeSVG } from "qrcode.react";
import { Cpu, MemoryStick, HardDrive, Monitor, MonitorPlay, ArrowLeft, Printer, MessageCircle } from "lucide-react";
import { useGetUnit, useGetSettings, getGetUnitQueryKey, getGetSettingsQueryKey } from "@workspace/api-client-react";
import { formatRupiah } from "@/lib/utils";

type ParsedSpecs = {
  cpu: string;
  ram: string;
  storage: string;
  display: string;
  gpu: string;
};

function parseSpecs(specText: string): ParsedSpecs {
  const text = specText || "";

  const pick = (regexes: RegExp[], fallback: string) => {
    for (const regex of regexes) {
      const match = text.match(regex);
      if (match?.[1]) return match[1].trim();
      if (match?.[0]) return match[0].trim();
    }
    return fallback;
  };

  const cpu = pick([
    /(?:cpu|processor|proc)\s*[:\-]\s*([^,;\n]+)/i,
    /(intel\s+[^,;\n]+|amd\s+[^,;\n]+|apple\s+m\d[^,;\n]*)/i,
  ], "Lihat detail spek");

  const ram = pick([
    /(?:ram|memory)\s*[:\-]\s*([^,;\n]+)/i,
    /(\d+\s?(?:gb|tb)\s?(?:ram|ddr\d)?)/i,
  ], "Lihat detail spek");

  const storage = pick([
    /(?:storage|ssd|hdd|nvme)\s*[:\-]\s*([^,;\n]+)/i,
    /(\d+\s?(?:gb|tb)\s?(?:ssd|hdd|nvme))/i,
  ], "Lihat detail spek");

  const display = pick([
    /(?:display|screen|layar)\s*[:\-]\s*([^,;\n]+)/i,
    /(\d{2}(?:\.\d)?\s?(?:inch|"))/i,
  ], "Lihat detail spek");

  const gpu = pick([
    /(?:gpu|graphics|vga)\s*[:\-]\s*([^,;\n]+)/i,
    /(rtx\s?\d{3,4}|gtx\s?\d{3,4}|mx\s?\d{2,4}|radeon\s+[^,;\n]+)/i,
  ], "Integrated / sesuai unit");

  return { cpu, ram, storage, display, gpu };
}

function normalizeWa(phone: string | null | undefined): string {
  if (!phone) return "";
  return phone.replace(/\D/g, "").replace(/^0/, "62");
}

function formatSerialNumber(unitId: number): string {
  return `IDT-${String(unitId).padStart(6, "0")}`;
}

export default function PrintLabelPage() {
  const [matched, params] = useRoute<{ id: string }>("/print-label/:id");
  const unitId = matched ? Number(params.id) : 0;

  const { data: unit, isLoading } = useGetUnit(unitId, {
    query: { queryKey: getGetUnitQueryKey(unitId), enabled: matched && Number.isFinite(unitId) && unitId > 0 },
  });
  const { data: settings } = useGetSettings({
    query: { queryKey: getGetSettingsQueryKey() },
  });

  const specs = useMemo(() => parseSpecs(unit?.spek ?? ""), [unit?.spek]);

  const waNumber = normalizeWa(settings?.whatsapp);
  const serial = unit ? formatSerialNumber(unit.id) : "";

  const waText = useMemo(() => {
    if (!unit) return "";
    return `Halo INDO DUTA TECH, saya tertarik dengan unit ${unit.tipe} (SN: ${serial}).`;
  }, [unit, serial]);

  const waUrl = waNumber
    ? `https://wa.me/${waNumber}?text=${encodeURIComponent(waText)}`
    : `https://wa.me/?text=${encodeURIComponent(waText)}`;

  const printNow = () => {
    window.print();
  };

  if (!matched) {
    return <div className="p-8">Parameter unit tidak valid.</div>;
  }

  if (isLoading || !unit) {
    return <div className="p-8 text-center text-muted-foreground">Memuat label spesifikasi...</div>;
  }

  if (unit.status !== "READY") {
    return (
      <div className="p-8 max-w-xl mx-auto">
        <div className="rounded-2xl border border-border bg-card p-6 text-center">
          <p className="text-lg font-semibold">Label hanya tersedia untuk unit berstatus READY.</p>
          <p className="text-sm text-muted-foreground mt-2">Status unit saat ini: {unit.status}</p>
          <Link href="/jual" className="inline-flex mt-4 px-4 py-2 rounded-lg bg-primary text-primary-foreground">
            Kembali ke Etalase READY
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @media print {
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            width: 100%;
            height: 100%;
          }

          body * {
            visibility: hidden !important;
          }

          #spec-label-print, #spec-label-print * {
            visibility: visible !important;
          }

          #spec-label-print {
            position: fixed !important;
            inset: 0 !important;
            display: grid !important;
            place-items: center !important;
            background: #ffffff !important;
            padding: 0 !important;
            margin: 0 !important;
          }

          #spec-label-card {
            width: 95mm !important;
            min-height: 140mm !important;
            box-shadow: none !important;
            border: 1px solid #0b1324 !important;
            break-inside: avoid !important;
          }

          @page {
            size: 100mm 150mm;
            margin: 0;
          }
        }
      `}</style>

      <div className="min-h-screen bg-[radial-gradient(circle_at_10%_20%,#f8fafc_0%,#eef2ff_35%,#e2e8f0_100%)] p-6 print:p-0 print:bg-white">
        <div className="max-w-5xl mx-auto print:hidden mb-4 flex items-center justify-between gap-3">
          <Link href="/jual" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-card border border-border hover:bg-secondary transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Kembali ke READY
          </Link>

          <button
            onClick={printNow}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Printer className="w-4 h-4" />
            Cetak Label
          </button>
        </div>

        <div id="spec-label-print" className="flex justify-center">
          <article
            id="spec-label-card"
            className="w-[95mm] min-h-[140mm] rounded-2xl overflow-hidden border border-slate-800 bg-white text-slate-900 shadow-[0_24px_70px_-32px_rgba(15,23,42,0.65)]"
          >
            <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 text-white px-5 py-5">
              <div className="absolute -top-10 -right-8 w-32 h-32 rounded-full bg-cyan-300/20 blur-xl" />
              <div className="absolute -bottom-12 -left-8 w-28 h-28 rounded-full bg-indigo-300/25 blur-xl" />

              <p className="text-[10px] tracking-[0.26em] uppercase text-cyan-200/90">Premium Refurbished</p>
              <h1 className="text-xl font-black tracking-tight mt-1">INDO DUTA TECH</h1>
              <p className="text-xs text-slate-200/90 mt-0.5">Label Spesifikasi Unit</p>
            </div>

            <div className="px-5 py-4 border-b border-slate-200">
              <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Model</p>
              <h2 className="text-lg font-bold leading-tight mt-1">{unit.tipe}</h2>
              <p className="text-[11px] text-slate-500 mt-1">SN: {serial}</p>
            </div>

            <div className="px-5 py-4 grid gap-2.5">
              <SpecRow icon={<Cpu className="w-4 h-4" />} label="CPU" value={specs.cpu} />
              <SpecRow icon={<MemoryStick className="w-4 h-4" />} label="RAM" value={specs.ram} />
              <SpecRow icon={<HardDrive className="w-4 h-4" />} label="Storage" value={specs.storage} />
              <SpecRow icon={<Monitor className="w-4 h-4" />} label="Display" value={specs.display} />
              <SpecRow icon={<MonitorPlay className="w-4 h-4" />} label="GPU" value={specs.gpu} />
            </div>

            <div className="px-5 pb-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Harga Etalase</p>
                <p className="text-2xl font-black tracking-tight text-slate-900 mt-1">
                  {formatRupiah((unit.hargaBeli + unit.biayaQc) * 1.05)}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">Battery {unit.baterai ?? "-"}% • {unit.fisik ?? "Refurbished"}</p>
              </div>
            </div>

            <div className="px-5 pb-5">
              <div className="rounded-xl border border-slate-200 p-3 bg-white">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Scan WhatsApp</p>
                    <p className="text-xs text-slate-600 mt-1 leading-snug">Chat admin untuk ketersediaan dan reservasi unit ini.</p>
                  </div>
                  <QRCodeSVG value={waUrl} size={72} bgColor="#ffffff" fgColor="#0f172a" />
                </div>

                <a
                  href={waUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-emerald-700 print:hidden"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  Buka WhatsApp
                </a>
              </div>
            </div>
          </article>
        </div>
      </div>
    </>
  );
}

function SpecRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="grid grid-cols-[22px_72px_1fr] items-start gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
      <div className="text-slate-600 mt-0.5">{icon}</div>
      <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">{label}</div>
      <div className="text-[12px] text-slate-800 leading-snug font-medium">{value}</div>
    </div>
  );
}
