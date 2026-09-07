# Laravel API Project Architecture & Documentation Guide

## Laravel 12 + Service Layer + Repository Pattern + API Versioning

This document provides a comprehensive guide to the project's directory
structure, architectural layers, naming conventions, and request lifecycle. The
structure follows modern Laravel API development practices by separating HTTP
concerns, business logic, and data access, ensuring scalability,
maintainability, and testability.

---

# 1. High-Level Architectural Overview

The application is structured using a layered architecture that separates
responsibilities into distinct components:

1. **HTTP Layer (`app/Http/`)**

    * Handles incoming requests and outgoing responses.
    * Responsible for routing, validation, middleware execution, and API
      resource transformation.
    * Should contain little to no business logic.

2. **Business Layer (`app/Services/`)**

    * Contains application business rules and workflows.
    * Coordinates repositories, transactions, and domain operations.
    * Independent of HTTP concerns.

3. **Data Access Layer (`app/Repositories/`)**

    * Responsible for database interaction.
    * Encapsulates Eloquent queries and persistence logic.
    * Provides a clean interface to the service layer.

4. **Persistence Layer (`app/Models/`)**

    * Represents database entities using Eloquent ORM.
    * Defines relationships, casts, scopes, and model-level behavior.

5. **Infrastructure Layer**

    * Includes framework configuration, bootstrapping, service providers,
      caching, storage, logging, and external integrations.
    * Located primarily in:

        * `bootstrap/`
        * `config/`
        * `storage/`
        * `app/Providers/`

---

# 2. Request Flow Overview

Every API request follows the path below:

```text
Client
  │
  ▼
Routes
  │
  ▼
Middleware
  │
  ▼
Form Request Validation
  │
  ▼
Controller
  │
  ▼
Service
  │
  ▼
Repository
  │
  ▼
Model
  │
  ▼
Database
  │
  ▼
API Resource
  │
  ▼
JSON Response
```

This separation ensures that each layer has a single responsibility.

---

# 3. Detailed Directory Breakdown & File Examples

Below is the structured breakdown of the project.

---

## 📂 app/

Contains all custom application logic.

Laravel automatically maps the `App\` namespace to this directory through
Composer PSR-4 autoloading.

---

### 📂 app/Exceptions/

Responsible for application-specific exception handling and API error responses.

#### Purpose

Provides a centralized way to represent and render domain errors.

#### Example Files

* `ApiException.php`
* `ValidationException.php`
* `NotFoundException.php`
* `ForbiddenException.php`

#### Example Use Cases

* Resource not found
* Business rule violations
* Authorization failures
* Custom API error formatting

---

### 📂 app/Http/

The application's HTTP layer.

Responsible for receiving requests and returning responses.

---

#### 📂 app/Http/Controllers/

Handles incoming HTTP requests.

#### Responsibilities

* Receive validated requests
* Delegate business logic to services
* Return API Resources

#### Example Files

* `Api/V1/User/Controller.php`
* `Api/V1/Product/Controller.php`

#### Best Practices

Controllers should remain thin and contain no business logic.

---

#### 📂 app/Http/Middleware/

Reusable request filters executed before or after controllers.

#### Example Files

* `ForceJsonResponse.php`
* `SetRequestId.php`

#### Common Responsibilities

* Authentication
* Authorization
* Logging
* Request tracking
* API response formatting

---

#### 📂 app/Http/Requests/

Form Request validation classes.

#### Responsibilities

* Input validation
* Request authorization

#### Example Files

* `UserStoreRequest.php`
* `UserUpdateRequest.php`
* `ProductStoreRequest.php`

#### Benefits

Keeps validation logic out of controllers.

---

#### 📂 app/Http/Resources/

Transforms Eloquent models into API-friendly JSON responses.

#### Example Files

* `UserResource.php`
* `UserCollection.php`
* `ProductResource.php`

#### Responsibilities

* Hide internal attributes
* Format dates
* Shape API contracts
* Version response formats

---

### 📂 app/Models/

Represents database entities.

#### Responsibilities

* Relationships
* Attribute casting
* Query scopes
* ORM mapping

#### Example Files

* `User.php`
* `Product.php`
* `Order.php`

---

### 📂 app/Services/

Contains business logic.

#### Responsibilities

* Execute application workflows
* Coordinate repositories
* Manage transactions
* Enforce domain rules

#### Example Structure

```text
Services/
├── Auth/
│   ├── Service.php
│   └── TokenService.php
├── User/
│   └── Service.php
└── Product/
    └── Service.php
