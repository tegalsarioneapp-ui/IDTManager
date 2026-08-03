import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { Shell } from '@/components/layout/shell';
import { InstallPWA } from '@/components/InstallPWA';
import { useAuth } from '@/hooks/useAuth';
import LoginPage from '@/pages/login';
import { Loader2 } from 'lucide-react';

// Pages
import Dashboard from '@/pages/dashboard';
import Beli from '@/pages/beli';
import QcList from '@/pages/qc';
import JualList from '@/pages/jual';
import TerjualList from '@/pages/terjual';
import Laporan from '@/pages/laporan';
import Sosmed from '@/pages/sosmed';
import SettingsPage from '@/pages/settings';

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

function AppRoutes() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <Shell>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/beli" component={Beli} />
        <Route path="/qc" component={QcList} />
        <Route path="/jual" component={JualList} />
        <Route path="/terjual" component={TerjualList} />
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
          <AppRoutes />
        </WouterRouter>
        <Toaster />
        <InstallPWA />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
