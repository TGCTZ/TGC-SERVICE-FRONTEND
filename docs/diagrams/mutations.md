# Mutations

Every write goes through `useMutation`, and every write ends by invalidating the
queries it could have changed.

## Submit to refresh

```mermaid
flowchart TD
    SUBMIT(["User submits the form"]) --> RHF["react-hook-form handleSubmit"]
    RHF --> ZOD{"zod schema valid?"}
    ZOD -->|no| FIELDS["errors rendered next to<br/>the offending inputs — no request"]
    ZOD -->|yes| MUT["mutation.mutate(values)"]

    MUT --> ENC["encode(payload)<br/><i>multipart only if a File is present</i>"]
    ENC --> METHOD{"create or update?"}
    METHOD -->|create| POST["POST /customers"]
    METHOD -->|update| PUT["PUT /customers/:id"]

    POST --> API[("Backend")]
    PUT --> API

    API --> RESULT{"response"}
    RESULT -->|success| PARSE["customerSchema.parse(res.data)"]
    PARSE --> SUCCESS["onSuccess"]
    SUCCESS --> TOASTOK["toast.success"]
    SUCCESS --> INV["invalidateQueries(['customers'])"]
    INV --> REFETCH(["table refetches, dialog closes"])

    RESULT -->|error| ERR["onError — see below"]

    style SUBMIT stroke:#4d90d9,stroke-width:2px
    style ZOD stroke:#d99a2b,stroke-width:2px
    style METHOD stroke:#d99a2b,stroke-width:2px
    style RESULT stroke:#d99a2b,stroke-width:2px
    style REFETCH stroke:#3fa860,stroke-width:2px
    style FIELDS stroke:#d9534f,stroke-width:2px
    style ERR stroke:#d9534f,stroke-width:2px
```

## Two layers of validation

```mermaid
flowchart LR
    CLIENT["zod on the client"] --> FAST["instant feedback,<br/>no network round trip"]
    SERVER["API validation"] --> TRUTH["the authoritative answer"]

    FAST --> NOTE["The client copy is a convenience.<br/>The server is what decides."]
    TRUTH --> NOTE

    style CLIENT stroke:#4d90d9,stroke-width:2px
    style SERVER stroke:#4d90d9,stroke-width:2px
    style NOTE stroke:#d99a2b,stroke-width:2px
```

## Error routing

The mutation's own `onError` handles what belongs on the form; anything else
falls through to the global handler.

```mermaid
flowchart TD
    ERR(["mutation rejects"]) --> STATUS{"HTTP status"}

    STATUS -->|422| MAP["for each field in errors:<br/>form.setError(field, message)"]
    MAP --> HIGHLIGHT["toast 'Please fix the highlighted fields.'<br/><i>message lands next to the input</i>"]

    STATUS -->|403| DENIED["toast 'You do not have permission to do that.'"]
    STATUS -->|"anything else"| GENERIC["toast 'Something went wrong. Please try again.'"]

    STATUS -->|"401 (from a read)"| GLOBAL["QueryCache handler:<br/>session expired, redirect"]

    style ERR stroke:#d9534f,stroke-width:2px
    style STATUS stroke:#d99a2b,stroke-width:2px
    style HIGHLIGHT stroke:#3fa860,stroke-width:2px
```

**422 must not reach `handleServerError`.** A validation failure belongs beside
the input that caused it, not in a toast that vanishes while the user is still
looking for the bad field. That is why the mutation intercepts it before the
global handler ever sees it.

## Multipart writes

Most writes are plain JSON. Only a write that actually carries a file is
encoded as multipart — `encode()` in `features/users/data/api.ts` checks for a
`File` and falls back to the payload untouched:

```mermaid
flowchart TD
    PAYLOAD["UserPayload"] --> HASFILE{"avatar is a File?"}
    HASFILE -->|no| JSONBODY["send as JSON"]
    HASFILE -->|yes| LOOP["toFormData — for each entry"]

    LOOP --> KIND{"value type"}
    KIND -->|File| FILE["append as-is"]
    KIND -->|Array| ARR["append the bare key once per item<br/><i>roles, roles — not roles[]</i>"]
    KIND -->|boolean| BOOL["'true' or 'false'"]
    KIND -->|"null, undefined or empty"| SKIP["skipped —<br/>untouched fields left alone"]
    KIND -->|other| STR["String(value)"]

    FILE --> FORM[("FormData")]
    ARR --> FORM
    BOOL --> FORM
    STR --> FORM

    style PAYLOAD stroke:#4d90d9,stroke-width:2px
    style HASFILE stroke:#d99a2b,stroke-width:2px
    style KIND stroke:#d99a2b,stroke-width:2px
    style SKIP stroke:#d99a2b,stroke-width:2px
    style JSONBODY stroke:#3fa860,stroke-width:2px
    style FORM stroke:#3fa860,stroke-width:2px
```

Two details are easy to get wrong:

- **Arrays use a repeated bare key.** `roles`, `roles` — not `roles[]`, which
  would arrive as one field literally named `roles[]` and be ignored.
- **JSON is the default on purpose.** Multipart flattens every value to a
  string, so a `null` that should clear a field and a number that should stay a
  number both arrive as text. The heavier encoding is used only where a file
  genuinely requires it.

## Delete and restore

```mermaid
flowchart LR
    DEL["DELETE /customers/:id"] --> SOFT["soft delete —<br/>the row survives"]
    SOFT --> HIDDEN["hidden from the default list"]
    HIDDEN --> SHOW["visible with showDeleted<br/>(with_trashed=1)"]
    SHOW --> RESTORE["POST /customers/:id/restore"]
    RESTORE --> BACK["back in the live list"]

    style DEL stroke:#d9534f,stroke-width:2px
    style RESTORE stroke:#4d90d9,stroke-width:2px
    style BACK stroke:#3fa860,stroke-width:2px
```

Deletes are soft everywhere in this app, which is why the table has a "show
deleted" toggle and rows carry a Restore action rather than a delete being
final.
