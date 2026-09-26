# Testing

## Running the tests

```bash
pnpm test:browser:install   # ONCE per machine — installs Chromium
pnpm test                   # headless
```

**Install the browser first.** Tests run in a real Chromium via Vitest's
browser mode, not jsdom, so a fresh clone that goes straight to `pnpm test`
fails with a Playwright error that reads like a broken test suite.
`test:browser:install` also installs Chromium's system libraries, so it asks for
`sudo`; on WSL the usual symptom of skipping that is "Target page, context or
browser has been closed".

Where Chromium cannot run, tests of plain functions still can, without a
browser: `pnpm vitest run --browser.enabled=false src/lib src/features/dashboard/data`.
Anything that touches the DOM or cookies fails that way - it is a stopgap, not
a substitute.

| Command | Use |
| --- | --- |
| `pnpm test` | Headless. |
| `pnpm test:watch` | Re-runs on change. |
| `pnpm test:browser` | **Headed** — watch the browser drive itself. Best for debugging a failing DOM assertion. |
| `pnpm test:ui` | Vitest's UI. |
| `pnpm test:coverage` | Coverage report. |

## Type checking

**`tsc --noEmit` checks nothing in this repo and exits 0.**

The root `tsconfig.json` is solution-style — `"files": []` plus project
references to `tsconfig.app.json` and `tsconfig.node.json` — so `--noEmit` finds
no files to compile and reports success no matter what is in `src/`.

```bash
pnpm typecheck    # tsc -b — the real check
```

This is not hypothetical: a type error that crashed four pages shipped past a
green `tsc --noEmit`. If you ever doubt the checker, drop a deliberate error
into a file and confirm it is reported.

## Conventions

Tests live **next to the code**, as `*.test.ts` / `*.test.tsx`:

```
src/lib/cookies.ts
src/lib/cookies.test.ts
```

Shared helpers live in `src/test-utils/`.

Component tests use `vitest-browser-react`. Prefer asserting what a user can
see and do — visible text, roles, and the result of a click — over
implementation details like internal state.

## What is covered today

Seventeen test files:

| Area | Files |
| --- | --- |
| Utilities | `src/lib/cookies.test.ts`, `src/lib/utils.test.ts`, `src/lib/handle-server-error.test.ts` |
| Permissions | `src/lib/permissions.test.ts` |
| Navigation | `src/components/layout/data/breadcrumbs.test.ts`, `src/components/layout/data/filter-nav.test.ts` |
| Dashboard | `src/features/dashboard/data/analytics.test.ts` (periods, number formatting) |
| Regions | `src/lib/regions.test.ts` |
| Hooks | `src/hooks/use-table-url-state.test.ts` |
| State | `src/stores/auth-store.test.ts` |
| Components | `src/components/config-drawer.test.tsx`, `src/components/confirm-dialog.test.tsx`, `src/components/password-input.test.tsx`, `src/components/sign-out-dialog.test.tsx` |
| Context | `src/context/search-provider.test.tsx` |
| Auth forms | `src/features/auth/sign-in/components/form.test.tsx` |
| Domain data | `src/features/stones/data/enums.test.ts`, `src/features/worklists/data/config.test.ts` |
| Feature dialogs | `src/features/lookups/components/mutate-dialog.test.tsx` |

## What is not covered — read this before trusting the suite

**The domain screens are largely untested.** No coverage of:

- `src/components/data-table/` — the shared table and row actions
- `src/lib/authz.ts` — permission gating
- `src/lib/format.ts` — money and date formatting
- `src/lib/api-query.ts` — the query-parameter contract
- `src/features/orders/`, `bills/`, `certificates/`, `identification/` — the
  whole pipeline
- The read-only dialog and soft-delete flows

The pure functions are where to start — `authz`, `format`, `buildListParams` and
`toPaginated` are dependency-free and each takes minutes. `toPaginated` is worth
a test in particular: it derives page numbers the API does not send, so an
off-by-one there misreports the last page on every table in the app.

A concrete example of the value: `hasAnyPermission` once took a bare string
where it expected an array, which threw a `TypeError` and blanked four screens.
This would have caught it:

```ts
expect(hasAnyPermission('orders.view_order')).toBe(false)
```

## Verifying a change

There is **no CI pipeline in this repository**, so nothing runs these for you.
Before opening a pull request:

```bash
pnpm typecheck     # tsc -b — the real type check; see below
pnpm lint          # 0 errors; a handful of warnings are expected
pnpm docs:check    # no doc references a file that no longer exists
pnpm knip          # nothing newly unused
pnpm build         # the production build actually completes
```

`pnpm format` before committing keeps diffs clean; the `pre-commit` hook (husky
+ lint-staged) already runs ESLint and Prettier on staged files.

### When the browser tests cannot run

`pnpm test` drives a real Chromium through Playwright, which has to be installed
once with `pnpm test:browser:install`. On platforms where that install cannot
complete, the five commands above are the whole verification loop — they catch
type errors, dead code, broken doc references and build failures, but nothing
about runtime behaviour. Walk the affected screen by hand before merging.

`pnpm docs:check` fails when a doc references a file that no longer exists. See
[the docs index](./README.md#keeping-these-docs-honest).
