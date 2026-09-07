<?php

namespace App\Repositories\Api\V1\User;

use App\Models\User\Permission;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;

interface PermissionRepositoryInterface
{
    /**
     * @param  array<string, mixed>  $params
     * @return LengthAwarePaginator<int, Permission>
     */
    public function getAll(array $params = []): LengthAwarePaginator;

    public function getById(int $id): Permission;

    /**
     * Every permission, ungrouped — used to build the UI matrix.
     *
     * @return Collection<int, Permission>
     */
    public function all(): Collection;
}
