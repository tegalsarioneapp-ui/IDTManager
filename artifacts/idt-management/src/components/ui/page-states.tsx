/**
 * Shared loading and error state components used across all pages.
 * - PageLoader  : skeleton/pulse while data is fetching
 * - PageError   : contextual error with a retry button
 */
import { AlertTriangle, RefreshCw } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

// ─── PageLoader ───────────────────────────────────────────────────────────────

interface PageLoaderProps {
  /** Short description shown while loading, e.g. "Memuat data QC..." */
  message?: string;
}

export function PageLoader({ message = "Memuat data..." }: PageLoaderProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] gap-3 p-8 text-muted-foreground">
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-2 h-2 rounded-full bg-primary/60 animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
      <p className="text-sm">{message}</p>
    </div>
  );
}

// ─── PageError ────────────────────────────────────────────────────────────────

interface PageErrorProps {
  /** Short label for what failed, e.g. "data QC" */
  label?: string;
  /** The raw error object from React Query */
  error?: Error | null;
  /** Query key(s) to invalidate on retry — pass the same key used in useQuery */
  queryKey?: unknown[];
}

export function PageError({
  label = "data",
  error,
  queryKey,
}: PageErrorProps) {
  const queryClient = useQueryClient();

  const handleRetry = () => {
    if (queryKey) {
      queryClient.invalidateQueries({ queryKey });
    } else {
      // fallback: invalidate everything
      queryClient.invalidateQueries();
    }
  };

  // If it's a 401, the shell will already redirect; just show a soft message
  const is401 =
    error instanceof Error && error.message.toLowerCase().includes("401");

  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] gap-4 p-8 text-center">
      <div className="w-14 h-14 rounded-2xl bg-destructive/10 flex items-center justify-center">
        <AlertTriangle className="w-7 h-7 text-destructive" />
      </div>
      <div>
        <p className="text-base font-semibold text-foreground mb-1">
          {is401 ? "Sesi habis" : `Gagal memuat ${label}`}
        </p>
        <p className="text-sm text-muted-foreground max-w-xs">
          {is401
            ? "Silakan login kembali."
            : "Periksa koneksi server, lalu coba lagi."}
        </p>
        {error && !is401 && (
          <p className="text-xs text-muted-foreground/60 mt-1 font-mono break-all max-w-xs">
            {error.message}
          </p>
        )}
      </div>
      {!is401 && (
        <button
          onClick={handleRetry}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary text-foreground text-sm font-medium hover:bg-secondary/80 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Coba Lagi
        </button>
      )}
    </div>
  );
}
