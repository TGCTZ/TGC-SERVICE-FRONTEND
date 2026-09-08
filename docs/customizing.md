# Customizing

The complete list of what changes per project — and what to delete.

> This is the **only** place the swap points are enumerated. Other docs link
> here rather than repeating the list, because four competing copies is how the
> previous version of these docs ended up with four different counts.

## The swap points

Roughly in the order you hit them.

### 1. Branding — `src/config/app-config.ts`

Name, description and public URL. Injected into `index.html` at build time by a
Vite plugin that replaces the `%APP_NAME%`, `%APP_DESCRIPTION%` and `%APP_URL%`
tokens, so the static `<title>` and Open Graph tags stay in step with the app.

Also swap the favicons in `public/images/`.

### 2. Environment — `src/env.ts`

Declare every `VITE_` variable here, with a Zod type, and document it in
`.env.example`. Variables not declared here are invisible to the app.

`VITE_API_URL` is deliberately **optional** so the template boots without a
backend — you get a shell with empty screens rather than a crash. If your
project cannot function without an API, make it required here; nothing else
will tell you it is missing.

### 3. API — `src/lib/api.ts`

Point `VITE_API_URL` at your backend and import this client rather than calling
`axios` directly. It owns the base URL, the bearer header, and a single-flight
401 refresh so ten concurrent requests trigger one refresh, not ten.

The client expects a specific list envelope. See
[architecture.md](./architecture.md) before pointing it at a different API
shape.

### 4. Auth — `src/routes/_authenticated/route.tsx`

The guard checks for a token in `src/stores/auth-store.ts`, then rehydrates the
user from `/auth/me` — permissions have to be loaded before the first render or
gated UI flickers.

To swap providers (Clerk, Auth0, Supabase), replace three things: that call,
the login in `src/features/auth/data/api.ts`, and the refresh seam in
`src/lib/api.ts`.

### 5. Navigation — `src/components/layout/data/sidebar-data.ts`

Three tiers: **Overview**, **Workspace**, **Administration**, plus the
scaffolded **Finance** and **Reports** placeholders. Only Workspace is
project-specific — replace its contents and keep the shape.

Every entry carries the `permission` the API enforces. The file's own docblock
explains the rules in full.

### 6. Reference data — `src/features/lookups/data/config.ts`

One array drives all five lookup screens. Swap the example catalogue entries
for your own tables; you do not write components.

Two things bite here, both documented in the file: `resource` doubles as the
URL segment **and** the permission prefix so it must match the API exactly, and
`collectionKey` is snake_case where the URL is kebab-case
(`unit-of-measures` → `unit_of_measures`).

### 7. Audit subjects — `src/lib/subject-types.ts` ⚠ fails silently

Maps the backend class names stored in `activity_logs.subject_type`. One entry
per model whose history you want to show.

**A wrong name does not error.** The history sheet filters on it, finds nothing,
and renders an empty timeline — indistinguishable from a record nobody has ever
changed. Verify each entry against a real row rather than trusting the spelling:

```
GET /v1/activity-logs?filter[event]=created&per_page=1
```

and read `subject_type` off the response.

### 8. Localisation — `src/lib/format.ts` ⚠ fails silently

Locale, timezone and currency for every date and money value in the app.
Currently `en-TZ`, `Africa/Dar_es_Salaam`, `TZS`.

A fork that forgets this looks *plausible* — dates and prices render fine, just
in the wrong locale — so nothing prompts you to notice. Change the three
constants at the top.

The app is deliberately **single-currency**: the API stores a per-record code,
but the UI neither offers a picker nor renders anything but `DEFAULT_CURRENCY`.
Widening that means adding a picker back *and* deciding what a mixed-currency
total means.

### 9. Permissions — `src/lib/authz.ts`

Route guards use `requirePermission()`, UI uses
`<Can permission='…'>` (`src/components/can.tsx`), and the sidebar is filtered
by `src/components/layout/data/filter-nav.ts`. All three read the same list, so
they cannot disagree.

Gates are **permissions**, never roles — a role gate drifts the moment someone
edits that role from the Roles screen.

## What to delete

The template ships an example domain so the machinery has something to operate
on. Deleting it cleanly is the difference between a starting point and a mess.

**Delete — this is the example domain:**

| Path | What it is |
| --- | --- |
| `src/features/products/` | The reference feature. Read it first, then replace it. |
| `src/features/lookups/` | Keep the folder if you have reference tables; replace `lookup-config.ts`'s entries. |
| The **Workspace** group in `sidebar-data.ts` | Your domain goes here. |
| The **Finance** / **Reports** groups + `src/routes/_authenticated/finance/`, `src/routes/_authenticated/reports/` | Scaffolded placeholders. Build them or remove them. |
| The Workspace half of `src/lib/subject-types.ts` | Keep `user` and `role`. |
| `src/features/dashboard/components/` | Demo charts with random data. |

**Keep — this is the machinery:**

`src/components/data-table/`, `src/components/dialog-body.tsx`,
`src/components/record-history-sheet.tsx`, `src/components/can.tsx`,
`src/components/user-menu-content.tsx`, `src/lib/` (all of it),
`src/features/auth/`, `src/features/users/`, `src/features/roles/`,
`src/features/audit-logs/`, `src/features/system-logs/`,
`src/features/errors/`, `src/components/layout/`.

**Known incomplete**, so you are not surprised: the Account, Appearance,
Notifications and Display forms under `src/features/settings/` still call
`src/lib/show-submitted-data.tsx` — they display what *would* be submitted
rather than saving. Only Profile and the password form write to the API.
