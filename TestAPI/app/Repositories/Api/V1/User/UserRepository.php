<?php

namespace App\Repositories\Api\V1\User;

use App\Models\User\User;
use App\Repositories\Traits\HasQueryFilters;
use Illuminate\Pagination\LengthAwarePaginator;
use Override;

class UserRepository implements UserRepositoryInterface
{
    use HasQueryFilters;

    /**
     * @param  array<string, mixed>  $params
     * @return LengthAwarePaginator<int, User>
     */
    #[Override]
    public function getAll(array $params = []): LengthAwarePaginator
    {
        /** @var LengthAwarePaginator<int, User> $paginator */
        $paginator = $this->applyQueryParams(
            User::query()->with(['userStatus', 'gender', 'roles']),
            $params
        );

        return $paginator;
    }

    #[Override]
    public function getById(int $id): User
    {
        return User::findOrFail($id);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    #[Override]
    public function create(array $data): User
    {
        return User::create($data);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    #[Override]
    public function update(User $user, array $data): bool
    {
        return $user->update($data);
    }

    #[Override]
    public function delete(User $user): bool
    {
        return (bool) $user->delete();
    }

    #[Override]
    public function restore(int $id): bool
    {
        $user = User::withTrashed()->findOrFail($id);

        return $user->restore();
    }

    /**
     * @param  array<int, string>  $roles
     */
    #[Override]
    public function syncRoles(User $user, array $roles): User
    {
        $user->syncRoles($roles);

        return $user->load('roles');
    }
}
