<?php

namespace App\Repositories\Api\V1\Product;

use App\Models\Product\ProductStatus;
use Illuminate\Pagination\LengthAwarePaginator;

interface ProductStatusRepositoryInterface
{
    /**
     * @param  array<string, mixed>  $params
     * @return LengthAwarePaginator<int, ProductStatus>
     */
    public function getAll(array $params = []): LengthAwarePaginator;

    public function getById(int $id): ProductStatus;

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): ProductStatus;

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(ProductStatus $productStatus, array $data): bool;

    public function delete(ProductStatus $productStatus): bool;

    public function restore(int $id): bool;
}
