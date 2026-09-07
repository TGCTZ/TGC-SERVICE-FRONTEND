<?php

namespace App\Services\Api\V1\User;

use App\Models\User\UserStatus;
use App\Repositories\Api\V1\User\UserStatusRepositoryInterface;
use Illuminate\Pagination\LengthAwarePaginator;

class UserStatusService
{
    private UserStatusRepositoryInterface $userStatusRepoInterface;

    public function __construct(
        UserStatusRepositoryInterface $userStatusRepoInterface
    ) {
        $this->userStatusRepoInterface = $userStatusRepoInterface;
    }

    /**
     * @param  array<string, mixed>  $params
     * @return LengthAwarePaginator<int, UserStatus>
     */
    public function getAll(array $params = []): LengthAwarePaginator
    {
        return $this->userStatusRepoInterface->getAll($params);
    }

    public function getById(int $id): UserStatus
    {
        return $this->userStatusRepoInterface->getById($id);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): UserStatus
    {
        return $this->userStatusRepoInterface->create($data);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(UserStatus $userStatus, array $data): bool
    {
        return $this->userStatusRepoInterface->update($userStatus, $data);
    }

    public function delete(UserStatus $userStatus): bool
    {
        return $this->userStatusRepoInterface->delete($userStatus);
    }

    public function restore(int $id): bool
    {
        return $this->userStatusRepoInterface->restore($id);
    }
}
