import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff, LogIn, Loader2, AlertCircle, Fingerprint, KeyRound, CheckCircle2, ShieldCheck } from "lucide-react";
import { startRegistration, startAuthentication } from "@simplewebauthn/browser";
import type { AuthUser } from "@/hooks/useAuth";

// ─── Step 1: Password Login ────────────────────────────────────────────────────
function PasswordLoginForm({ onSuccess }: { onSuccess: (user: AuthUser) => void }) {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/auth/login/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onSuccess(data.user as AuthUser);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login gagal");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1">Username</label>
        <input
          type="text"
          value={username}
          onChange={e => setUsername(e.target.value)}
          className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary"
          autoComplete="username"
          disabled={busy}
          required
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1">Password</label>
        <div className="relative">
          <input
            type={showPw ? "text" : "password"}
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 pr-10 text-sm text-foreground focus:outline-none focus:border-primary"
            autoComplete="current-password"
            placeholder="Masukkan password"
            disabled={busy}
            required
          />
          <button type="button" onClick={() => setShowPw(v => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>
      {error && (
        <div className="bg-destructive/10 border border-destructive/30 text-destructive text-xs rounded-lg px-3 py-2.5 flex items-start gap-2">
          <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" /><span>{error}</span>
        </div>
      )}
      <button type="submit" disabled={busy}
        className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50">
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
        {busy ? "Memproses..." : "Login"}
      </button>
    </form>
  );
}

// ─── Step 2: Setup Wizard (change password + register biometric) ───────────────
function SetupWizard({ user, onComplete }: { user: AuthUser; onComplete: () => void }) {
  const [step, setStep] = useState<"password" | "biometric" | "done">("password");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [biometricError, setBiometricError] = useState("");
  const [biometricBusy, setBiometricBusy] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (newPw.length < 6) { setError("Password minimal 6 karakter"); return; }
    if (newPw !== confirmPw) { setError("Konfirmasi password tidak cocok"); return; }
    setBusy(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ newPassword: newPw }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStep("biometric");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengubah password");
    } finally {
      setBusy(false);
    }
  };

  const handleRegisterBiometric = async () => {
    setBiometricError("");
    setBiometricBusy(true);
    try {
      const origin = window.location.origin;
      const beginRes = await fetch("/api/auth/register/begin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ origin }),
      });
      if (!beginRes.ok) { const d = await beginRes.json(); throw new Error(d.error); }
      const options = await beginRes.json();

      const credential = await startRegistration({ optionsJSON: options });

      const finishRes = await fetch("/api/auth/register/finish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(credential),
      });
      if (!finishRes.ok) { const d = await finishRes.json(); throw new Error(d.error); }

      setStep("done");
      setTimeout(onComplete, 1200);
    } catch (err) {
      if (err instanceof Error && err.name === "NotAllowedError") {
        setBiometricError("Akses biometrik ditolak atau dibatalkan.");
      } else {
        setBiometricError(err instanceof Error ? err.message : "Gagal mendaftarkan biometrik");
      }
    } finally {
      setBiometricBusy(false);
    }
  };

  const handleSkipBiometric = () => {
    setStep("done");
    setTimeout(onComplete, 800);
  };

  return (
    <div className="space-y-4">
      {/* Stepper */}
      <div className="flex items-center gap-2 mb-6">
        {[
          { key: "password", label: "Ganti Password", icon: KeyRound },
          { key: "biometric", label: "Daftar Biometrik", icon: Fingerprint },
        ].map((s, i) => {
          const done = (step === "biometric" && s.key === "password") || step === "done";
          const active = step === s.key;
          return (
            <div key={s.key} className="flex-1 flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold transition-colors
                ${done ? "bg-emerald-500 text-white" : active ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
                {done ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
              </div>
              <span className={`text-xs font-medium ${active ? "text-foreground" : "text-muted-foreground"}`}>{s.label}</span>
              {i < 1 && <div className={`flex-1 h-px ${done ? "bg-emerald-500/50" : "bg-border"}`} />}
            </div>
          );
        })}
      </div>

      {/* Step: Password */}
      {step === "password" && (
        <form onSubmit={handleChangePassword} className="space-y-3">
          <div className="bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs rounded-lg px-3 py-2.5">
            Anda menggunakan password default. Wajib ganti sekarang.
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Password Baru</label>
            <div className="relative">
              <input type={showPw ? "text" : "password"} value={newPw} onChange={e => setNewPw(e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 pr-10 text-sm text-foreground focus:outline-none focus:border-primary"
                placeholder="Minimal 6 karakter" disabled={busy} required />
              <button type="button" onClick={() => setShowPw(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Konfirmasi Password</label>
            <input type={showPw ? "text" : "password"} value={confirmPw} onChange={e => setConfirmPw(e.target.value)}
              className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary"
              placeholder="Ulangi password baru" disabled={busy} required />
          </div>
          {error && (
            <div className="bg-destructive/10 border border-destructive/30 text-destructive text-xs rounded-lg px-3 py-2.5 flex items-start gap-2">
              <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" /><span>{error}</span>
            </div>
          )}
          <button type="submit" disabled={busy}
            className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
            {busy ? "Menyimpan..." : "Simpan Password Baru"}
          </button>
        </form>
      )}

      {/* Step: Biometric */}
      {step === "biometric" && (
        <div className="space-y-4 text-center">
          <div className={`w-20 h-20 rounded-full border-2 flex items-center justify-center mx-auto transition-all duration-300
            ${biometricBusy ? "border-primary bg-primary/10 scale-110" : "border-border bg-secondary/50"}`}>
            {biometricBusy
              ? <Loader2 className="w-9 h-9 text-primary animate-spin" />
              : <Fingerprint className="w-9 h-9 text-primary" />}
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground mb-1">Daftarkan Biometrik</p>
            <p className="text-xs text-muted-foreground">Gunakan sidik jari atau Face ID untuk login lebih cepat.</p>
          </div>
          {biometricError && (
            <div className="bg-destructive/10 border border-destructive/30 text-destructive text-xs rounded-lg px-3 py-2.5 flex items-start gap-2 text-left">
              <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" /><span>{biometricError}</span>
            </div>
          )}
          <button onClick={handleRegisterBiometric} disabled={biometricBusy}
            className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50">
            {biometricBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Fingerprint className="w-4 h-4" />}
            {biometricBusy ? "Memproses..." : "Aktifkan Biometrik"}
          </button>
          <button onClick={handleSkipBiometric} disabled={biometricBusy}
            className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors py-1">
            Lewati, aktifkan nanti
          </button>
        </div>
      )}

      {/* Done */}
      {step === "done" && (
        <div className="text-center space-y-3 py-4">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border-2 border-emerald-500/50 flex items-center justify-center mx-auto">
            <ShieldCheck className="w-8 h-8 text-emerald-500" />
          </div>
          <p className="font-semibold text-foreground">Setup Selesai!</p>
          <p className="text-xs text-muted-foreground">Masuk ke dashboard...</p>
        </div>
      )}
    </div>
  );
}

// ─── Main export ───────────────────────────────────────────────────────────────
export default function LoginPage() {
  const queryClient = useQueryClient();
  const [loggedInUser, setLoggedInUser] = useState<AuthUser | null>(null);

  const handlePasswordSuccess = (user: AuthUser) => {
    setLoggedInUser(user);
    // If no setup needed, go straight in
    if (!user.mustChangePassword) {
      queryClient.invalidateQueries({ queryKey: ["auth"] });
    }
  };

  const handleSetupComplete = () => {
    queryClient.invalidateQueries({ queryKey: ["auth"] });
  };

  const showSetup = loggedInUser && loggedInUser.mustChangePassword;
  const title = showSetup ? "Setup Akun" : "Selamat Datang";
  const subtitle = showSetup ? "Selesaikan setup sebelum melanjutkan" : "Login ke sistem management";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center text-2xl font-black mx-auto mb-4 shadow-lg shadow-primary/30">
            IDT
          </div>
          <h1 className="text-2xl font-bold text-foreground">INDO DUTA TECH</h1>
          <p className="text-xs text-muted-foreground uppercase tracking-widest mt-1">Premium Reseller</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-xl">
          <h2 className="text-center text-lg font-semibold text-foreground mb-1">{title}</h2>
          <p className="text-center text-xs text-muted-foreground mb-6">{subtitle}</p>

          {showSetup ? (
            <SetupWizard user={loggedInUser} onComplete={handleSetupComplete} />
          ) : (
            <PasswordLoginForm onSuccess={handlePasswordSuccess} />
          )}
        </div>

        <p className="text-center text-[10px] text-muted-foreground mt-6">
          INDO DUTA TECH · Sistem Management Internal
        </p>
      </div>
    </div>
  );
}
