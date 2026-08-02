import { useState, useRef, useEffect } from "react";
import { useGetSettings, useUpdateSettings } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import {
  Store, Phone, Mail, MapPin, Instagram, Facebook, MessageCircle, Globe,
  Upload, Save, Tv2, X
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function Settings() {
  const { data: settings, isLoading } = useGetSettings();
  const updateSettings = useUpdateSettings();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    namaToko: "",
    tagline: "",
    alamat: "",
    telepon: "",
    email: "",
    instagram: "",
    facebook: "",
    whatsapp: "",
    tiktok: "",
    website: "",
    logo: "",
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
    reader.onload = (ev) => {
      setForm((f) => ({ ...f, logo: ev.target?.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings.mutate({ data: form }, {
      onSuccess: () => toast({ title: "Pengaturan tersimpan ✓", description: "Profil toko berhasil diperbarui." }),
      onError: () => toast({ title: "Gagal menyimpan", variant: "destructive" }),
    });
  };

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse">Memuat pengaturan...</div>;
  }

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-foreground">Pengaturan Toko</h1>
        <p className="text-muted-foreground mt-1">Profil toko digunakan pada invoice, kuitansi, dan caption sosial media.</p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Logo */}
        <section className="bg-card border border-border rounded-xl p-6 space-y-4">
          <h2 className="font-bold text-lg flex items-center gap-2"><Store className="w-5 h-5 text-primary" /> Logo Toko</h2>
          <div className="flex items-center gap-5">
            <div
              className="w-24 h-24 rounded-xl border-2 border-dashed border-border flex items-center justify-center bg-secondary/50 cursor-pointer hover:border-primary transition-colors overflow-hidden shrink-0"
              onClick={() => fileRef.current?.click()}
            >
              {form.logo ? (
                <img src={form.logo} alt="Logo" className="w-full h-full object-contain" />
              ) : (
                <Upload className="w-8 h-8 text-muted-foreground" />
              )}
            </div>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="px-4 py-2 bg-secondary hover:bg-secondary/80 text-sm font-semibold rounded-lg transition-colors flex items-center gap-2"
              >
                <Upload className="w-4 h-4" /> Upload Logo
              </button>
              {form.logo && (
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, logo: "" }))}
                  className="px-4 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-lg transition-colors flex items-center gap-2"
                >
                  <X className="w-4 h-4" /> Hapus Logo
                </button>
              )}
              <p className="text-xs text-muted-foreground">PNG/JPG, maks. 2MB</p>
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
          </div>
        </section>

        {/* Info Toko */}
        <section className="bg-card border border-border rounded-xl p-6 space-y-4">
          <h2 className="font-bold text-lg flex items-center gap-2"><Store className="w-5 h-5 text-primary" /> Informasi Toko</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Nama Toko" icon={<Store className="w-4 h-4" />} required>
              <input
                type="text"
                value={form.namaToko}
                onChange={e => setForm(f => ({ ...f, namaToko: e.target.value }))}
                placeholder="Contoh: INDO DUTA TECH"
                required
                className={inputCls}
              />
            </Field>
            <Field label="Tagline" icon={<Tv2 className="w-4 h-4" />}>
              <input
                type="text"
                value={form.tagline}
                onChange={e => setForm(f => ({ ...f, tagline: e.target.value }))}
                placeholder="Contoh: Premium Reseller"
                className={inputCls}
              />
            </Field>
            <Field label="No. Telepon / WA" icon={<Phone className="w-4 h-4" />}>
              <input
                type="text"
                value={form.telepon}
                onChange={e => setForm(f => ({ ...f, telepon: e.target.value }))}
                placeholder="0812xxxxxxxx"
                className={inputCls}
              />
            </Field>
            <Field label="Email" icon={<Mail className="w-4 h-4" />}>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="toko@email.com"
                className={inputCls}
              />
            </Field>
            <Field label="Alamat" icon={<MapPin className="w-4 h-4" />} className="md:col-span-2">
              <textarea
                value={form.alamat}
                onChange={e => setForm(f => ({ ...f, alamat: e.target.value }))}
                placeholder="Jl. Contoh No. 1, Kota, Provinsi"
                rows={2}
                className={cn(inputCls, "resize-none")}
              />
            </Field>
          </div>
        </section>

        {/* Sosial Media */}
        <section className="bg-card border border-border rounded-xl p-6 space-y-4">
          <h2 className="font-bold text-lg flex items-center gap-2">
            <Instagram className="w-5 h-5 text-primary" /> Sosial Media
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Instagram" icon={<Instagram className="w-4 h-4" />}>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">@</span>
                <input
                  type="text"
                  value={form.instagram}
                  onChange={e => setForm(f => ({ ...f, instagram: e.target.value.replace(/^@/, "") }))}
                  placeholder="username"
                  className={cn(inputCls, "pl-7")}
                />
              </div>
            </Field>
            <Field label="WhatsApp" icon={<MessageCircle className="w-4 h-4" />}>
              <input
                type="text"
                value={form.whatsapp}
                onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))}
                placeholder="0812xxxxxxxx"
                className={inputCls}
              />
            </Field>
            <Field label="Facebook" icon={<Facebook className="w-4 h-4" />}>
              <input
                type="text"
                value={form.facebook}
                onChange={e => setForm(f => ({ ...f, facebook: e.target.value }))}
                placeholder="nama halaman"
                className={inputCls}
              />
            </Field>
            <Field label="TikTok" icon={<Tv2 className="w-4 h-4" />}>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">@</span>
                <input
                  type="text"
                  value={form.tiktok}
                  onChange={e => setForm(f => ({ ...f, tiktok: e.target.value.replace(/^@/, "") }))}
                  placeholder="username"
                  className={cn(inputCls, "pl-7")}
                />
              </div>
            </Field>
            <Field label="Website" icon={<Globe className="w-4 h-4" />} className="md:col-span-2">
              <input
                type="text"
                value={form.website}
                onChange={e => setForm(f => ({ ...f, website: e.target.value }))}
                placeholder="https://tokosaya.com"
                className={inputCls}
              />
            </Field>
          </div>
        </section>

        <button
          type="submit"
          disabled={updateSettings.isPending}
          className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-base"
        >
          <Save className="w-5 h-5" />
          {updateSettings.isPending ? "Menyimpan..." : "Simpan Pengaturan"}
        </button>
      </form>
    </div>
  );
}

const inputCls = "w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors";

function Field({
  label, icon, children, required, className
}: {
  label: string; icon: React.ReactNode; children: React.ReactNode; required?: boolean; className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
        <span className="text-muted-foreground">{icon}</span>
        {label}
        {required && <span className="text-destructive">*</span>}
      </label>
      {children}
    </div>
  );
}
