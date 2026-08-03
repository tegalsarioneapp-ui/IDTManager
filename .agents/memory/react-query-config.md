---
name: React Query configuration
description: QueryClient must set staleTime, retry, and refetchOnWindowFocus to avoid mass refetches
---

Default QueryClient (no options) causes: staleTime=0 (every window focus refetches all active queries), retry=3 (user waits 3x on failure), refetchOnWindowFocus=true (every alt-tab triggers all queries).

**Correct config:**
```ts
new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,
      gcTime: 5 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})
```

**Why:** Management app data doesn't change every second. Excessive refetches cause perceived slowness and unnecessary DB load.
