<?php

namespace App\Repositories\Api\V1\Auth;

use App\Models\User\User;
use Override;

class AuthRepository implements AuthRepositoryInterface
{
    #[Override]
    public function findByEmail(string $email): ?User
    {
        return User::query()->where('email', $email)->first();
    }

    /**
     * @param  array<string, mixed>  $data
     */
    #[Override]
    public function create(array $data): User
    {
        return User::create($data);
    }

    #[Override]
    public function touchLastLogin(User $user): bool
    {
        return $user->forceFill(['last_login_at' => now()])->save();
    }

    #[Override]
    public function updatePassword(User $user, string $password): bool
    {
        // The model casts `password` to hashed, so the plain value is hashed
        // on save; forceFill keeps this working regardless of $fillable.
        return $user->forceFill(['password' => $password])->save();
    }
}
