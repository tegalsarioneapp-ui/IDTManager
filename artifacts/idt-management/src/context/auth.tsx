import { createContext, useCallback, useContext, useEffect, useState } from 'react';

interface AuthState {
  isLoggedIn: boolean;
  isLoading: boolean;
  hasRegistered: boolean;
  username?: string;
}

interface AuthContextValue extends AuthState {
  refetch: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    isLoggedIn: false,
    isLoading: true,
    hasRegistered: false,
  });

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/status');
      if (!res.ok) throw new Error('Status fetch failed');
      const data = await res.json() as { loggedIn: boolean; hasRegistered?: boolean; username?: string };
      setState({
        isLoggedIn: data.loggedIn,
        isLoading: false,
        hasRegistered: data.hasRegistered ?? data.loggedIn,
        username: data.username,
      });
    } catch {
      setState((s) => ({ ...s, isLoading: false }));
    }
  }, []);

  useEffect(() => {
    void fetchStatus();
  }, [fetchStatus]);

  const logout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    await fetchStatus();
  }, [fetchStatus]);

  return (
    <AuthContext.Provider value={{ ...state, refetch: fetchStatus, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
