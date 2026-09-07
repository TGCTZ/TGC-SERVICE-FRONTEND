<?php

namespace App\Repositories\Api\V1\User;

use App\Models\User\User;
use Illuminate\Pagination\LengthAwarePaginator;

interface UserRepositoryInterface
{
    /**
     * @param  array<string, mixed>  $params
     * @return LengthAwarePaginator<int, User>
     */
    public function getAll(array $params = []): LengthAwarePaginator;

    public function getById(int $id): User;

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): User;

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(User $user, array $data): bool;

    public function delete(User $user): bool;

    public function restore(int $id): bool;

    /**
     * @param  array<int, string>  $roles
     */
    public function syncRoles(User $user, array $roles): User;
}
