<?php

namespace App\Repositories\Api\V1\Product;

use App\Models\Product\UnitOfMeasure;
use Illuminate\Pagination\LengthAwarePaginator;

interface UnitOfMeasureRepositoryInterface
{
    /**
     * @param  array<string, mixed>  $params
     * @return LengthAwarePaginator<int, UnitOfMeasure>
     */
    public function getAll(array $params = []): LengthAwarePaginator;

    public function getById(int $id): UnitOfMeasure;

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): UnitOfMeasure;

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(UnitOfMeasure $unitOfMeasure, array $data): bool;

    public function delete(UnitOfMeasure $unitOfMeasure): bool;

    public function restore(int $id): bool;
}
