# TGC Service — Frontend

The web client for the Tanzania Gemmological Centre's stone-certification
system. Reception takes stones in, gemmologists identify and examine them,
bills are settled through the GePG government payment gateway, and each stone
leaves with a printed certificate.

This app is a pure API client — it holds no data of its own. The Django API it
talks to lives in [`../backend`](../backend/README.md).

## Quickstart

**Start the backend first**, or your first screen is an empty table.

```bash
# 1. The API, from the repository root
cd backend && uv run python manage.py runserver
```

```bash
# 2. This app, in a second terminal
pnpm install
cp .env.example .env   # already points at http://localhost:8000/api/v1
pnpm dev
```

Sign in with an account created by the backend's `seed` command. Signing in as
a receptionist rather than an administrator visibly shrinks the sidebar,
because navigation is filtered by the same permissions the API enforces.

Full setup and the common first-run failures:
**[docs/getting-started.md](./docs/getting-started.md)**.

## Documentation

| Doc                                            | Covers                                                      |
| ---------------------------------------------- | ----------------------------------------------------------- |
| [Getting Started](./docs/getting-started.md)   | Prerequisites, first run, signing in                        |
| [Architecture](./docs/architecture.md)         | Folder structure and how the layers fit                     |
| [Conventions](./docs/conventions.md)           | The patterns every screen follows — read before writing one |
| [Adding a Feature](./docs/adding-a-feature.md) | Step-by-step walkthrough                                    |
| [Customizing](./docs/customizing.md)           | The swap points for branding, navigation and theme          |
| [Colour System](./docs/TGC-COLOR-SYSTEM.md)    | The brand palette and every design token                    |
| [Testing](./docs/testing.md)                   | Verifying a change, running and writing tests               |
| [Deployment](./docs/deployment.md)             | Building and shipping                                       |
| [Tech Stack](./docs/tech-stack.md)             | Every library and why                                       |

## What the app does

- **Orders and stones** — a customer's stones are received as one order, each
  stone tracked individually through the lab
- **The lab pipeline** — identification, then billing, then findings, then
  certification, with a worklist queue standing in front of each stage
- **Billing through GePG** — control numbers issued by the gateway, payment
  notifications settled against the bill, partial payments supported
- **Certificates** — issued per stone, with a PDF and a public verification page
- **Permission-based access control** — route guards, UI gates and sidebar
  filtering all reading the one list the API enforces
- **A shared table layer** — server-side paging, sorting, filtering, soft
  deletes and declared row actions, so screens cannot drift apart
- **An audit trail** — every write recorded and browsable under Audit Logs

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
| `pnpm format:check`                            | Check formatting                                        |
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
├── lib/            api client, authz, permissions, format, api-query
├── routes/         File-based routes (map 1:1 to URLs)
├── stores/         Zustand stores (auth)
├── styles/         Tailwind entry and the design tokens (theme.css)
├── test-utils/     Helpers shared by tests
└── env.ts          Validated environment variables
```

`src/features/customers/` is the clearest feature to read first — a
server-paginated table with full CRUD, soft deletes and declared row actions,
and nothing domain-specific in the way. `src/features/orders/` shows the same
patterns carrying real workflow.

## Code quality

- **Pre-commit hook** (husky + lint-staged) runs ESLint and Prettier on staged
  files
- **knip** guards against dead code; only `src/components/ui/**` and generated
  files are ignored
- **`pnpm docs:check`** fails when a doc references a file that no longer
  exists. There is no CI pipeline in this repository, so run it — along with
  `pnpm typecheck`, `pnpm lint` and `pnpm build` — before opening a pull
  request. [testing.md](./docs/testing.md) has the full list.

> Uses **pnpm** via corepack. Build-script approvals live in
> `pnpm-workspace.yaml`.
