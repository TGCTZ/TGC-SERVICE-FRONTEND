# List and table flow

Table state lives in the URL, not in component state. A filtered view is
therefore shareable, survives a refresh, and works with the back button.

## Round trip

```mermaid
flowchart TD
    USER(["User types in search,<br/>picks a filter, sorts a column"]) --> HANDLER["onStateChange(next)"]
    HANDLER --> NAV["navigate({ search: prev => ({...}), replace: true })"]
    NAV --> URL[("URL<br/>?page=2&search=laptop&sortBy=price")]

    URL --> READ["route.useSearch()"]
    READ --> STATE["ProductsQueryState<br/>page, perPage, search, sortBy,<br/>sortDir, categoryId, statusId, showDeleted"]

    STATE --> OPTS["productsQueryOptions({...})"]
    OPTS --> BUILD["buildListParams()"]
    BUILD --> PARAMS["page, per_page, search,<br/>sort_by, sort_dir, include,<br/>filter[...], with_trashed"]
    PARAMS --> GET["api.get('/products')"]
    GET --> RESP[("paginated response")]
    RESP --> ZOD["listSchema.parse()"]
    ZOD --> NORM["{ items, meta }"]
    NORM --> TABLE["ProductsTable<br/>data, meta, isFetching"]
    TABLE --> USER

    style USER stroke:#4d90d9,stroke-width:2px
    style URL stroke:#d99a2b,stroke-width:2px
    style NORM stroke:#3fa860,stroke-width:2px
```

`replace: true` on the navigation means typing in the search box does not push
a history entry per keystroke — otherwise the back button would walk backwards
through every character typed.

## Why the URL owns table state

```mermaid
flowchart LR
    subgraph inState["State in useState"]
        direction TB
        S1["refresh loses the filter"]
        S2["link cannot be shared"]
        S3["back button leaves the page"]
    end

    subgraph inUrl["State in the URL"]
        direction TB
        U1["refresh restores the view"]
        U2["paste the link, same view"]
        U3["back returns to the previous filter"]
    end

    style inState stroke:#d9534f,stroke-width:2px
    style inUrl stroke:#3fa860,stroke-width:2px
```

## Parameter translation

`buildListParams` in `src/lib/api-query.ts` is the only place that knows the
API's query-string contract. The bracket syntax and comma joining are easy to
get subtly wrong, so no feature builds these by hand.

```mermaid
flowchart TD
    IN["ListParams"] --> P{"which field?"}

    P -->|"page, perPage"| PG["page, per_page"]
    P -->|search| SR["search<br/><i>trimmed; empty omitted</i>"]
    P -->|"sortBy, sortDir"| ST["sort_by, sort_dir<br/><i>dir defaults to asc</i>"]
    P -->|include| IC["include — comma joined"]
    P -->|trashed| TR["with_trashed=1 or only_trashed=1"]
    P -->|filters| FV{"value type"}

    FV -->|array| ARR["filter[field] = comma joined<br/><i>WHERE IN</i>"]
    FV -->|"object { from, to }"| RANGE["filter[field][from]<br/>filter[field][to]<br/><i>each bound optional</i>"]
    FV -->|scalar| SCAL["filter[field] = value"]
    FV -->|"undefined, null or empty"| SKIP["omitted entirely"]

    style IN stroke:#4d90d9,stroke-width:2px
    style P stroke:#d99a2b,stroke-width:2px
    style FV stroke:#d99a2b,stroke-width:2px
    style SKIP stroke:#d9534f,stroke-width:2px
```

Empty values are omitted rather than sent blank. Sending `search=` would have
the API treat the empty string as a real filter and return nothing.

## Row actions

```mermaid
flowchart TD
    ROW["Table row"] --> HOOK["useProductActions(product)"]
    HOOK --> NULLCHK{"product is null?"}
    NULLCHK -->|yes| EMPTY["return []<br/><i>called before a row is chosen</i>"]
    NULLCHK -->|no| LIST["build the action list"]

    LIST --> DELETED{"product.deleted_at set?"}
    DELETED -->|yes| SHOWR["show Restore<br/>hide Edit and Delete"]
    DELETED -->|no| SHOWD["show Edit and Delete<br/>hide Restore"]

    SHOWR --> GATE
    SHOWD --> GATE
    GATE["each action carries a permission<br/><i>filtered by the Can gate</i>"]
    GATE --> MENU(["rendered menu"])

    style ROW stroke:#4d90d9,stroke-width:2px
    style NULLCHK stroke:#d99a2b,stroke-width:2px
    style DELETED stroke:#d99a2b,stroke-width:2px
    style MENU stroke:#3fa860,stroke-width:2px
```

The action list is a hook, not a component, so the row menu and the record's
view dialog render the same list. Two hand-maintained copies would drift, and
the drift would be silent — a button available in one place and missing in the
other.

The hook is called unconditionally with a possibly-null product, because hooks
cannot be conditional. Returning `[]` for null is what makes that safe.
