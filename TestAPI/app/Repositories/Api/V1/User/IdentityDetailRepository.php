<?php

namespace App\Repositories\Api\V1\User;

use App\Models\User\IdentityDetail;
use App\Repositories\Traits\HasQueryFilters;
use Illuminate\Pagination\LengthAwarePaginator;
use Override;

class IdentityDetailRepository implements IdentityDetailRepositoryInterface
{
    use HasQueryFilters;

    /**
     * @param  array<string, mixed>  $params
     * @return LengthAwarePaginator<int, IdentityDetail>
     */
    #[Override]
    public function getAll(array $params = []): LengthAwarePaginator
    {
        /** @var LengthAwarePaginator<int, IdentityDetail> $paginator */
        $paginator = $this->applyQueryParams(IdentityDetail::query(), $params);

        return $paginator;
    }

    #[Override]
    public function getById(int $id): IdentityDetail
    {
        return IdentityDetail::findOrFail($id);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    #[Override]
    public function create(array $data): IdentityDetail
    {
        return IdentityDetail::create($data);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    #[Override]
    public function update(IdentityDetail $identityDetail, array $data): bool
    {
        return $identityDetail->update($data);
    }

    #[Override]
    public function delete(IdentityDetail $identityDetail): bool
    {
        return $identityDetail->delete();
    }

    #[Override]
    public function restore(int $id): bool
    {
        $identityDetail = IdentityDetail::withTrashed()->findOrFail($id);

        return $identityDetail->restore();
    }
}
