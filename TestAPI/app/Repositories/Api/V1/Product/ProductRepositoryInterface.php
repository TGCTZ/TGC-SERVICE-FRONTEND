<?php

namespace App\Repositories\Api\V1\Product;

use App\Models\Product\Product;
use Illuminate\Pagination\LengthAwarePaginator;

interface ProductRepositoryInterface
{
    /**
     * @param  array<string, mixed>  $params
     * @return LengthAwarePaginator<int, Product>
     */
    public function getAll(array $params = []): LengthAwarePaginator;

    public function getById(int $id): Product;

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): Product;

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Product $product, array $data): bool;

    public function delete(Product $product): bool;

    public function restore(int $id): bool;
}
