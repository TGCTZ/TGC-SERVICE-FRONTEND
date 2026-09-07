<?php

namespace App\Repositories\Api\V1\User;

use App\Models\User\UserStatus;
use Illuminate\Pagination\LengthAwarePaginator;

interface UserStatusRepositoryInterface
{
    /**
     * @param  array<string, mixed>  $params
     * @return LengthAwarePaginator<int, UserStatus>
     */
    public function getAll(array $params = []): LengthAwarePaginator;

    public function getById(int $id): UserStatus;

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): UserStatus;

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(UserStatus $userStatus, array $data): bool;

    public function delete(UserStatus $userStatus): bool;

    public function restore(int $id): bool;
}
