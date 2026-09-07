<?php

namespace App\Repositories\Api\V1\Product;

use App\Models\Product\ProductStatus;
use App\Repositories\Traits\HasQueryFilters;
use Illuminate\Pagination\LengthAwarePaginator;
use Override;

class ProductStatusRepository implements ProductStatusRepositoryInterface
{
    use HasQueryFilters;

    /**
     * @param  array<string, mixed>  $params
     * @return LengthAwarePaginator<int, ProductStatus>
     */
    #[Override]
    public function getAll(array $params = []): LengthAwarePaginator
    {
        /** @var LengthAwarePaginator<int, ProductStatus> $paginator */
        $paginator = $this->applyQueryParams(ProductStatus::query(), $params);

        return $paginator;
    }

    #[Override]
    public function getById(int $id): ProductStatus
    {
        return ProductStatus::findOrFail($id);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    #[Override]
    public function create(array $data): ProductStatus
    {
        return ProductStatus::create($data);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    #[Override]
    public function update(ProductStatus $productStatus, array $data): bool
    {
        return $productStatus->update($data);
    }

    #[Override]
    public function delete(ProductStatus $productStatus): bool
    {
        return $productStatus->delete();
    }

    #[Override]
    public function restore(int $id): bool
    {
        $productStatus = ProductStatus::withTrashed()->findOrFail($id);

        return $productStatus->restore();
    }
}
