<?php

namespace App\Repositories\Api\V1\Product;

use App\Models\Product\UnitOfMeasure;
use App\Repositories\Traits\HasQueryFilters;
use Illuminate\Pagination\LengthAwarePaginator;
use Override;

class UnitOfMeasureRepository implements UnitOfMeasureRepositoryInterface
{
    use HasQueryFilters;

    /**
     * @param  array<string, mixed>  $params
     * @return LengthAwarePaginator<int, UnitOfMeasure>
     */
    #[Override]
    public function getAll(array $params = []): LengthAwarePaginator
    {
        /** @var LengthAwarePaginator<int, UnitOfMeasure> $paginator */
        $paginator = $this->applyQueryParams(UnitOfMeasure::query(), $params);

        return $paginator;
    }

    #[Override]
    public function getById(int $id): UnitOfMeasure
    {
        return UnitOfMeasure::findOrFail($id);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    #[Override]
    public function create(array $data): UnitOfMeasure
    {
        return UnitOfMeasure::create($data);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    #[Override]
    public function update(UnitOfMeasure $unitOfMeasure, array $data): bool
    {
        return $unitOfMeasure->update($data);
    }

    #[Override]
    public function delete(UnitOfMeasure $unitOfMeasure): bool
    {
        return $unitOfMeasure->delete();
    }

    #[Override]
    public function restore(int $id): bool
    {
        $unitOfMeasure = UnitOfMeasure::withTrashed()->findOrFail($id);

        return $unitOfMeasure->restore();
    }
}
