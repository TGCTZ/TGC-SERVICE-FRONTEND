# TestAPI

A purpose-built Laravel API backing the **AlphaDashboard** React frontend during
development. It replaces the frontend mock layer (MSW) and public demo APIs with
a real backend.

Scope is deliberately narrow: **Users (with full, UI-editable RBAC)** and
**Products (with lookups and image uploads)**, plus the system tables.

## Stack

Laravel 13 - PHP 8.3+ - PostgreSQL - Sanctum (Bearer tokens) -
spatie/laravel-permission - Pint - PHPStan.

Architecture is layered and versioned under `Api/V1`:

```
Client -> Route -> Middleware -> FormRequest -> Controller
       -> Service -> Repository -> Model -> DB
       -> API Resource -> JSON
```

See [docs/folder-structure.md](docs/folder-structure.md) for the full
convention, [docs/modules.md](docs/modules.md) for the module list, and
[docs/api/v1.md](docs/api/v1.md) for the endpoint reference.

## Setup

```bash
composer install
cp .env.example .env
php artisan key:generate
```

Configure the database in `.env` (PostgreSQL):

```
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=testapidb
DB_USERNAME=postgres
DB_PASSWORD=your_password
```

> The driver name is `pgsql`, not `psql`. Getting this wrong produces
> "Database connection [psql] not configured."

Then build the schema, seed demo data, and expose uploaded files:

```bash
php artisan migrate:fresh --seed
php artisan storage:link
php artisan serve
```

`storage:link` is required or every uploaded image URL will 404.

The API is then at `http://localhost:8000/api/v1`.

## Frontend integration

`config/cors.php` allows `http://localhost:5173` (Vite) by default; override
with `FRONTEND_URL`. Point the frontend at:

```
VITE_API_URL=http://localhost:8000/api
```

## Demo accounts

All use password `1234567890`.

| Email | Role |
| --- | --- |
| `superadmin@test.com` | superadmin |
| `admin@test.com` | admin |
| `manager@test.com` | manager |
| `editor@test.com` | editor |
| `viewer@test.com` | viewer (read-only - use to test 403s) |

Seeding creates 250 products with lookups, tags and galleries, so pagination,
sorting and filtering are genuinely exercised.

## Commands

| Command | Purpose |
| --- | --- |
| `composer setup` | Install, create .env, generate key |
| `php artisan serve` | Run the API |
| `php artisan migrate:fresh --seed` | Rebuild and reseed the database |
| `php artisan route:list` | Inspect registered routes |
| `composer format` | Format with Pint |
| `composer analyse` | Static analysis with PHPStan |

## Notes

- **Authentication** is Sanctum Bearer tokens. `auth/refresh` mints a new token
  and revokes the current one - the client must store the new value.
- **Authorization** is enforced by spatie `permission:` middleware declared in
  each controller `middleware()` method. Permissions are seeded and read-only;
  roles are editable through the API.
- Roles/permissions use the `web` guard. Do **not** add an `api` guard - it
  would silently break every permission check.
- `composer analyse` reports pre-existing errors caused by running vanilla
  PHPStan (not Larastan) against Eloquent models, which have no declared
  properties. These predate this work.
