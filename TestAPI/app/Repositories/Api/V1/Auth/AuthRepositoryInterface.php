<?php

namespace App\Repositories\Api\V1\Auth;

use App\Models\User\User;

interface AuthRepositoryInterface
{
    public function findByEmail(string $email): ?User;

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): User;

    public function touchLastLogin(User $user): bool;

    public function updatePassword(User $user, string $password): bool;
}
