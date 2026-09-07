<?php

namespace App\Services\Api\V1\User;

use App\Models\User\Permission;
use App\Repositories\Api\V1\User\PermissionRepositoryInterface;
use Illuminate\Pagination\LengthAwarePaginator;

class PermissionService
{
    private PermissionRepositoryInterface $permissionRepoInterface;

    public function __construct(
        PermissionRepositoryInterface $permissionRepoInterface
    ) {
        $this->permissionRepoInterface = $permissionRepoInterface;
    }

    /**
     * @param  array<string, mixed>  $params
     * @return LengthAwarePaginator<int, Permission>
     */
    public function getAll(array $params = []): LengthAwarePaginator
    {
        return $this->permissionRepoInterface->getAll($params);
    }

    public function getById(int $id): Permission
    {
        return $this->permissionRepoInterface->getById($id);
    }

    /**
     * Permissions grouped by their resource segment, ready for the UI matrix.
     *
     * e.g. ['products' => ['products.viewAny', 'products.create', ...], ...]
     *
     * @return array<string, array<int, string>>
     */
    public function grouped(): array
    {
        return $this->permissionRepoInterface->all()
            ->groupBy(fn (Permission $permission): string => $permission->resourceGroup())
            ->map(
                fn ($permissions) => $permissions
                    ->pluck('name')
                    ->values()
                    ->all()
            )
            ->toArray();
    }
}
