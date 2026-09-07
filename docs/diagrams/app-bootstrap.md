# App bootstrap

Everything `src/main.tsx` sets up before the first pixel renders.

## Provider tree

```mermaid
flowchart TD
    ENV["import '@/env'<br/><i>validates env vars, fails fast</i>"] --> QC
    QC["new QueryClient(...)<br/>defaults + QueryCache onError"] --> ROUTER
    ROUTER["createRouter({ routeTree, context: { queryClient } })<br/><i>routeTree.gen.ts is generated</i>"] --> RENDER

    RENDER["ReactDOM.createRoot().render()"] --> SM["StrictMode"]
    SM --> QCP["QueryClientProvider"]
    QCP --> TP["ThemeProvider"]
    TP --> FP["FontProvider"]
    FP --> DP["DirectionProvider"]
    DP --> RP["RouterProvider"]
    RP --> APP["the app"]

    style ENV stroke:#4d90d9,stroke-width:2px
    style APP stroke:#3fa860,stroke-width:2px
```

The router is created with `context: { queryClient }`, which is what lets a
route's `beforeLoad` call `context.queryClient.ensureQueryData(...)` — that is
how the auth guard fetches the current user before rendering.

`import '@/env'` runs first on purpose: a missing `VITE_API_URL` should stop the
app at startup with a clear message, not surface later as a request to
`undefined/products`.

## QueryClient defaults

```mermaid
flowchart TD
    Q["Query fails"] --> RETRY{"retry(failureCount, error)"}

    RETRY -->|"DEV: any failure"| STOP["stop immediately<br/><i>fail loudly while developing</i>"]
    RETRY -->|"401 or 403"| STOP2["never retry<br/><i>a permission problem<br/>will not fix itself</i>"]
    RETRY -->|"PROD, count over 3"| STOP3["give up"]
    RETRY -->|otherwise| AGAIN["retry"]

    style Q stroke:#4d90d9,stroke-width:2px
    style RETRY stroke:#d99a2b,stroke-width:2px
    style STOP2 stroke:#d9534f,stroke-width:2px
```

| Default | Value | Why |
| --- | --- | --- |
| `staleTime` | 10s | Cached data is reused for 10 seconds before a background refetch |
| `refetchOnWindowFocus` | production only | Refetching on every alt-tab is noise while developing |
| `retry` | custom | Never retries 401 or 403; no retries at all in dev |

## Global error wiring

Two separate hooks, and the split matters:

```mermaid
flowchart LR
    subgraph cache["QueryCache onError — reads"]
        direction TB
        C401["401 → toast 'Session expired'<br/>auth.reset() → /sign-in?redirect=..."]
        C500["500 → toast<br/>navigate to /500 (production only)"]
        C403["403 → no global handling"]
    end

    subgraph mut["mutations.onError — writes"]
        direction TB
        M1["handleServerError(error)"]
        M2["304 → 'Content not modified'"]
    end

    style cache stroke:#4d90d9,stroke-width:2px
    style mut stroke:#d99a2b,stroke-width:2px
```

A failed **read** is usually a session or server problem, so it is handled
globally. A failed **write** usually needs to be shown next to the form that
caused it, so the global handler only produces a toast and leaves the specific
handling to the mutation — see [mutations.md](mutations.md).

The 500 redirect is guarded by `import.meta.env.PROD` so a server restart during
development does not throw you off the page you are working on.
