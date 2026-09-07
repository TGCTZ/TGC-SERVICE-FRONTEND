# Modules and their sub-modules

This API exists to back the AlphaDashboard React frontend during development.
It deliberately contains only two business modules plus the system tables.

1. User
    - User
    - UserStatus
    - Gender
    - IdentityDetail
    - Role          (RBAC — full CRUD, user-editable)
    - Permission    (RBAC — read-only, code-defined and seeded)
2. Product
    - Product
    - ProductImage  (gallery)
    - ProductCategory (self-nesting)
    - Brand
    - ProductStatus
    - UnitOfMeasure
    - Tag           (many-to-many with Product)
3. Audit
    - ActivityLog   (append-only; read-only API, written by AuditLogger)

## System tables

`users`, `password_reset_tokens`, `sessions`, `cache`, `jobs`,
`personal_access_tokens` (Sanctum), and the spatie permission tables
(`roles`, `permissions`, `model_has_roles`, `model_has_permissions`,
`role_has_permissions`).
