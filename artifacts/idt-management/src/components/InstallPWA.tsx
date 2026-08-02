import { useState, useEffect } from "react";
import { Download, X, Smartphone } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPWA() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);

  useEffect(() => {
    // Already installed as standalone
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setInstalled(true);
      return;
    }

    // Detect iOS Safari (no beforeinstallprompt support)
    const isIos =
      /iphone|ipad|ipod/i.test(navigator.userAgent) &&
      !("MSStream" in window);
    const isInStandaloneMode =
      "standalone" in window.navigator &&
      (window.navigator as { standalone?: boolean }).standalone;

    if (isIos && !isInStandaloneMode) {
      setShowIosGuide(true);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => {
      setInstalled(true);
      setPrompt(null);
    });

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!prompt) return;
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === "accepted") setInstalled(true);
    setPrompt(null);
  };

  if (installed || dismissed) return null;

  // Android / Chrome — native install banner
  if (prompt) {
    return (
      <div className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-80 z-50 animate-in slide-in-from-bottom-4 duration-300">
        <div className="bg-card border border-border rounded-2xl shadow-2xl p-4 flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
            <Smartphone className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm text-foreground">Install di Android</p>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              Tambahkan IDT Management ke layar utama HP untuk akses lebih cepat.
            </p>
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleInstall}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground text-xs font-bold rounded-lg hover:bg-primary/90 transition-colors"
              >
                <Download className="w-3.5 h-3.5" /> Install
              </button>
              <button
                onClick={() => setDismissed(true)}
                className="px-3 py-1.5 bg-secondary text-muted-foreground text-xs font-medium rounded-lg hover:bg-secondary/80 transition-colors"
              >
                Nanti saja
              </button>
            </div>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="p-1 hover:bg-secondary rounded-md transition-colors text-muted-foreground shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  // iOS Safari — manual guide
  if (showIosGuide) {
    return (
      <div className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-80 z-50 animate-in slide-in-from-bottom-4 duration-300">
        <div className="bg-card border border-border rounded-2xl shadow-2xl p-4 flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
            <Smartphone className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm text-foreground">Install di iPhone/iPad</p>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Tap ikon <strong>Share</strong> (kotak dengan panah ↑) di Safari, lalu pilih <strong>"Add to Home Screen"</strong>.
            </p>
            <button
              onClick={() => setDismissed(true)}
              className="mt-3 px-3 py-1.5 bg-secondary text-muted-foreground text-xs font-medium rounded-lg hover:bg-secondary/80 transition-colors"
            >
              Mengerti
            </button>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="p-1 hover:bg-secondary rounded-md transition-colors text-muted-foreground shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  return null;
}
