<?php

namespace App\Services\Api\V1\User;

use App\Models\User\IdentityDetail;
use App\Repositories\Api\V1\User\IdentityDetailRepositoryInterface;
use Illuminate\Pagination\LengthAwarePaginator;

class IdentityDetailService
{
    private IdentityDetailRepositoryInterface $identityDetailRepoInterface;

    public function __construct(
        IdentityDetailRepositoryInterface $identityDetailRepoInterface
    ) {
        $this->identityDetailRepoInterface = $identityDetailRepoInterface;
    }

    /**
     * @param  array<string, mixed>  $params
     * @return LengthAwarePaginator<int, IdentityDetail>
     */
    public function getAll(array $params = []): LengthAwarePaginator
    {
        return $this->identityDetailRepoInterface->getAll($params);
    }

    public function getById(int $id): IdentityDetail
    {
        return $this->identityDetailRepoInterface->getById($id);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): IdentityDetail
    {
        return $this->identityDetailRepoInterface->create($data);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(IdentityDetail $identityDetail, array $data): bool
    {
        return $this->identityDetailRepoInterface->update($identityDetail, $data);
    }

    public function delete(IdentityDetail $identityDetail): bool
    {
        return $this->identityDetailRepoInterface->delete($identityDetail);
    }

    public function restore(int $id): bool
    {
        return $this->identityDetailRepoInterface->restore($id);
    }
}
