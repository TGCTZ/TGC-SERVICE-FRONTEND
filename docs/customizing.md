# Customizing

The complete list of the settings that change how the app looks, what it is
called, where it points and what it shows — the places to edit when something
needs to be different, rather than the places to read when something needs to be
understood.

> This is the **only** place the swap points are enumerated. Other docs link
> here rather than repeating the list, because competing copies are how a list
> like this ends up with three different counts.

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

Six groups: **Overview** (Dashboard), **Operations** (Customers, Orders), then
the lab pipeline — **Gemmology Lab**, **Billing**, **Certificates** — and
**Administration** (Users, Logs, and the Reference data collapsible).

Each pipeline group opens with its queue and then the screens where that stage's
work is done, so the sidebar reads in the order a stone actually moves. The four
queues come from `src/features/worklists/data/config.ts` and Reference data from
`src/features/lookups/data/config.ts` — add an entry there, not here.

Every entry carries the `permission` the API enforces. The file's own docblock
explains the rules in full.

### 6. Reference data — `src/features/lookups/data/config.ts`

One array drives all ten lookup screens. Adding a reference table is an entry
here; you do not write components.

Two things bite here, both documented in the file: `resource` doubles as the
URL segment **and** the permission prefix so it must match the API exactly, and
`collectionKey` is snake_case where the URL is kebab-case
(`unit-of-measures` → `unit_of_measures`).

### 7. Theme and colour — `src/styles/theme.css`

Every design token, light and dark, in one file: the brand palette, the neutral
surfaces, the semantic status colours, the sidebar and header chrome, and the
border radius scale.

Two rules make edits here behave:

- **Define a colour once, on bare `:root`**, then redefine only what changes
  under the dark blocks. A token whose only definition sits inside a media query
  has no value in the other theme.
- **A role is only usable as a utility class if it is mapped.** Tailwind v4
  reads the `@theme inline` block at the bottom of the file; a `--brand-x` with
  no matching `--color-brand-x` entry there cannot be written as `bg-brand-x`,
  and the class silently does nothing.

The full palette, the reasoning behind each role and the light/dark parity table
are in **[TGC-COLOR-SYSTEM.md](./TGC-COLOR-SYSTEM.md)**.

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

### 9. Permissions — `src/lib/permissions.ts` and `src/lib/authz.ts`

`permissions.ts` holds the vocabulary — the resource-to-Django-model map and the
`perm()` builder that turns `perm('orders', 'view')` into `orders.view_order`.
Adding a resource means adding it there, once.

`authz.ts` holds the checks. Route guards use `requirePermission()`, UI uses
`<Can permission={…}>` (`src/components/can.tsx`), and the sidebar is filtered
by `src/components/layout/data/filter-nav.ts`. All three read the same list, so
they cannot disagree.

Gates are **permissions**, never roles — a role gate drifts the moment someone
edits that role from the Roles screen.

**Known incomplete**, so you are not surprised: the Account, Appearance,
Notifications and Display forms under `src/features/settings/` still call
`src/lib/show-submitted-data.tsx` — they display what *would* be submitted
rather than saving. Only Profile and the password form write to the API.
