<?php

namespace App\Services\Api\V1\Product;

use App\Models\Product\UnitOfMeasure;
use App\Repositories\Api\V1\Product\UnitOfMeasureRepositoryInterface;
use Illuminate\Pagination\LengthAwarePaginator;

class UnitOfMeasureService
{
    private UnitOfMeasureRepositoryInterface $unitOfMeasureRepoInterface;

    public function __construct(
        UnitOfMeasureRepositoryInterface $unitOfMeasureRepoInterface
    ) {
        $this->unitOfMeasureRepoInterface = $unitOfMeasureRepoInterface;
    }

    /**
     * @param  array<string, mixed>  $params
     * @return LengthAwarePaginator<int, UnitOfMeasure>
     */
    public function getAll(array $params = []): LengthAwarePaginator
    {
        return $this->unitOfMeasureRepoInterface->getAll($params);
    }

    public function getById(int $id): UnitOfMeasure
    {
        return $this->unitOfMeasureRepoInterface->getById($id);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): UnitOfMeasure
    {
        return $this->unitOfMeasureRepoInterface->create($data);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(UnitOfMeasure $unitOfMeasure, array $data): bool
    {
        return $this->unitOfMeasureRepoInterface->update($unitOfMeasure, $data);
    }

    public function delete(UnitOfMeasure $unitOfMeasure): bool
    {
        return $this->unitOfMeasureRepoInterface->delete($unitOfMeasure);
    }

    public function restore(int $id): bool
    {
        return $this->unitOfMeasureRepoInterface->restore($id);
    }
}
