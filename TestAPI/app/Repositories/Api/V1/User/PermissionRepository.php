<?php

namespace App\Repositories\Api\V1\User;

use App\Models\User\Permission;
use App\Repositories\Traits\HasQueryFilters;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;
use Override;

/**
 * Read-only: permissions are defined in code and seeded, so there are no
 * create/update/delete methods here by design.
 */
class PermissionRepository implements PermissionRepositoryInterface
{
    use HasQueryFilters;

    /**
     * @param  array<string, mixed>  $params
     * @return LengthAwarePaginator<int, Permission>
     */
    #[Override]
    public function getAll(array $params = []): LengthAwarePaginator
    {
        /** @var LengthAwarePaginator<int, Permission> $paginator */
        $paginator = $this->applyQueryParams(Permission::query(), $params);

        return $paginator;
    }

    #[Override]
    public function getById(int $id): Permission
    {
        return Permission::findOrFail($id);
    }

    /**
     * @return Collection<int, Permission>
     */
    #[Override]
    public function all(): Collection
    {
        /** @var Collection<int, Permission> $permissions */
        $permissions = Permission::query()->orderBy('name')->get();

        return $permissions;
    }
}
