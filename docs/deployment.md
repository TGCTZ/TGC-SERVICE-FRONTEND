# Deployment

The app is a **static single-page application**. `pnpm build` produces `dist/`,
which any static host can serve — there is no Node server at runtime.

```bash
pnpm build      # tsc -b && vite build  →  dist/
pnpm preview    # serve dist/ locally, to check the real build
```

## The SPA rewrite is not optional

Routing happens in the browser. A visitor who opens `/orders` directly asks
the host for a file at that path, which does not exist — so **every** route must
fall back to `index.html`.

`netlify.toml` does this:

```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

Status **200**, not 301: the URL must stay as the user typed it so the router can
read it.

On another host you need the equivalent — `try_files $uri /index.html` on nginx,
a rewrite rule on Vercel or Cloudflare Pages, `--single` for `serve`. Skipping
this produces the classic symptom: the app works when you click through it, and
404s on refresh or on any shared link.

## Environment variables are baked in at build time

`VITE_*` variables are substituted into the bundle by Vite. They are **not** read
from the server at runtime.

Two consequences:

- Changing `VITE_API_URL` requires a **rebuild**, not a restart. Set it in your
  host's build environment, not its runtime environment.
- Anything in a `VITE_` variable is **public** — it ships inside the JavaScript
  every visitor downloads. Never put a secret there; the backend holds secrets.

## Before shipping a fork

- [ ] `src/config/app-config.ts` — name, description and the real public `url`
      (it feeds the Open Graph tags)
- [ ] Favicons in `public/images/`
- [ ] `VITE_API_URL` set in the host's build environment
- [ ] CORS on the API allows the deployed origin
- [ ] `src/lib/format.ts` — locale, timezone and currency for your users
- [ ] The rest of [customizing.md](./customizing.md)

## Before you ship

There is no CI pipeline in this repository, so the pre-flight checks are
manual — `pnpm typecheck`, `pnpm lint`, `pnpm docs:check`, `pnpm knip` and
`pnpm build`. The full list, and what to do when the browser tests cannot run,
is in [testing.md](./testing.md#verifying-a-change).

Deployment is whatever your host does with the built `dist/` — connect it to the
repository, or run the build and upload.
