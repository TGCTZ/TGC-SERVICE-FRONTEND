# Testing

## Running the tests

```bash
pnpm test:browser:install   # ONCE per machine — installs Chromium
pnpm test                   # headless
```

**Install the browser first.** Tests run in a real Chromium via Vitest's
browser mode, not jsdom, so a fresh clone that goes straight to `pnpm test`
fails with a Playwright error that reads like a broken test suite.

| Command | Use |
| --- | --- |
| `pnpm test` | Headless. What CI runs. |
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

Twelve test files, covering the pre-existing template pieces:

| Area | Files |
| --- | --- |
| Utilities | `src/lib/cookies.test.ts`, `src/lib/utils.test.ts`, `src/lib/handle-server-error.test.ts` |
| Hooks | `src/hooks/use-table-url-state.test.ts` |
| State | `src/stores/auth-store.test.ts` |
| Components | `src/components/config-drawer.test.tsx`, `src/components/confirm-dialog.test.tsx`, `src/components/password-input.test.tsx`, `src/components/sign-out-dialog.test.tsx` |
| Context | `src/context/search-provider.test.tsx` |
| Auth forms | `src/features/auth/sign-in/components/form.test.tsx`, `src/features/auth/sign-up/components/form.test.tsx` |

## What is not covered — read this before trusting the suite

**Nothing built on top of the original template has a test.** No coverage of:

- `src/components/data-table/` — the shared table and row actions
- `src/lib/authz.ts` — permission gating
- `src/lib/format.ts` — money and date formatting
- `src/lib/api-query.ts` — the query-parameter contract
- `src/features/audit-logs/`, `src/features/lookups/`, `src/features/system-logs/`
- The read-only dialog and soft-delete flows

If you are picking up this template, that is the highest-value gap to close, and
the pure functions are where to start — `authz`, `format` and `buildListParams`
are dependency-free and each takes minutes.

A concrete example of the value: `hasAnyPermission` once took a bare string
where it expected an array, which threw a `TypeError` and blanked four screens.
This would have caught it:

```ts
expect(hasAnyPermission('products.view')).toBe(false)
```

## What CI runs

`.github/workflows/ci.yml`, on push and PR:

`pnpm install` → `lint` → `format:check` → `docs:check` → `knip` →
`test:browser:install` → `test` → `build`

`pnpm format:check` is a **merge gate** — running `pnpm format` locally before
committing avoids a CI failure that says nothing about your code. The
`pre-commit` hook (husky + lint-staged) already does this for staged files.

`pnpm docs:check` fails when a doc references a file that no longer exists. See
[the docs index](./README.md#keeping-these-docs-honest).
