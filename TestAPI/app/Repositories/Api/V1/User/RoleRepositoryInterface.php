<?php

namespace App\Repositories\Api\V1\User;

use App\Models\User\Role;
use Illuminate\Pagination\LengthAwarePaginator;

interface RoleRepositoryInterface
{
    /**
     * @param  array<string, mixed>  $params
     * @return LengthAwarePaginator<int, Role>
     */
    public function getAll(array $params = []): LengthAwarePaginator;

    public function getById(int $id): Role;

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): Role;

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Role $role, array $data): bool;

    public function delete(Role $role): bool;

    /**
     * @param  array<int, string>  $permissions
     */
    public function syncPermissions(Role $role, array $permissions): Role;
}
