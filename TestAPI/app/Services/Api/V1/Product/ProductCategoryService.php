<?php

namespace App\Services\Api\V1\Product;

use App\Models\Product\ProductCategory;
use App\Repositories\Api\V1\Product\ProductCategoryRepositoryInterface;
use App\Services\Api\V1\Shared\ResolvesSlug;
use Illuminate\Pagination\LengthAwarePaginator;

class ProductCategoryService
{
    use ResolvesSlug;

    private ProductCategoryRepositoryInterface $productCategoryRepoInterface;

    public function __construct(
        ProductCategoryRepositoryInterface $productCategoryRepoInterface
    ) {
        $this->productCategoryRepoInterface = $productCategoryRepoInterface;
    }

    /**
     * @param  array<string, mixed>  $params
     * @return LengthAwarePaginator<int, ProductCategory>
     */
    public function getAll(array $params = []): LengthAwarePaginator
    {
        return $this->productCategoryRepoInterface->getAll($params);
    }

    public function getById(int $id): ProductCategory
    {
        return $this->productCategoryRepoInterface->getById($id);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): ProductCategory
    {
        $data['slug'] = $this->resolveSlug($data);

        return $this->productCategoryRepoInterface->create($data);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(ProductCategory $productCategory, array $data): bool
    {
        return $this->productCategoryRepoInterface->update($productCategory, $data);
    }

    public function delete(ProductCategory $productCategory): bool
    {
        return $this->productCategoryRepoInterface->delete($productCategory);
    }

    public function restore(int $id): bool
    {
        return $this->productCategoryRepoInterface->restore($id);
    }
}
