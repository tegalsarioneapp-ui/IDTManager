import { useState, useEffect } from "react";
import { startRegistration, startAuthentication } from "@simplewebauthn/browser";
import { useQueryClient } from "@tanstack/react-query";
import { Fingerprint, Loader2, AlertCircle, UserPlus, LogIn } from "lucide-react";

type Mode = "loading" | "login" | "register";

interface RegisteredUser {
  id: number;
  username: string;
  displayName: string;
}

export default function LoginPage() {
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<Mode>("loading");
  const [registeredUsers, setRegisteredUsers] = useState<RegisteredUser[]>([]);
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const [checkRes, usersRes] = await Promise.all([
          fetch("/api/auth/check").then((r) => r.json()) as Promise<{ hasUsers: boolean }>,
          fetch("/api/auth/users").then((r) => r.json()) as Promise<RegisteredUser[]>,
        ]);
        setRegisteredUsers(usersRes);
        if (checkRes.hasUsers) {
          setMode("login");
          // Auto-fill if only one user
          if (usersRes.length === 1) setUsername(usersRes[0].username);
        } else {
          setMode("register");
        }
      } catch {
        setMode("register");
      }
    })();
  }, []);

  const handleRegister = async () => {
    setError("");
    setBusy(true);
    try {
      const origin = window.location.origin;
      // Begin registration
      const beginRes = await fetch("/api/auth/register/begin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, displayName, origin }),
      });
      if (!beginRes.ok) {
        const { error: msg } = await beginRes.json();
        throw new Error(msg);
      }
      const options = await beginRes.json();

      // Trigger browser biometric prompt
      const credential = await startRegistration({ optionsJSON: options });

      // Finish registration
      const finishRes = await fetch("/api/auth/register/finish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(credential),
      });
      if (!finishRes.ok) {
        const { error: msg } = await finishRes.json();
        throw new Error(msg);
      }
      setSuccess("Biometrik berhasil didaftarkan!");
      await queryClient.invalidateQueries({ queryKey: ["auth"] });
    } catch (err) {
      if (err instanceof Error && err.name === "NotAllowedError") {
        setError("Akses biometrik ditolak. Coba lagi dan izinkan autentikasi.");
      } else {
        setError(err instanceof Error ? err.message : "Pendaftaran gagal");
      }
    } finally {
      setBusy(false);
    }
  };

  const handleLogin = async () => {
    setError("");
    setBusy(true);
    try {
      const origin = window.location.origin;
      // Begin login
      const beginRes = await fetch("/api/auth/login/begin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, origin }),
      });
      if (!beginRes.ok) {
        const { error: msg } = await beginRes.json();
        throw new Error(msg);
      }
      const options = await beginRes.json();

      // Trigger browser biometric prompt
      const credential = await startAuthentication({ optionsJSON: options });

      // Finish login
      const finishRes = await fetch("/api/auth/login/finish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(credential),
      });
      if (!finishRes.ok) {
        const { error: msg } = await finishRes.json();
        throw new Error(msg);
      }
      await queryClient.invalidateQueries({ queryKey: ["auth"] });
    } catch (err) {
      if (err instanceof Error && err.name === "NotAllowedError") {
        setError("Autentikasi dibatalkan. Coba lagi.");
      } else {
        setError(err instanceof Error ? err.message : "Login gagal");
      }
    } finally {
      setBusy(false);
    }
  };

  if (mode === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center text-2xl font-black mx-auto mb-4 shadow-lg shadow-primary/30">
            IDT
          </div>
          <h1 className="text-2xl font-bold text-foreground">INDO DUTA TECH</h1>
          <p className="text-xs text-muted-foreground uppercase tracking-widest mt-1">
            Premium Reseller
          </p>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-xl">
          {/* Biometric icon */}
          <div className="flex justify-center mb-6">
            <div
              className={`w-20 h-20 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                busy
                  ? "border-primary bg-primary/10 scale-110"
                  : "border-border bg-secondary/50 hover:border-primary/50"
              }`}
            >
              {busy ? (
                <Loader2 className="w-9 h-9 text-primary animate-spin" />
              ) : (
                <Fingerprint
                  className={`w-9 h-9 transition-colors ${
                    mode === "login" ? "text-primary" : "text-muted-foreground"
                  }`}
                />
              )}
            </div>
          </div>

          <h2 className="text-center text-lg font-semibold text-foreground mb-1">
            {mode === "login" ? "Selamat Datang" : "Setup Akun Baru"}
          </h2>
          <p className="text-center text-xs text-muted-foreground mb-6">
            {mode === "login"
              ? "Gunakan biometrik untuk masuk"
              : "Daftarkan sidik jari atau Face ID Anda"}
          </p>

          {/* Username input */}
          <div className="mb-3">
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Username
            </label>
            {mode === "login" && registeredUsers.length > 1 ? (
              <select
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={busy}
              >
                <option value="">Pilih akun...</option>
                {registeredUsers.map((u) => (
                  <option key={u.id} value={u.username}>
                    {u.displayName} ({u.username})
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                placeholder={mode === "login" ? "Username Anda" : "Contoh: admin"}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (mode === "login" ? handleLogin() : undefined)}
                disabled={busy}
                autoComplete="username"
              />
            )}
          </div>

          {/* Display name — only for registration */}
          {mode === "register" && (
            <div className="mb-3">
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Nama Tampil
              </label>
              <input
                type="text"
                placeholder="Contoh: Admin IDT"
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                disabled={busy}
                autoComplete="name"
              />
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mb-4 bg-destructive/10 border border-destructive/30 text-destructive text-xs rounded-lg px-3 py-2.5 flex items-start gap-2">
              <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="mb-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs rounded-lg px-3 py-2.5">
              {success}
            </div>
          )}

          {/* Primary action button */}
          <button
            onClick={mode === "login" ? handleLogin : handleRegister}
            disabled={busy || !username.trim() || (mode === "register" && !displayName.trim())}
            className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {busy ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : mode === "login" ? (
              <Fingerprint className="w-4 h-4" />
            ) : (
              <UserPlus className="w-4 h-4" />
            )}
            {busy
              ? "Memproses..."
              : mode === "login"
              ? "Login dengan Biometrik"
              : "Daftar Biometrik"}
          </button>

          {/* Mode toggle */}
          <div className="mt-4 text-center">
            {mode === "login" ? (
              <button
                onClick={() => { setMode("register"); setError(""); setSuccess(""); }}
                className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 mx-auto"
              >
                <UserPlus className="w-3 h-3" />
                Daftarkan akun baru
              </button>
            ) : (
              registeredUsers.length > 0 && (
                <button
                  onClick={() => { setMode("login"); setError(""); setSuccess(""); }}
                  className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 mx-auto"
                >
                  <LogIn className="w-3 h-3" />
                  Sudah punya akun? Login
                </button>
              )
            )}
          </div>
        </div>

        <p className="text-center text-[10px] text-muted-foreground mt-6">
          Dilindungi WebAuthn · Biometrik tidak meninggalkan perangkat Anda
        </p>
      </div>
    </div>
  );
}
