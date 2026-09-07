# Changelog

All notable changes to AlphaDashboard are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- Central app configuration (`src/config/app-config.ts`) as the single branding
  swap point, injected into `index.html` via a Vite transform.
- Type-safe, Zod-validated environment variables (`src/env.ts`), validated at
  startup.
- Shared Axios API client (`src/lib/api.ts`) with auth-token injection.
- Real route guard for authenticated pages (`src/routes/_authenticated/route.tsx`).
- `Posts` reference feature demonstrating the end-to-end data pattern
  (schema → api → TanStack Query → UI states).
- Nested error boundary around the authenticated layout so a feature crash keeps
  the app shell rendered.
- Pre-commit hooks (husky + lint-staged) running ESLint and Prettier.
- Documentation in `docs/` (architecture, tech stack, adding a feature).

### Changed

- Rebranded to `AlphaDashboard`.
- Replaced the multi-team switcher with a plain app title.

### Removed

- Clerk authentication integration and its demo routes.
- Apps, Help Center, and Chats demo features.
- Extra auth page variants (OTP, forgot-password, alternate sign-in layout).
- Upstream project metadata (funding, issue/PR templates, code of conduct).

---

> This project began from an MIT-licensed upstream template; see `LICENSE` for
> the retained copyright notices. That project's release history is not
> reproduced here.
