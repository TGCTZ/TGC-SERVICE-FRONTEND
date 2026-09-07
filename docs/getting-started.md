# Getting Started

From a fresh clone to a running app with data in it.

> **Order matters.** The frontend is an API client with no local data, so start
> the backend first or your first screen will be an empty table and a toast
> saying the server could not be reached.

## Prerequisites

| For | You need |
| --- | --- |
| The frontend | Node 20+, and pnpm (`corepack enable`) |
| The bundled test API | PHP 8.3+, Composer, PostgreSQL |

## 1. Start the backend

The repo ships with **TestAPI**, a small Laravel API in `./TestAPI`. It exists
so the template has something real to talk to — real auth, real permissions,
real pagination. **Nothing in `src/` depends on Laravel**; replace it with your
own backend and the frontend does not care, provided the response envelope
matches (see [architecture.md](./architecture.md)).

```bash
cd TestAPI
composer install
cp .env.example .env            # then set your DB credentials
php artisan key:generate
php artisan migrate --seed      # creates the schema AND the accounts below
php artisan storage:link        # so uploaded images are servable
php artisan serve               # http://localhost:8000
```

`migrate --seed` is not optional. It creates the roles, permissions and test
accounts; without it you can reach the API but cannot sign in to anything.

## 2. Start the frontend

In a second terminal, from the template root:

```bash
pnpm install
cp .env.example .env
pnpm dev                        # http://localhost:5173
```

`.env` needs one variable, and it already has the right default:

```
VITE_API_URL=http://localhost:8000/api/v1
```

The base URL **includes the version segment**, so feature code writes clean
paths like `api.get('/products')`.

## 3. Sign in

Every seeded account uses the password **`1234567890`**.

Pick the account that matches what you want to look at — the sidebar and the
row-action menus genuinely differ, because navigation is filtered by the same
permissions the API enforces:

| Account | Role | What it demonstrates |
| --- | --- | --- |
| `superadmin@test.com` | superadmin | Everything. The only account that can edit the protected `superadmin` role. |
| `admin@test.com` | admin | Everything except the protections on `superadmin`. |
| `manager@test.com` | manager | Full catalogue control, read-only on people — and **no Logs group at all**, since it lacks `activity-logs.viewAny`. |
| `editor@test.com` | editor | Can create and edit catalogue records but not delete them: the Delete row action is absent, not disabled. |
| `viewer@test.com` | viewer | Read-only everywhere. The sidebar is visibly shorter and every row menu collapses to **View**. |

**Sign in as `viewer@test.com` once.** It is the fastest way to see that the
permission model is real rather than decorative, and it is the check to repeat
whenever you add a gated screen.

## 4. Look around

| Screen | Why it is worth opening |
| --- | --- |
| **Products** | The reference feature. Server-side table, full CRUD, image upload, soft delete. |
| **Products → a row → History** | The audit trail: who changed what, field by field. |
| **Administration → Users → Roles → Permissions** | The permission matrix that makes RBAC editable at runtime. |
| **Administration → Logs → Audit Logs** | Every write the API has recorded, filterable by event and date. |
| **Reference data → Tags** | Five lookup screens, one shared implementation. |

## When it does not work

| Symptom | Cause |
| --- | --- |
| Blank tables, "Could not reach the server" | The API is not running, or `VITE_API_URL` does not match the port `php artisan serve` chose. |
| Sign-in rejects the seeded password | The database was migrated but not seeded. Run `php artisan migrate:fresh --seed`. |
| Images 404 | `php artisan storage:link` was skipped. |
| `pnpm test` fails immediately | Playwright's browser is not installed. Run `pnpm test:browser:install` once. See [testing.md](./testing.md). |
| `tsc --noEmit` passes but the build fails | It checks *nothing* here. Use `pnpm typecheck`. See [testing.md](./testing.md#type-checking). |

## Next

1. **[architecture.md](./architecture.md)** — how the project is organised.
2. **[conventions.md](./conventions.md)** — the patterns that make every screen
   behave the same. Read this before writing a screen.
3. **[adding-a-feature.md](./adding-a-feature.md)** — a walkthrough.
4. **[customizing.md](./customizing.md)** — what to change to make it your
   project, and what to delete.
