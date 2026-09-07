<?php

namespace App\Models\User;

use Spatie\Permission\Models\Permission as SpatiePermission;

/**
 * Application permission.
 *
 * Permissions are code-defined and seeded (see RolesAndPermissionsSeeder) —
 * they are exposed read-only over the API because a permission name only means
 * something if a policy or middleware actually checks it. Roles are the
 * user-editable layer.
 *
 * Registered via config/permission.php → models.permission.
 */
class Permission extends SpatiePermission
{
    /** @var array<int, string> */
    public array $searchable = ['name'];

    /** @var array<int, string> */
    public array $filterable = ['guard_name'];

    /** @var array<int, string> */
    public array $sortable = ['id', 'name'];

    /**
     * The resource segment of the permission name, e.g. "products.create"
     * → "products". Used to group permissions for the UI matrix.
     *
     * A real method rather than an Eloquent accessor so the return type is
     * statically checkable.
     */
    public function resourceGroup(): string
    {
        $name = (string) $this->getAttribute('name');

        return str_contains($name, '.') ? explode('.', $name)[0] : 'general';
    }
}
