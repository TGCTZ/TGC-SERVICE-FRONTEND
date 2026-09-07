<?php

namespace Database\Seeders;

use App\Models\User\Permission;
use App\Models\User\Role;
use Illuminate\Database\Seeder;
use Spatie\Permission\PermissionRegistrar;

class RolesAndPermissionsSeeder extends Seeder
{
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        // Standard CRUD actions mirror Laravel's Policy method names.
        $crud = [
            'viewAny',
            'view',
            'create',
            'update',
            'delete',
            'restore',
        ];

        // Keys must match the `permission:<key>.<action>` strings declared in
        // each controller's middleware() method.
        $resources = [
            'users' => $crud,
            'roles' => $crud,
            'permissions' => ['viewAny', 'view'],
            'user-statuses' => $crud,
            'genders' => $crud,
            'identity-details' => $crud,
            'products' => $crud,
            'product-categories' => $crud,
            'brands' => $crud,
            'product-statuses' => $crud,
            'unit-of-measures' => $crud,
            'tags' => $crud,
            // Read-only: the audit trail is append-only, so there is nothing
            // to create, update or delete.
            'activity-logs' => ['viewAny', 'view'],
            // Log files hold request payloads and stack traces, so this is a
            // narrower grant than any table: read-only, admins only.
            'system-logs' => ['viewAny'],
        ];

        // UI navigation(sidebar) gates
        $modules = [
            'module.user',
            'module.catalog',
            'module.settings',
            'module.audit',
        ];

        $permissions = $modules;

        foreach ($resources as $resource => $actions) {
            foreach ($actions as $action) {
                $permissions[] = "{$resource}.{$action}";
            }
        }

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission]);
        }

        // Roles
        $superadmin = Role::firstOrCreate(['name' => 'superadmin']);
        $admin = Role::firstOrCreate(['name' => 'admin']);
        $manager = Role::firstOrCreate(['name' => 'manager']);
        $editor = Role::firstOrCreate(['name' => 'editor']);
        $viewer = Role::firstOrCreate(['name' => 'viewer']);

        // Assign permissions to roles. superadmin is dynamic so any new permission
        // flows to it automatically; the rest are explicit to keep intent reviewable.
        $superadmin->givePermissionTo(Permission::all());

        // Admin: every permission there is. Deletes are soft and reversible,
        // so there is no longer a destructive tier to withhold; superadmin
        // stays distinct by being protected and by picking up new permissions
        // automatically.
        $admin->givePermissionTo($permissions);

        // Manager: full catalog control, read-only on people.
        $manager->givePermissionTo(
            array_merge(
                [
                    'module.user',
                    'module.catalog',
                    'module.settings',
                    'users.viewAny',
                    'users.view',
                    'roles.viewAny',
                    'roles.view',
                    'permissions.viewAny',
                ],
                $this->crudFor(
                    [
                        'products',
                        'product-categories',
                        'brands',
                        'product-statuses',
                        'unit-of-measures',
                        'tags',
                    ],
                    ['viewAny', 'view', 'create', 'update', 'delete', 'restore']
                )
            )
        );

        // Editor: may create and edit catalog records, but not delete them.
        $editor->givePermissionTo(
            array_merge(
                ['module.catalog'],
                $this->crudFor(
                    [
                        'products',
                        'product-categories',
                        'brands',
                        'product-statuses',
                        'unit-of-measures',
                        'tags',
                    ],
                    ['viewAny', 'view', 'create', 'update']
                )
            )
        );

        // Viewer: read-only everywhere. Useful for testing 403 responses.
        $viewer->givePermissionTo(
            array_merge(
                ['module.catalog', 'module.user'],
                $this->crudFor(
                    [
                        'users',
                        'products',
                        'product-categories',
                        'brands',
                        'product-statuses',
                        'unit-of-measures',
                        'tags',
                    ],
                    ['viewAny', 'view']
                )
            )
        );
    }

    /**
     * Build "<resource>.<action>" names for every resource/action combination.
     *
     * @param  array<int, string>  $resources
     * @param  array<int, string>  $actions
     * @return array<int, string>
     */
    private function crudFor(array $resources, array $actions): array
    {
        $names = [];

        foreach ($resources as $resource) {
            foreach ($actions as $action) {
                $names[] = "{$resource}.{$action}";
            }
        }

        return $names;
    }
}
