<?php

namespace App\Repositories\Api\V1\Product;

use App\Models\Product\ProductCategory;
use Illuminate\Pagination\LengthAwarePaginator;

interface ProductCategoryRepositoryInterface
{
    /**
     * @param  array<string, mixed>  $params
     * @return LengthAwarePaginator<int, ProductCategory>
     */
    public function getAll(array $params = []): LengthAwarePaginator;

    public function getById(int $id): ProductCategory;

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): ProductCategory;

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(ProductCategory $productCategory, array $data): bool;

    public function delete(ProductCategory $productCategory): bool;

    public function restore(int $id): bool;
}
