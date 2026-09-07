# Error handling

Failures are handled at four levels. Each catches what the one below it should
not have to know about.

## The layers

```mermaid
flowchart TD
    FAIL(["a request fails"]) --> L1

    L1["1 — Axios response interceptor<br/><b>lib/api.ts</b>"]
    L1 --> L1D{"401 worth<br/>refreshing?"}
    L1D -->|yes| RETRY["refresh and replay<br/><i>the error never surfaces</i>"]
    L1D -->|no| L2

    L2["2 — TanStack Query"]
    L2 --> L2D{"read or write?"}

    L2D -->|read| CACHE["QueryCache onError<br/><b>main.tsx</b><br/>401 / 500 handled globally"]
    L2D -->|write| MUTGLOBAL["mutations.onError<br/><b>main.tsx</b><br/>handleServerError + 304"]

    CACHE --> L3
    MUTGLOBAL --> L3

    L3["3 — the mutation's own onError<br/><i>422 to form fields, 403 toast</i>"]
    L3 --> L4["4 — the component<br/><i>isError renders GeneralError</i>"]

    style FAIL stroke:#d9534f,stroke-width:2px
    style L1D stroke:#d99a2b,stroke-width:2px
    style L2D stroke:#d99a2b,stroke-width:2px
    style RETRY stroke:#3fa860,stroke-width:2px
```

## By status code

```mermaid
flowchart TD
    S{"status"} --> S401["401"]
    S --> S403["403"]
    S --> S422["422"]
    S --> S500["500"]
    S --> SOTHER["network / unknown"]

    S401 --> R401["interceptor refreshes once.<br/>If that fails: reset, toast<br/>'Session expired!', go to /sign-in"]
    S403 --> R403["never retried.<br/>Mutation shows a permission toast;<br/>reads currently have no global handling"]
    S422 --> R422["mapped onto form fields<br/>with form.setError"]
    S500 --> R500["toast 'Internal Server Error!'<br/>navigate to /500 in production only"]
    SOTHER --> ROTHER["handleServerError:<br/>the API's title field, or<br/>'Something went wrong!'"]

    style S stroke:#d99a2b,stroke-width:2px
    style R401 stroke:#d9534f,stroke-width:2px
    style R403 stroke:#d9534f,stroke-width:2px
    style R422 stroke:#d99a2b,stroke-width:2px
    style R500 stroke:#d9534f,stroke-width:2px
```

## What the user is allowed to see

```mermaid
flowchart LR
    RAW["Raw error<br/><i>stack trace, SQL fragment</i>"] --> HSE["handleServerError"]
    HSE --> PICK{"is there an<br/>API title field?"}
    PICK -->|yes| TITLE["show that message"]
    PICK -->|no| SAFE["'Something went wrong!'"]

    TITLE --> TOAST(["toast"])
    SAFE --> TOAST

    style RAW stroke:#d9534f,stroke-width:2px
    style PICK stroke:#d99a2b,stroke-width:2px
    style TOAST stroke:#3fa860,stroke-width:2px
```

A raw exception never reaches the screen. Only a message the API deliberately
supplied, or a generic fallback.

In development the original error is also logged to the console, so the detail
is available to whoever needs it without being shown to the user.

## The retry policy

```mermaid
flowchart TD
    ERR["query error"] --> DEV{"development?"}
    DEV -->|yes| NEVER["never retry —<br/>fail loudly while building"]
    DEV -->|no| AUTH{"401 or 403?"}
    AUTH -->|yes| NEVER2["never retry —<br/>a permission problem<br/>will not fix itself"]
    AUTH -->|no| COUNT{"more than 3 attempts?"}
    COUNT -->|yes| GIVEUP["give up"]
    COUNT -->|no| AGAIN["retry"]

    style ERR stroke:#d9534f,stroke-width:2px
    style DEV stroke:#d99a2b,stroke-width:2px
    style AUTH stroke:#d99a2b,stroke-width:2px
    style COUNT stroke:#d99a2b,stroke-width:2px
    style AGAIN stroke:#3fa860,stroke-width:2px
```

Retrying a 401 or 403 is pointless: the answer will be the same, and it turns
one denied request into four.

## Where a failure surfaces

| Failure | Where the user sees it |
| --- | --- |
| Expired session | Toast, then the sign-in page |
| Missing permission on a route | Redirect to `/403` |
| Missing permission on an action | Toast, control usually hidden already |
| Form validation | Inline, next to the field |
| List request failed | `GeneralError` in place of the table |
| Server error | Toast, and `/500` in production |
| Response failed schema validation | Query error — the table shows `GeneralError` |

That last row is worth knowing: a backend contract change surfaces the same way
a server outage does, because `zod.parse` throws inside the query function.
