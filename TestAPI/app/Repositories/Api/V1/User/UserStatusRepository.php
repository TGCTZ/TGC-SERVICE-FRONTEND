<?php

namespace App\Repositories\Api\V1\User;

use App\Models\User\UserStatus;
use App\Repositories\Traits\HasQueryFilters;
use Illuminate\Pagination\LengthAwarePaginator;
use Override;

class UserStatusRepository implements UserStatusRepositoryInterface
{
    use HasQueryFilters;

    /**
     * @param  array<string, mixed>  $params
     * @return LengthAwarePaginator<int, UserStatus>
     */
    #[Override]
    public function getAll(array $params = []): LengthAwarePaginator
    {
        /** @var LengthAwarePaginator<int, UserStatus> $paginator */
        $paginator = $this->applyQueryParams(UserStatus::query(), $params);

        return $paginator;
    }

    #[Override]
    public function getById(int $id): UserStatus
    {
        return UserStatus::findOrFail($id);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    #[Override]
    public function create(array $data): UserStatus
    {
        return UserStatus::create($data);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    #[Override]
    public function update(UserStatus $userStatus, array $data): bool
    {
        return $userStatus->update($data);
    }

    #[Override]
    public function delete(UserStatus $userStatus): bool
    {
        return $userStatus->delete();
    }

    #[Override]
    public function restore(int $id): bool
    {
        $userStatus = UserStatus::withTrashed()->findOrFail($id);

        return $userStatus->restore();
    }
}
