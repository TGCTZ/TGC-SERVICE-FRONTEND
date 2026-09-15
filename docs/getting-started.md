# Getting Started

From a fresh clone to a running app with data in it.

> **Order matters.** The frontend is an API client with no local data, so start
> the backend first or your first screen will be an empty table and a toast
> saying the server could not be reached.

## Prerequisites

| For | You need |
| --- | --- |
| The frontend | Node 20+, and pnpm (`corepack enable`) |
| The API | Python 3.13 and [uv](https://docs.astral.sh/uv/), PostgreSQL |

Certificate PDFs are rendered by WeasyPrint, which needs system libraries
present **before** the API's dependencies are installed — a missing one raises
`OSError` at import time and takes the whole API down, not just the PDF
endpoint. The package list is in
[`../../backend/README.md`](../../backend/README.md).

## 1. Start the API

The API is the Django project in `backend/`, alongside this one. Its own README
covers the full setup; the short version, once PostgreSQL is running:

```bash
cd ../backend
uv sync
cp .env.example .env              # set SECRET_KEY and the database credentials
createdb -U postgres tgcservice

uv run python manage.py migrate
uv run python manage.py setup_roles
uv run python manage.py seed      # roles, demo accounts, stone reference data
uv run python manage.py runserver # http://localhost:8000
```

`seed` is not optional. It creates the roles, the stone reference tables and the
demo accounts; without it you can reach the API but cannot sign in to anything,
and the stone-type dropdowns are empty.

The API's browsable schema is at
<http://localhost:8000/api/schema/swagger-ui/> — useful when a response does not
look the way a screen expects.

## 2. Start the frontend

In a second terminal, from this directory:

```bash
pnpm install
cp .env.example .env
pnpm dev                          # http://localhost:5173
```

`.env` needs one variable, and it already has the right default:

```
VITE_API_URL=http://localhost:8000/api/v1
```

The base URL **includes the version segment**, so feature code writes clean
paths like `api.get('/orders')`.

## 3. Sign in

`seed` creates one account per role, as `<role>@tgc.com`. It prints the shared
password when it finishes.

Pick the account that matches what you want to look at — the sidebar and the
row-action menus genuinely differ, because navigation is filtered by the same
permissions the API enforces:

| Account | What it demonstrates |
| --- | --- |
| `superadmin@tgc.com` | Everything. The only account that can edit the protected `superadmin` role. |
| `administrator@tgc.com` | Everything except the protections on `superadmin`. |
| `receptionist@tgc.com` | Takes orders in. Can register customers and create orders, but cannot type a stone or record findings — the Gemmology Lab actions are absent, not disabled. |
| `gemmologist@tgc.com` | The bench. Identification, findings and certification, with no billing. |
| `accountant@tgc.com` | Billing and payments, read-only on the lab. |

**Sign in as `receptionist@tgc.com` once.** It is the fastest way to see that
the permission model is real rather than decorative, and it is the check to
repeat whenever you add a gated screen.

## 4. Walk an order through

The quickest way to understand the app is to push one order the whole way. Each
step is a different screen and a different role's job:

| Step | Screen |
| --- | --- |
| 1. Register a customer and take in their stones | **Orders → Create order** |
| 2. Type each stone, which is what prices it | **Gemmology Lab → Identification** |
| 3. Raise the bill and get a control number | **Billing → Ready to bill** |
| 4. Settle it | **Bills → Simulate payment** (development only) |
| 5. Record what the bench found | **Gemmology Lab → Findings** |
| 6. Issue the certificate and download the PDF | **Certificates → Ready to certify** |

Each stage has a worklist queue standing in front of it, so nobody has to
remember what is waiting.

## 5. Other things worth opening

| Screen | Why |
| --- | --- |
| **Administration → Users → Roles → Permissions** | The permission matrix that makes access control editable at runtime. |
| **Administration → Logs → Audit Logs** | Every write the API has recorded, filterable by event and date. |
| **Administration → Reference data** | Ten lookup tables, one shared implementation. |

## When it does not work

| Symptom | Cause |
| --- | --- |
| Blank tables, "Could not reach the server" | The API is not running, or `VITE_API_URL` does not match the port it chose. |
| Sign-in rejects the demo password | The database was migrated but not seeded. Run `manage.py seed`. |
| Empty stone-type and colour dropdowns | Same cause — `seed` populates the reference tables. |
| A certificate PDF 500s | WeasyPrint's system libraries are missing. See the backend README. |
| "Simulate payment" is missing from a bill | It appears only when the API runs with both `DEBUG` and `GEPG_SIMULATE` on. |
| `pnpm test` fails immediately | Playwright's browser is not installed. Run `pnpm test:browser:install` once. See [testing.md](./testing.md). |
| `tsc --noEmit` passes but the build fails | It checks *nothing* here. Use `pnpm typecheck`. See [testing.md](./testing.md#type-checking). |

## Next

1. **[architecture.md](./architecture.md)** — how the project is organised.
2. **[conventions.md](./conventions.md)** — the patterns that make every screen
   behave the same. Read this before writing a screen.
3. **[adding-a-feature.md](./adding-a-feature.md)** — a walkthrough.
4. **[customizing.md](./customizing.md)** — the branding, navigation and theme
   swap points.
