<?php

namespace App\Models\User;

use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Spatie\Permission\Models\Role as SpatieRole;
use Spatie\Permission\PermissionRegistrar;

/**
 * Application role.
 *
 * Extends the spatie model so roles live under this codebase's
 * App\Models\<Module> convention while keeping every spatie behaviour.
 * Registered via config/permission.php → models.role.
 *
 * Note: spatie's roles/permissions tables have no soft deletes, so this model
 * intentionally has no `restore` support.
 */
class Role extends SpatieRole
{
    /**
     * Roles that must always exist and may not be renamed or deleted.
     *
     * @var array<int, string>
     */
    public const PROTECTED_ROLES = ['superadmin'];

    /**
     * Default guard for new instances.
     *
     * spatie resolves the related user model from `guard_name`. Without a
     * default, aggregate queries such as withCount('users') build the relation
     * on an attribute-less instance, guard_name is null, and the lookup fails.
     *
     * @var array<string, mixed>
     */
    protected $attributes = ['guard_name' => 'web'];

    /** @var array<int, string> */
    public array $searchable = ['name'];

    /** @var array<int, string> */
    public array $filterable = ['guard_name'];

    /** @var array<int, string> */
    public array $sortable = ['id', 'name', 'created_at'];

    /** @var array<int, string> */
    public array $includable = ['permissions'];

    /**
     * Users holding this role.
     *
     * Overrides spatie, which derives the related model from the role guard and
     * falls back to `auth.defaults.guard`. The `auth:sanctum` middleware
     * rewrites that default to "sanctum" at runtime, and the auto-registered
     * sanctum guard has no provider, so the lookup returns null and the
     * relation blows up. This app has exactly one user model, so name it.
     */
    public function users(): BelongsToMany
    {
        return $this->morphedByMany(
            User::class,
            'model',
            config('permission.table_names.model_has_roles'),
            app(PermissionRegistrar::class)->pivotRole,
            config('permission.column_names.model_morph_key')
        );
    }

    /** Whether this role is protected from rename/delete. */
    public function isProtected(): bool
    {
        return in_array($this->name, self::PROTECTED_ROLES, true);
    }
}
