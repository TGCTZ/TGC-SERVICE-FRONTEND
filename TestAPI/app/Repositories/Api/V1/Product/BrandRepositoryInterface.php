<?php

namespace App\Repositories\Api\V1\Product;

use App\Models\Product\Brand;
use Illuminate\Pagination\LengthAwarePaginator;

interface BrandRepositoryInterface
{
    /**
     * @param  array<string, mixed>  $params
     * @return LengthAwarePaginator<int, Brand>
     */
    public function getAll(array $params = []): LengthAwarePaginator;

    public function getById(int $id): Brand;

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): Brand;

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Brand $brand, array $data): bool;

    public function delete(Brand $brand): bool;

    public function restore(int $id): bool;
}