```

#### Benefits

Makes business logic reusable and independently testable.

---

### 📂 app/Repositories/

Data access layer.

#### Responsibilities

* Encapsulate database queries
* Manage persistence
* Abstract Eloquent complexity

#### Example Structure

```text
Repositories/
├── Auth/
│   └── Repository.php
├── Product/
│   └── Repository.php
└── Contracts/
    └── ProductRepositoryInterface.php
```

#### Benefits

Keeps services focused on business logic rather than query construction.

---

### 📂 app/Providers/

Service container and framework configuration.

#### Example Files

* `AppServiceProvider.php`
* `AuthServiceProvider.php`
* `EventServiceProvider.php`

#### Responsibilities

* Register bindings
* Configure policies
* Register macros
* Configure framework behavior

---

## 📂 bootstrap/

Application startup and initialization.

### Important Files

* `app.php`
* `providers.php`

### Responsibilities

* Register routes
* Register middleware
* Configure exception handling
* Boot Laravel

---

## 📂 config/

Centralized configuration files.

### Example Files

* `app.php`
* `database.php`
* `auth.php`
* `queue.php`
* `sanctum.php`

### Purpose

Allows environment-specific behavior through `.env`.

---

## 📂 database/

Database schema and test data management.

### 📂 database/migrations/

Version-controlled schema changes.

### 📂 database/factories/

Generate fake data for testing.

### 📂 database/seeders/

Populate databases with initial data.

---

## 📂 docs/

Project documentation.

### Example Content

* API reference
* Authentication guides
* Folder structure documentation
* Postman collections

### Purpose

Provides onboarding and integration documentation.

---

## 📂 public/

Public web server entry point.

### Important Files

* `index.php`
* `.htaccess`
* `robots.txt`

### Purpose

Only directory exposed to the internet.

---

## 📂 routes/

API route definitions.

### Example Structure

```text
routes/
├── api.php
├── Api/
│   ├── v1.php
│   └── v2.php
└── console.php
```

### Benefits

Supports clean API versioning and route organization.

---

## 📂 storage/

Runtime-generated files.

### Common Contents

* Logs
* Cache
* Uploaded files
* Sessions

### Important Note

Never commit runtime-generated contents.

---

## 📂 tests/

Automated testing suite.

### 📂 tests/Unit/

Tests services, repositories, and helpers.

### 📂 tests/Feature/

Tests complete HTTP request flows.

### Example Files

* `ProductServiceTest.php`
* `ProductControllerTest.php`
* `AuthTest.php`

### Benefits

Ensures application correctness and prevents regressions.

---

# 4. API Versioning Strategy

API endpoints are organized by version:

```text
app/Http/Controllers/
├── Api/
│   ├── V1/
│   └── V2/
```

This allows:

* Backward compatibility
* Gradual API evolution
* Safe contract changes

Example:

```text
/api/v1/products
/api/v2/products
```

---

# 5. Module Development Structure

When creating a new module (e.g., Product), the following components should be
added:

```text
Product
├── Controller
├── Requests
├── Resources
├── Service
├── Repository
├── Model
├── Migration
└── Tests
```

This ensures each module remains self-contained and follows the project's
architecture consistently.

---

# 6. PSR-4 Namespace & Naming Conventions

Composer maps namespaces directly to folders.

Example:

```text
app/Services/Product/Service.php
```

Namespace:

```php
namespace App\Services\Product;
```

Class:

```php
class Service
{
}
```

### Rule

Folder structure, namespace, file name, and class name must always match.

---

# 7. Folders Intentionally Omitted

Because this project is API-only, the following Laravel frontend folders are
omitted or unused:

* `resources/views/`
* `routes/web.php`
* `resources/js/`
* `resources/css/`
* `app/View/Components/`

This keeps the project focused exclusively on backend API development.

---

# 8. Development Commands

```bash
composer setup
composer test
composer analyse
composer format

php artisan migrate
php artisan route:list
php artisan db:seed
```

These commands cover setup, testing, formatting, analysis, and database
management.

# ⊢
