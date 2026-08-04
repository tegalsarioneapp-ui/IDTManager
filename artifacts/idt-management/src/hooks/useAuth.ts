import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

export interface AuthUser {
  id: number;
  username: string;
  displayName: string;
  mustChangePassword: boolean;
}

export function useAuth() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<AuthUser | null>({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (res.status === 401) return null;
      if (!res.ok) throw new Error("Failed to fetch auth");
      return res.json() as Promise<AuthUser>;
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["auth"] });
  }, [queryClient]);

  return {
    user: data ?? null,
    isLoading,
    invalidate,
  };
}
