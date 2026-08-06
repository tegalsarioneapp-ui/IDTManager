import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter, Redirect } from 'wouter';
import { Shell } from '@/components/layout/shell';
import { InstallPWA } from '@/components/InstallPWA';
import { AuthProvider, useAuth } from '@/context/auth';
import LoginPage from '@/pages/login';

// Pages
import Dashboard from '@/pages/dashboard';
import Beli from '@/pages/beli';
import QcList from '@/pages/qc';
import JualList from '@/pages/jual';
import TerjualList from '@/pages/terjual';
import Laporan from '@/pages/laporan';
import Sosmed from '@/pages/sosmed';
import SettingsPage from '@/pages/settings';
import DaftarUnit from '@/pages/daftar-unit';
import Spareparts from '@/pages/spareparts';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,
      gcTime: 5 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  const { isLoggedIn, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm animate-pulse">
            IDT
          </div>
          <p className="text-sm">Memuat...</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <LoginPage />;
  }

  return (
    <Shell>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/beli" component={Beli} />
        <Route path="/spareparts" component={Spareparts} />
        <Route path="/qc" component={QcList} />
        <Route path="/jual" component={JualList} />
        <Route path="/terjual" component={TerjualList} />
        <Route path="/daftar" component={DaftarUnit} />
        <Route path="/laporan" component={Laporan} />
        <Route path="/sosmed" component={Sosmed} />
        <Route path="/settings" component={SettingsPage} />
        <Route component={NotFound} />
      </Switch>
    </Shell>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <AuthProvider>
            <Router />
          </AuthProvider>
        </WouterRouter>
        <Toaster />
        <InstallPWA />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
