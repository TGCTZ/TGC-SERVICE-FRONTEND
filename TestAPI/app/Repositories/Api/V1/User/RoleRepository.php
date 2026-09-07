<?php

namespace App\Repositories\Api\V1\User;

use App\Models\User\Role;
use App\Repositories\Traits\HasQueryFilters;
use Illuminate\Pagination\LengthAwarePaginator;
use Override;

/**
 * Spatie's roles table has no soft deletes, so this repository intentionally
 * omits the restore() method the other repositories carry.
 */
class RoleRepository implements RoleRepositoryInterface
{
    use HasQueryFilters;

    /**
     * @param  array<string, mixed>  $params
     * @return LengthAwarePaginator<int, Role>
     */
    #[Override]
    public function getAll(array $params = []): LengthAwarePaginator
    {
        /** @var LengthAwarePaginator<int, Role> $paginator */
        $paginator = $this->applyQueryParams(
            Role::query()->withCount(['permissions', 'users']),
            $params
        );

        return $paginator;
    }

    #[Override]
    public function getById(int $id): Role
    {
        return Role::with('permissions')->findOrFail($id);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    #[Override]
    public function create(array $data): Role
    {
        return Role::create($data);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    #[Override]
    public function update(Role $role, array $data): bool
    {
        return $role->update($data);
    }

    #[Override]
    public function delete(Role $role): bool
    {
        return (bool) $role->delete();
    }

    /**
     * @param  array<int, string>  $permissions
     */
    #[Override]
    public function syncPermissions(Role $role, array $permissions): Role
    {
        $role->syncPermissions($permissions);

        return $role->load('permissions');
    }
}
