import { useState, useRef, useEffect } from "react";
import { useGetSettings, useUpdateSettings } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import {
  Store, Phone, Mail, MapPin, Upload, Save, Tv2, X,
  Instagram, Facebook, MessageCircle, Globe, AtSign,
} from "lucide-react";
import { cn } from "@/lib/utils";

type SocialPlatformKey = "instagram" | "whatsapp" | "facebook" | "tiktok" | "website";

type SocialPlatform = {
  key: SocialPlatformKey;
  label: string;
  icon: React.ElementType;
  color: string;
  ring: string;
  border: string;
  placeholder: string;
  prefix?: string;
  iconLabel?: string;
  fullWidth?: boolean;
};

// ─── Platform config ───────────────────────────────────────────────────────────
const SOCIAL_PLATFORMS: SocialPlatform[] = [
  {
    key: "instagram",
    label: "Instagram",
    icon: Instagram,
    color: "text-pink-500",
    ring: "focus:ring-pink-500/30",
    border: "focus:border-pink-500/50",
    placeholder: "username",
    prefix: "@",
  },
  {
    key: "whatsapp",
    label: "WhatsApp",
    icon: MessageCircle,
    color: "text-green-500",
    ring: "focus:ring-green-500/30",
    border: "focus:border-green-500/50",
    placeholder: "628xxxxxxxxx",
  },
  {
    key: "facebook",
    label: "Facebook",
    icon: Facebook,
    color: "text-blue-500",
    ring: "focus:ring-blue-500/30",
    border: "focus:border-blue-500/50",
    placeholder: "nama halaman atau URL",
  },
  {
    key: "tiktok",
    label: "TikTok",
    icon: AtSign,
    color: "text-foreground",
    ring: "focus:ring-primary/30",
    border: "focus:border-primary/50",
    placeholder: "username",
    prefix: "@",
    // TikTok uses AtSign since Lucide has no TikTok icon
    iconLabel: "TT",
  },
  {
    key: "website",
    label: "Website",
    icon: Globe,
    color: "text-sky-400",
    ring: "focus:ring-sky-500/30",
    border: "focus:border-sky-500/50",
    placeholder: "https://tokosaya.com",
    fullWidth: true,
  },
];

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function Settings() {
  const { data: settings, isLoading, error } = useGetSettings();
  const updateSettings = useUpdateSettings();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    namaToko: "", tagline: "", alamat: "", telepon: "", email: "",
    instagram: "", facebook: "", whatsapp: "", tiktok: "", website: "", logo: "",
  });

  useEffect(() => {
    if (settings) {
      setForm({
        namaToko: settings.namaToko ?? "",
        tagline: settings.tagline ?? "",
        alamat: settings.alamat ?? "",
        telepon: settings.telepon ?? "",
        email: settings.email ?? "",
        instagram: settings.instagram ?? "",
        facebook: settings.facebook ?? "",
        whatsapp: settings.whatsapp ?? "",
        tiktok: settings.tiktok ?? "",
        website: settings.website ?? "",
        logo: settings.logo ?? "",
      });
    }
  }, [settings]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "File terlalu besar", description: "Maksimal 2MB", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => setForm((f) => ({ ...f, logo: ev.target?.result as string }));
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) {
      toast({ title: "Tidak dapat menyimpan", description: "Data pengaturan belum dimuat. Muat ulang halaman.", variant: "destructive" });
      return;
    }
    updateSettings.mutate({ data: form }, {
      onSuccess: () => toast({ title: "Pengaturan tersimpan ✓", description: "Profil toko berhasil diperbarui." }),
      onError: () => toast({ title: "Gagal menyimpan", variant: "destructive" }),
    });
  };

  if (isLoading) return (
    <div className="p-8 text-center text-muted-foreground animate-pulse">Memuat pengaturan...</div>
  );

  if (error) return (
    <div className="p-8 text-center">
      <p className="text-lg font-bold text-destructive mb-1">Gagal memuat pengaturan</p>
      <p className="text-sm text-muted-foreground">Periksa koneksi server dan muat ulang halaman.</p>
    </div>
  );

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-6 pb-8">
      <header>
        <h1 className="text-3xl font-bold text-foreground">Pengaturan Toko</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Profil toko digunakan pada invoice, kuitansi, dan caption sosial media.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* ── Logo Toko ─────────────────────────────────────────────────── */}
        <Card>
          <SectionHeader icon={<Store className="w-4.5 h-4.5" />} title="Logo Toko" />
          <div className="flex items-center gap-5 mt-4">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-24 h-24 rounded-xl border-2 border-dashed border-border flex items-center justify-center bg-secondary/40 hover:border-primary hover:bg-secondary/70 transition-all overflow-hidden shrink-0"
            >
              {form.logo ? (
                <img src={form.logo} alt="Logo" className="w-full h-full object-contain" />
              ) : (
                <Upload className="w-7 h-7 text-muted-foreground" />
              )}
            </button>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/70 text-sm font-semibold rounded-lg transition-colors"
              >
                <Upload className="w-4 h-4" /> Upload Logo
              </button>
              {form.logo && (
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, logo: "" }))}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" /> Hapus Logo
                </button>
              )}
              <p className="text-xs text-muted-foreground">PNG / JPG · Maks. 2 MB</p>
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
          </div>
        </Card>

        {/* ── Informasi Toko ─────────────────────────────────────────────── */}
        <Card>
          <SectionHeader icon={<Store className="w-4.5 h-4.5" />} title="Informasi Toko" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <Field label="Nama Toko" icon={<Store className="w-4 h-4" />} required>
              <input
                type="text" value={form.namaToko} required
                onChange={(e) => setForm((f) => ({ ...f, namaToko: e.target.value }))}
                placeholder="Contoh: INDO DUTA TECH"
                className={inputCls}
              />
            </Field>
            <Field label="Tagline" icon={<Tv2 className="w-4 h-4" />}>
              <input
                type="text" value={form.tagline}
                onChange={(e) => setForm((f) => ({ ...f, tagline: e.target.value }))}
                placeholder="Contoh: Premium Reseller"
                className={inputCls}
              />
            </Field>
            <Field label="No. Telepon / WA" icon={<Phone className="w-4 h-4" />}>
              <input
                type="text" value={form.telepon}
                onChange={(e) => setForm((f) => ({ ...f, telepon: e.target.value }))}
                placeholder="0812xxxxxxxx"
                className={inputCls}
              />
            </Field>
            <Field label="Email" icon={<Mail className="w-4 h-4" />}>
              <input
                type="email" value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="toko@email.com"
                className={inputCls}
              />
            </Field>
            <Field label="Alamat" icon={<MapPin className="w-4 h-4" />} className="md:col-span-2">
              <textarea
                value={form.alamat} rows={2}
                onChange={(e) => setForm((f) => ({ ...f, alamat: e.target.value }))}
                placeholder="Jl. Contoh No. 1, Kota, Provinsi"
                className={cn(inputCls, "resize-none")}
              />
            </Field>
          </div>
        </Card>

        {/* ── Sosial Media ────────────────────────────────────────────────── */}
        <div className="rounded-2xl overflow-hidden border border-white/5 shadow-xl">
          {/* Card header — accent strip */}
          <div className="bg-gradient-to-r from-pink-600 via-purple-700 to-blue-600 p-px">
            <div className="bg-[#111827] rounded-t-[calc(1rem-1px)] px-6 pt-5 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-pink-500" />
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                  <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
                </div>
                <h2 className="font-bold text-base text-white ml-1">Pengaturan Sosial Media</h2>
              </div>
              <p className="text-xs text-slate-400 mt-1 ml-0.5">
                Digunakan untuk caption, invoice, dan link WhatsApp otomatis.
              </p>
            </div>
          </div>

          {/* Card body */}
          <div className="bg-[#111827] px-6 pb-6 rounded-b-2xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {SOCIAL_PLATFORMS.map((platform) => (
                <div key={platform.key} className={cn("space-y-1.5", platform.fullWidth && "md:col-span-2")}>
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    {platform.iconLabel ? (
                      <span className={cn("font-black text-sm leading-none", platform.color)}>TT</span>
                    ) : (
                      <platform.icon className={cn("w-3.5 h-3.5", platform.color)} />
                    )}
                    {platform.label}
                  </label>
                  <div className="relative">
                    {platform.prefix && (
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-medium select-none">
                        {platform.prefix}
                      </span>
                    )}
                    <input
                      type="text"
                      value={form[platform.key]}
                      onChange={(e) => {
                        const val = platform.prefix
                          ? e.target.value.replace(/^@/, "")
                          : e.target.value;
                        setForm((f) => ({ ...f, [platform.key]: val }));
                      }}
                      placeholder={platform.placeholder}
                      className={cn(
                        "w-full bg-[#1a2035] border border-white/10 rounded-xl text-sm text-white placeholder:text-slate-600",
                        "px-4 py-3 focus:outline-none focus:ring-2 transition-all",
                        platform.prefix && "pl-8",
                        platform.ring, platform.border
                      )}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Save button ───────────────────────────────────────────────── */}
        <button
          type="submit"
          disabled={updateSettings.isPending}
          className={cn(
            "w-full flex items-center justify-center gap-2.5 px-6 py-4",
            "bg-primary text-primary-foreground font-bold text-base rounded-2xl",
            "hover:bg-primary/90 active:scale-[0.99] transition-all",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "shadow-lg shadow-primary/25"
          )}
        >
          <Save className="w-5 h-5" />
          {updateSettings.isPending ? "Menyimpan..." : "Simpan Pengaturan"}
        </button>
      </form>
    </div>
  );
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
const inputCls =
  "w-full bg-secondary border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition-all";

function Card({ children }: { children: React.ReactNode }) {
  return (
    <section className="bg-card border border-border rounded-2xl p-6 space-y-1">
      {children}
    </section>
  );
}

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 text-foreground">
      <span className="text-primary">{icon}</span>
      <h2 className="font-bold text-base">{title}</h2>
    </div>
  );
}

function Field({
  label, icon, children, required, className,
}: {
  label: string; icon: React.ReactNode; children: React.ReactNode;
  required?: boolean; className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
        <span className="text-muted-foreground">{icon}</span>
        {label}
        {required && <span className="text-destructive text-xs">*</span>}
      </label>
      {children}
    </div>
  );
}
