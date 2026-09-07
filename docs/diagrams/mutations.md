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

    MUT --> FD["toFormData(payload)"]
    FD --> METHOD{"create or update?"}
    METHOD -->|create| POST["POST /products"]
    METHOD -->|update| SPOOF["POST /products/:id<br/>with _method=PUT"]

    POST --> API[("Backend")]
    SPOOF --> API

    API --> RESULT{"response"}
    RESULT -->|success| PARSE["productSchema.parse(res.data.product)"]
    PARSE --> SUCCESS["onSuccess"]
    SUCCESS --> TOASTOK["toast.success"]
    SUCCESS --> INV["invalidateQueries(['products'])"]
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

```mermaid
flowchart TD
    PAYLOAD["ProductPayload"] --> LOOP["for each entry"]
    LOOP --> KIND{"value type"}

    KIND -->|File| FILE["append as-is"]
    KIND -->|Array| ARR["append key[] per item<br/><i>what PHP expects</i>"]
    KIND -->|boolean| BOOL["'1' or '0'"]
    KIND -->|object| JSON["JSON.stringify"]
    KIND -->|"null, undefined or empty"| SKIP["skipped —<br/>untouched fields left alone"]
    KIND -->|other| STR["String(value)"]

    FILE --> FORM[("FormData")]
    ARR --> FORM
    BOOL --> FORM
    JSON --> FORM
    STR --> FORM

    style PAYLOAD stroke:#4d90d9,stroke-width:2px
    style KIND stroke:#d99a2b,stroke-width:2px
    style SKIP stroke:#d99a2b,stroke-width:2px
    style FORM stroke:#3fa860,stroke-width:2px
```

Products can carry an image, so every write is multipart rather than JSON.

### Method spoofing

```mermaid
flowchart LR
    PUT["PUT with multipart body"] --> PHP["PHP does not parse<br/>multipart on PUT"]
    PHP --> EMPTY["image arrives empty,<br/>silently"]

    SPOOF["POST + _method=PUT"] --> PARSED["body parsed correctly"]

    style PUT stroke:#d9534f,stroke-width:2px
    style EMPTY stroke:#d9534f,stroke-width:2px
    style SPOOF stroke:#3fa860,stroke-width:2px
    style PARSED stroke:#3fa860,stroke-width:2px
```

This one is worth remembering because it fails quietly: the request succeeds,
the record updates, and only the file is missing.

## Delete and restore

```mermaid
flowchart LR
    DEL["DELETE /products/:id"] --> SOFT["soft delete —<br/>the row survives"]
    SOFT --> HIDDEN["hidden from the default list"]
    HIDDEN --> SHOW["visible with showDeleted<br/>(with_trashed=1)"]
    SHOW --> RESTORE["PATCH /products/:id/restore"]
    RESTORE --> BACK["back in the live list"]

    style DEL stroke:#d9534f,stroke-width:2px
    style RESTORE stroke:#4d90d9,stroke-width:2px
    style BACK stroke:#3fa860,stroke-width:2px
```

Deletes are soft everywhere in this app, which is why the table has a "show
deleted" toggle and rows carry a Restore action rather than a delete being
final.
