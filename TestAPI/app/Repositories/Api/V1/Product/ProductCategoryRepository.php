<?php

namespace App\Repositories\Api\V1\Product;

use App\Models\Product\ProductCategory;
use App\Repositories\Traits\HasQueryFilters;
use Illuminate\Pagination\LengthAwarePaginator;
use Override;

class ProductCategoryRepository implements ProductCategoryRepositoryInterface
{
    use HasQueryFilters;

    /**
     * @param  array<string, mixed>  $params
     * @return LengthAwarePaginator<int, ProductCategory>
     */
    #[Override]
    public function getAll(array $params = []): LengthAwarePaginator
    {
        /** @var LengthAwarePaginator<int, ProductCategory> $paginator */
        $paginator = $this->applyQueryParams(ProductCategory::query(), $params);

        return $paginator;
    }

    #[Override]
    public function getById(int $id): ProductCategory
    {
        return ProductCategory::findOrFail($id);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    #[Override]
    public function create(array $data): ProductCategory
    {
        return ProductCategory::create($data);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    #[Override]
    public function update(ProductCategory $productCategory, array $data): bool
    {
        return $productCategory->update($data);
    }

    #[Override]
    public function delete(ProductCategory $productCategory): bool
    {
        return $productCategory->delete();
    }

    #[Override]
    public function restore(int $id): bool
    {
        $productCategory = ProductCategory::withTrashed()->findOrFail($id);

        return $productCategory->restore();
    }
}
