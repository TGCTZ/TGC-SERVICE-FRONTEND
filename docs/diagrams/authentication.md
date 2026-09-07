# Authentication

Bearer token in a cookie, user object in memory, refresh handled transparently
by an Axios interceptor.

## Where the session lives

```mermaid
flowchart LR
    subgraph store["useAuthStore (Zustand)"]
        direction TB
        TOKEN["accessToken"]
        USER["user — id, permissions, roles"]
    end

    TOKEN --> COOKIE[("cookie<br/>alphadashboard_token")]
    USER --> MEMORY["memory only<br/><i>gone on refresh</i>"]

    COOKIE --> SURVIVE["survives a page refresh"]
    MEMORY --> REHYDRATE["re-fetched by the route guard<br/>via GET /auth/me"]

    style store stroke:#4d90d9,stroke-width:2px
    style SURVIVE stroke:#3fa860,stroke-width:2px
    style REHYDRATE stroke:#d99a2b,stroke-width:2px
```

Read `auth.user` expecting `null`. A component that assumes a user is present
will crash on a hard refresh — the guard fills it in, but only for routes under
`_authenticated`.

## Sign-in

```mermaid
sequenceDiagram
    autonumber
    participant U as User
    participant F as Sign-in form
    participant A as lib/api.ts
    participant API as Backend
    participant S as useAuthStore
    participant R as Router

    U->>F: submits email + password
    F->>A: POST /auth/login
    A->>API: request
    alt invalid credentials
        API-->>F: 401 or 422
        F-->>U: field errors or toast
    else success
        API-->>A: token + user
        A-->>F: response
        F->>S: setAccessToken(token)
        Note over S: mirrored into the cookie
        F->>S: setUser(user)
        F->>R: navigate to redirect target or /
    end
```

## Attaching the token

```mermaid
flowchart LR
    CALL["api.get('/products')"] --> REQI["request interceptor"]
    REQI --> READ["useAuthStore.getState()<br/>.auth.accessToken"]
    READ --> HAS{"token present?"}
    HAS -->|yes| SET["Authorization: Bearer token"]
    HAS -->|no| PLAIN["sent unauthenticated"]
    SET --> OUT(["request leaves"])
    PLAIN --> OUT

    style CALL stroke:#4d90d9,stroke-width:2px
    style HAS stroke:#d99a2b,stroke-width:2px
    style OUT stroke:#3fa860,stroke-width:2px
```

The interceptor reads the store with `getState()` rather than a hook, so the
current token is picked up per request without the module subscribing to React.

## Refresh on 401

```mermaid
flowchart TD
    RESP(["response interceptor<br/>catches an error"]) --> COND{"401, has a token,<br/>not already retried,<br/>and not the refresh call itself?"}

    COND -->|no| REJECT(["reject — caller handles it"])
    COND -->|yes| MARK["original._retry = true"]

    MARK --> SHARED{"a refresh already<br/>in flight?"}
    SHARED -->|yes| AWAIT["await the existing promise"]
    SHARED -->|no| START["start one, store it<br/>in refreshPromise"]

    AWAIT --> RESULT
    START --> RESULT

    RESULT{"refresh succeeded?"}
    RESULT -->|yes| RETRY["replay the original request<br/>with the new token"]
    RESULT -->|no| RESET["auth.reset()"]
    RESET --> REJECT

    RETRY --> OK(["original call resolves"])

    style RESP stroke:#4d90d9,stroke-width:2px
    style COND stroke:#d99a2b,stroke-width:2px
    style SHARED stroke:#d99a2b,stroke-width:2px
    style RESULT stroke:#d99a2b,stroke-width:2px
    style OK stroke:#3fa860,stroke-width:2px
    style REJECT stroke:#d9534f,stroke-width:2px
    style RESET stroke:#d9534f,stroke-width:2px
```

### The shared promise

```mermaid
flowchart LR
    subgraph without["Without refreshPromise"]
        direction TB
        W1["5 parallel requests 401"]
        W2["5 refresh calls fire"]
        W3["each mints a token and<br/>revokes the previous one"]
        W4["the session invalidates itself"]
        W1 --> W2 --> W3 --> W4
    end

    subgraph with["With refreshPromise"]
        direction TB
        G1["5 parallel requests 401"]
        G2["first starts the refresh,<br/>four await the same promise"]
        G3["one new token"]
        G4["all five replay and succeed"]
        G1 --> G2 --> G3 --> G4
    end

    style without stroke:#d9534f,stroke-width:2px
    style with stroke:#3fa860,stroke-width:2px
```

Three conditions guard the retry, and each prevents a specific loop:

| Guard | Prevents |
| --- | --- |
| `!original._retry` | Retrying forever when the new token is also rejected |
| `!isRefreshCall` | A dead session looping on `/auth/refresh` itself |
| `Boolean(accessToken)` | Trying to refresh when never signed in |

## Session expiry

When refresh fails, the interceptor resets the store and rejects. The toast and
redirect come from the `QueryCache` handler in `main.tsx`, not from here — the
interceptor's job is the token, not the user experience.

```mermaid
flowchart LR
    FAIL["refresh fails"] --> RST["interceptor: auth.reset()"]
    RST --> REJ["error propagates<br/>to TanStack Query"]
    REJ --> CACHE["QueryCache onError sees 401"]
    CACHE --> TOAST["toast 'Session expired!'"]
    CACHE --> NAV["navigate /sign-in?redirect=..."]

    style FAIL stroke:#d9534f,stroke-width:2px
    style TOAST stroke:#d99a2b,stroke-width:2px
    style NAV stroke:#d99a2b,stroke-width:2px
```
