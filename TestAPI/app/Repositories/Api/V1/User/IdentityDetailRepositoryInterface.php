<?php

namespace App\Repositories\Api\V1\User;

use App\Models\User\IdentityDetail;
use Illuminate\Pagination\LengthAwarePaginator;

interface IdentityDetailRepositoryInterface
{
    /**
     * @param  array<string, mixed>  $params
     * @return LengthAwarePaginator<int, IdentityDetail>
     */
    public function getAll(array $params = []): LengthAwarePaginator;

    public function getById(int $id): IdentityDetail;

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): IdentityDetail;

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(IdentityDetail $identityDetail, array $data): bool;

    public function delete(IdentityDetail $identityDetail): bool;

    public function restore(int $id): bool;
}
