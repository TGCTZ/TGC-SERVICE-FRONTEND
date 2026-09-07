<?php

namespace App\Repositories\Api\V1\Product;

use App\Models\Product\ProductImage;
use Illuminate\Pagination\LengthAwarePaginator;

interface ProductImageRepositoryInterface
{
    /**
     * @param  array<string, mixed>  $params
     * @return LengthAwarePaginator<int, ProductImage>
     */
    public function getAll(array $params = []): LengthAwarePaginator;

    public function getById(int $id): ProductImage;

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): ProductImage;

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(ProductImage $productImage, array $data): bool;

    public function delete(ProductImage $productImage): bool;

    public function restore(int $id): bool;
}
