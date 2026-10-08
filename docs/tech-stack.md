# Frontend stack

The exact dependency ranges are in [`package.json`](../package.json), with the
resolved versions in [`pnpm-lock.yaml`](../pnpm-lock.yaml).

| Area | Libraries and purpose |
| --- | --- |
| Build | Vite and TypeScript compile the client-side app. |
| UI | React, Tailwind CSS, and Radix primitives provide components and styling. |
| Routing | TanStack Router provides file-based routes and typed route state. |
| Server data | TanStack Query caches API results; Axios sends HTTP requests and handles authentication refresh. |
| Tables | TanStack Table supplies table state and models; shared components render the UI. |
| Client state | Zustand holds authentication state; React context holds interface preferences. |
| Forms | React Hook Form manages form state; Zod validates API and form data. |
| Quality | ESLint, Prettier, knip, Vitest, Playwright, and Husky support checks and tests. |

## Data ownership

The API is authoritative for business data. TanStack Query owns its client cache;
Zustand holds the current authentication state. Table filters and paging live in
URL search parameters so users can refresh or share a view.

## Commands

Use pnpm through Corepack. Common commands are listed in the root
[README](../README.md#scripts). GitHub Actions installs from the lockfile and
runs lint, formatting, documentation checks, unused-code analysis, type checks,
browser tests, and a production build.
