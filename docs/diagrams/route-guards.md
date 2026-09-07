# Route guards

TanStack Router runs `beforeLoad` on every matching route in the tree, parent
first, before the component renders. Two guards stack.

## The chain

```mermaid
flowchart TD
    URL(["Browser navigates to<br/>/products"]) --> ROOT["__root.tsx<br/><i>toaster, devtools, error boundary</i>"]
    ROOT --> AUTHROUTE["_authenticated/route.tsx<br/>beforeLoad"]

    AUTHROUTE --> HASTOKEN{"auth.accessToken<br/>present?"}
    HASTOKEN -->|no| SIGNIN(["redirect to /sign-in<br/>?redirect=current-url"])
    HASTOKEN -->|yes| HASUSER{"auth.user<br/>already loaded?"}

    HASUSER -->|yes| PERM
    HASUSER -->|no| FETCHME["ensureQueryData(meQueryOptions)<br/><i>GET /auth/me</i>"]

    FETCHME --> MEOK{"succeeded?"}
    MEOK -->|no| RESET["auth.reset()<br/><i>token was stale or revoked</i>"]
    RESET --> SIGNIN
    MEOK -->|yes| SETUSER["auth.setUser(user)"]
    SETUSER --> PERM

    PERM["route beforeLoad<br/>requirePermission([...])"]
    PERM --> HASPERM{"hasAnyPermission?"}
    HASPERM -->|no| FORBIDDEN(["redirect to /403"])
    HASPERM -->|yes| RENDER(["render the page"])

    style URL stroke:#4d90d9,stroke-width:2px
    style HASTOKEN stroke:#d99a2b,stroke-width:2px
    style HASUSER stroke:#d99a2b,stroke-width:2px
    style MEOK stroke:#d99a2b,stroke-width:2px
    style HASPERM stroke:#d99a2b,stroke-width:2px
    style RENDER stroke:#3fa860,stroke-width:2px
    style SIGNIN stroke:#d9534f,stroke-width:2px
    style FORBIDDEN stroke:#d9534f,stroke-width:2px
    style RESET stroke:#d9534f,stroke-width:2px
```

## Why the `me` call blocks rendering

The token is persisted in a cookie; **the user object is not**. After a hard
refresh the store has a token but no user — and permissions live on the user.

```mermaid
flowchart LR
    REFRESH["Hard refresh"] --> COOKIE["token restored<br/>from cookie"]
    COOKIE --> NOUSER["auth.user === null"]

    NOUSER --> BAD["render immediately<br/><i>permissions empty</i>"]
    BAD --> FLASH["every gated control<br/>hidden, then flashes in"]

    NOUSER --> GOOD["await /auth/me<br/>in beforeLoad"]
    GOOD --> STABLE["first paint already<br/>has permissions"]

    style REFRESH stroke:#4d90d9,stroke-width:2px
    style FLASH stroke:#d9534f,stroke-width:2px
    style STABLE stroke:#3fa860,stroke-width:2px
```

This is why `beforeLoad` awaits rather than firing the request and rendering
optimistically: the alternative is a visible flash of a stripped-down UI on
every refresh.

## Declaring a permission on a route

```
export const Route = createFileRoute('/_authenticated/products/')({
  beforeLoad: requirePermission(['products.viewAny']),
  component: Products,
})
```

`requirePermission` lives in `src/lib/authz.ts`. It gates on **permissions**,
never roles — the API enforces permissions, so using the same vocabulary means
UI and server cannot disagree. A role gate would drift the moment someone edits
that role from the Roles screen.

## Two layers of gating

```mermaid
flowchart TD
    ROUTELEVEL["Route guard<br/>requirePermission"] --> WHOLE["blocks the whole page<br/>redirect to /403"]
    COMPONENT["Component gate<br/>Can permission=..."] --> PARTIAL["hides one control<br/>button, menu item, column"]

    WHOLE --> NOTE
    PARTIAL --> NOTE

    NOTE["Both are usability, not security.<br/>The API enforces every permission independently."]

    style ROUTELEVEL stroke:#4d90d9,stroke-width:2px
    style COMPONENT stroke:#4d90d9,stroke-width:2px
    style NOTE stroke:#d99a2b,stroke-width:2px
```

Hiding a button stops an honest user from hitting a wall; it stops nobody from
calling the endpoint. The server is the only thing enforcing access.
