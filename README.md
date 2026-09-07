# AlphaDashboard

A reusable React admin dashboard template — an opinionated starting point for
new frontend projects. Vite, React 19, TypeScript, Tailwind v4 and Radix-based
UI primitives, with routing, data-fetching, tables, forms, auth, permissions and
an audit trail already wired together.

## Quickstart

The frontend is an API client with no local data, so **start the backend
first** — otherwise your first screen is an empty table.

```bash
# 1. The bundled test API (see docs/getting-started.md for prerequisites)
cd TestAPI && composer install && php artisan migrate --seed && php artisan serve

# 2. This app, in a second terminal
cd ..                     # back to the template root
pnpm install
cp .env.example .env      # already points at http://localhost:8000/api/v1
pnpm dev
```

Sign in with **`superadmin@test.com`** / **`1234567890`**. Then try
**`viewer@test.com`** with the same password — the sidebar visibly shrinks,
because navigation is filtered by the same permissions the API enforces.

Full setup, all five seeded accounts and the common first-run failures:
**[docs/getting-started.md](./docs/getting-started.md)**.

## Documentation

| Doc                                            | Covers                                                      |
| ---------------------------------------------- | ----------------------------------------------------------- |
| [Getting Started](./docs/getting-started.md)   | Prerequisites, first run, test accounts                     |
| [Architecture](./docs/architecture.md)         | Folder structure and how the layers fit                     |
| [Conventions](./docs/conventions.md)           | The patterns every screen follows — read before writing one |
| [Adding a Feature](./docs/adding-a-feature.md) | Step-by-step walkthrough                                    |
| [Customizing](./docs/customizing.md)           | The swap points, and what to delete                         |
| [Testing](./docs/testing.md)                   | Running and writing tests                                   |
| [Deployment](./docs/deployment.md)             | Building and shipping                                       |
| [Tech Stack](./docs/tech-stack.md)             | Every library and why                                       |

## What's in the box

- **Real auth** — bearer tokens, a route guard that rehydrates the user before
  first render, and single-flight 401 refresh
- **Permission-based access control** — route guards, UI gates and sidebar
  filtering all reading the one list the API enforces
- **A shared table layer** — server-side paging, sorting, filtering, soft
  deletes and declared row actions, so screens cannot drift apart
- **An audit trail** — every write recorded, with a per-record history timeline
  you can drop into any feature
- **Reference-data screens** — five lookup tables served by one configurable
  screen

## Tech stack

| Concern | Library                                     |
| ------- | ------------------------------------------- |
| Build   | Vite + TypeScript                           |
| UI      | React 19, Tailwind CSS v4, Radix primitives |
| Routing | TanStack Router (file-based)                |
| Data    | TanStack Query + Axios                      |
| Tables  | TanStack Table                              |
| State   | Zustand                                     |
| Forms   | React Hook Form + Zod                       |
| Charts  | Recharts                                    |
| Tooling | ESLint, Prettier, knip, Vitest, Playwright  |

## Scripts

| Command                                        | Description                                             |
| ---------------------------------------------- | ------------------------------------------------------- |
| `pnpm dev`                                     | Start the dev server                                    |
| `pnpm build`                                   | Type-check and build for production                     |
| `pnpm typecheck`                               | Type-check only (`tsc -b`)                              |
| `pnpm preview`                                 | Serve the production build locally                      |
| `pnpm lint`                                    | Run ESLint                                              |
| `pnpm format`                                  | Format with Prettier                                    |
| `pnpm format:check`                            | Check formatting — **a CI gate**                        |
| `pnpm knip`                                    | Find unused files, exports and dependencies             |
| `pnpm docs:check`                              | Fail if the docs reference a file that no longer exists |
| `pnpm test:browser:install`                    | **Run once** — installs Chromium for the tests          |
| `pnpm test`                                    | Run tests headless                                      |
| `pnpm test:watch` / `test:ui` / `test:browser` | Watch / UI / headed                                     |
| `pnpm test:coverage`                           | Coverage report                                         |

> **`tsc --noEmit` checks nothing in this repo** — the root `tsconfig.json` has
> `"files": []` and only project references, so it exits 0 regardless. Use
> `pnpm typecheck`. See [testing.md](./docs/testing.md#type-checking).

## Project structure

```
src/
├── assets/         Icons and logos
├── components/     Shared components (ui/ = base UI primitives,
│                   data-table/ = the shared table layer, layout/ = app shell)
├── config/         app-config.ts — central branding
├── context/        Global providers (theme, font, direction, layout, search)
├── features/       One folder per feature: index.tsx, components/, data/
├── hooks/          Reusable hooks
├── lib/            api client, authz, format, api-query, subject-types
├── routes/         File-based routes (map 1:1 to URLs)
├── stores/         Zustand stores (auth)
├── test-utils/     Helpers shared by tests
└── env.ts          Validated environment variables
```

`src/features/products/` is the reference implementation — a server-paginated
table with full CRUD, image upload, soft deletes and audit history. Read it,
then replace it.

## Code quality

- **Pre-commit hook** (husky + lint-staged) runs ESLint and Prettier on staged
  files
- **knip** guards against dead code; only `src/components/ui/**` and generated
  files are ignored
- **CI** runs lint, format, docs and type checks, then tests and the build

> Uses **pnpm** via corepack. Build-script approvals live in
> `pnpm-workspace.yaml`.
