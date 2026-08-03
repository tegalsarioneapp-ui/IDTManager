import { useState } from 'react';
import {
  startRegistration,
  startAuthentication,
} from '@simplewebauthn/browser';
import { useAuth } from '@/context/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Fingerprint, Loader2, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const { hasRegistered, refetch } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [deviceName, setDeviceName] = useState('');
  const [showNameInput, setShowNameInput] = useState(false);

  async function handleRegister() {
    if (!deviceName.trim()) {
      setShowNameInput(true);
      return;
    }
    setLoading(true);
    try {
      // 1. Get registration options from server
      const optRes = await fetch('/api/auth/register/start', { method: 'POST' });
      if (!optRes.ok) {
        const err = await optRes.json() as { error: string };
        throw new Error(err.error);
      }
      const options = await optRes.json();

      // 2. Trigger browser biometric prompt
      const credential = await startRegistration({ optionsJSON: options });

      // 3. Send result to server
      const verRes = await fetch('/api/auth/register/finish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...credential, deviceName: deviceName.trim() }),
      });
      if (!verRes.ok) {
        const err = await verRes.json() as { error: string };
        throw new Error(err.error);
      }

      toast({ title: 'Perangkat terdaftar!', description: 'Login berhasil.' });
      await refetch();
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'NotAllowedError') {
        toast({ title: 'Dibatalkan', description: 'Pendaftaran dibatalkan.' });
      } else {
        toast({
          title: 'Gagal mendaftar',
          description: err instanceof Error ? err.message : 'Terjadi kesalahan.',
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin() {
    setLoading(true);
    try {
      // 1. Get authentication options from server
      const optRes = await fetch('/api/auth/login/start', { method: 'POST' });
      if (!optRes.ok) {
        const err = await optRes.json() as { error: string };
        throw new Error(err.error);
      }
      const options = await optRes.json();

      // 2. Trigger browser biometric prompt
      const credential = await startAuthentication({ optionsJSON: options });

      // 3. Verify with server
      const verRes = await fetch('/api/auth/login/finish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credential),
      });
      if (!verRes.ok) {
        const err = await verRes.json() as { error: string };
        throw new Error(err.error);
      }

      toast({ title: 'Login berhasil!' });
      await refetch();
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'NotAllowedError') {
        toast({ title: 'Dibatalkan', description: 'Autentikasi dibatalkan.' });
      } else {
        toast({
          title: 'Login gagal',
          description: err instanceof Error ? err.message : 'Terjadi kesalahan.',
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-8">
        {/* Logo & Brand */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary text-primary-foreground text-xl font-bold shadow-lg">
            IDT
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">INDO DUTA TECH</h1>
            <p className="text-sm text-muted-foreground mt-1">Sistem Manajemen Internal</p>
          </div>
        </div>

        {/* Auth Card */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-6">
          <div className="text-center space-y-1">
            <div className="flex justify-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Fingerprint className="w-6 h-6 text-primary" />
              </div>
            </div>
            <h2 className="font-semibold text-lg mt-3">
              {hasRegistered ? 'Login Biometrik' : 'Setup Awal'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {hasRegistered
                ? 'Gunakan sidik jari atau Face ID untuk masuk'
                : 'Daftarkan perangkat biometrik untuk mengamankan akses'}
            </p>
          </div>

          {/* Register flow: ask device name first */}
          {!hasRegistered && (
            <div className="space-y-3">
              {showNameInput || (
                <p className="text-xs text-muted-foreground text-center bg-muted/50 rounded-lg p-3">
                  Anda akan diminta untuk verifikasi biometrik (sidik jari / Face ID) melalui perangkat ini.
                </p>
              )}
              {showNameInput && (
                <div className="space-y-1.5">
                  <Label htmlFor="deviceName" className="text-sm">Nama Perangkat</Label>
                  <Input
                    id="deviceName"
                    placeholder="cth: iPhone Saya, Laptop Kantor"
                    value={deviceName}
                    onChange={(e) => setDeviceName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') void handleRegister(); }}
                    autoFocus
                  />
                  <p className="text-xs text-muted-foreground">Untuk memudahkan identifikasi perangkat.</p>
                </div>
              )}
              <Button
                className="w-full gap-2"
                size="lg"
                onClick={() => void handleRegister()}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Fingerprint className="w-4 h-4" />
                )}
                {loading ? 'Mendaftarkan...' : showNameInput ? 'Daftarkan Sekarang' : 'Daftarkan Perangkat'}
              </Button>
            </div>
          )}

          {/* Login flow */}
          {hasRegistered && (
            <Button
              className="w-full gap-2"
              size="lg"
              onClick={() => void handleLogin()}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Fingerprint className="w-4 h-4" />
              )}
              {loading ? 'Memverifikasi...' : 'Masuk dengan Biometrik'}
            </Button>
          )}
        </div>

        {/* Footer */}
        <div className="text-center flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Dilindungi WebAuthn · Kunci privat tidak meninggalkan perangkat</span>
        </div>
      </div>
    </div>
  );
}
