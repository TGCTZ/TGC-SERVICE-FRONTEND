# Data fetching

Every read goes through TanStack Query. No feature calls `axios` directly, and
no feature keeps server data in `useState`.

## The path

```mermaid
flowchart TD
    COMP["Component<br/>useQuery(productsQueryOptions(params))"] --> CACHE{"cache hit and<br/>still fresh?"}

    CACHE -->|"yes, under staleTime"| SERVE(["return cached data<br/>no request"])
    CACHE -->|"stale"| BOTH["return cached data<br/>and refetch in background"]
    CACHE -->|miss| FETCH["run queryFn"]

    BOTH --> FETCH
    FETCH --> APIFN["fetchProducts(params)<br/><b>features/products/data/products-api.ts</b>"]
    APIFN --> BUILD["buildListParams(params)<br/><b>lib/api-query.ts</b>"]
    BUILD --> AXIOS["api.get('/products', { params })<br/><b>lib/api.ts</b>"]
    AXIOS --> INTER["request interceptor<br/>attaches Bearer token"]
    INTER --> BACKEND[("Backend /api/v1")]

    BACKEND --> PARSE["zod .parse(res.data)"]
    PARSE --> VALID{"shape matches<br/>the schema?"}
    VALID -->|no| THROW(["throw — surfaced as a query error"])
    VALID -->|yes| STORE["normalise to { items, meta }"]
    STORE --> CACHED(["cached under the query key"])

    style COMP stroke:#4d90d9,stroke-width:2px
    style CACHE stroke:#d99a2b,stroke-width:2px
    style VALID stroke:#d99a2b,stroke-width:2px
    style SERVE stroke:#3fa860,stroke-width:2px
    style CACHED stroke:#3fa860,stroke-width:2px
    style THROW stroke:#d9534f,stroke-width:2px
```

## Validating at the boundary

`zod` parses every response before it reaches a component. That converts a
backend contract change from a mystery — `undefined is not an object`, three
components deep, on a user's machine — into a loud, specific failure at the
network boundary with the offending field named.

```mermaid
flowchart LR
    NOPARSE["Unparsed response"] --> DEEP["undefined blows up<br/>deep inside a component"]
    PARSE["zod .parse()"] --> LOUD["ZodError naming<br/>the exact field"]

    style NOPARSE stroke:#d9534f,stroke-width:2px
    style DEEP stroke:#d9534f,stroke-width:2px
    style PARSE stroke:#3fa860,stroke-width:2px
    style LOUD stroke:#3fa860,stroke-width:2px
```

## Query keys and caching

```mermaid
flowchart TD
    K1["['products', params]<br/><i>one entry per page + filter combination</i>"]
    K2["['products', 'detail', id]"]
    K3["['lookup', resource, key]<br/><i>staleTime 10 minutes</i>"]

    K1 --> INV["invalidateQueries({ queryKey: ['products'] })<br/>after any product write"]
    K2 --> INV
    K3 --> RARE["rarely invalidated —<br/>lookups barely change"]

    style K1 stroke:#4d90d9,stroke-width:2px
    style K2 stroke:#4d90d9,stroke-width:2px
    style K3 stroke:#4d90d9,stroke-width:2px
    style INV stroke:#3fa860,stroke-width:2px
```

Because `params` is part of the key, every page and filter combination caches
separately — paging back to page 1 is instant. The prefix `['products']` covers
both list and detail entries, so a single `invalidateQueries` after a write
refreshes everything that could have changed.

`placeholderData: (previous) => previous` keeps the previous page on screen
while the next loads, instead of collapsing to a skeleton on every keystroke.

## Lookups

```mermaid
flowchart LR
    FORM["Any product form"] --> LOOK["lookupQueryOptions(resource, key)"]
    LOOK --> ONCE["per_page=100, filter[is_active]=1,<br/>sort_by=name"]
    ONCE --> CACHE10["cached for 10 minutes"]
    CACHE10 --> SHARED["shared by every form<br/>and filter dropdown"]

    style FORM stroke:#4d90d9,stroke-width:2px
    style SHARED stroke:#3fa860,stroke-width:2px
```

Categories, brands, statuses, units and tags are small and change rarely, so
they are fetched once at a large page size and reused for the session rather
than refetched per dialog.

## Where each kind of state belongs

```mermaid
flowchart LR
    SERVER["Server data<br/><i>products, users, lookups</i>"] --> TQ["TanStack Query"]
    SESSION["Session<br/><i>token, current user</i>"] --> ZU["Zustand — useAuthStore"]
    TABLE["Table state<br/><i>page, search, filters, sort</i>"] --> URLS["URL search params"]
    PREFS["Theme, font, direction"] --> CTX["React Context"]
    LOCAL["Dialog open, current row"] --> RC["Feature provider / useState"]

    style SERVER stroke:#4d90d9,stroke-width:2px
    style SESSION stroke:#4d90d9,stroke-width:2px
    style TABLE stroke:#4d90d9,stroke-width:2px
    style PREFS stroke:#4d90d9,stroke-width:2px
    style LOCAL stroke:#4d90d9,stroke-width:2px
```

Server data never gets copied into `useState`. The moment it does, there are two
sources of truth and one of them is wrong.
