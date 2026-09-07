<?php

namespace App\Services\Api\V1\Product;

use App\Models\Product\ProductStatus;
use App\Repositories\Api\V1\Product\ProductStatusRepositoryInterface;
use Illuminate\Pagination\LengthAwarePaginator;

class ProductStatusService
{
    private ProductStatusRepositoryInterface $productStatusRepoInterface;

    public function __construct(
        ProductStatusRepositoryInterface $productStatusRepoInterface
    ) {
        $this->productStatusRepoInterface = $productStatusRepoInterface;
    }

    /**
     * @param  array<string, mixed>  $params
     * @return LengthAwarePaginator<int, ProductStatus>
     */
    public function getAll(array $params = []): LengthAwarePaginator
    {
        return $this->productStatusRepoInterface->getAll($params);
    }

    public function getById(int $id): ProductStatus
    {
        return $this->productStatusRepoInterface->getById($id);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): ProductStatus
    {
        return $this->productStatusRepoInterface->create($data);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(ProductStatus $productStatus, array $data): bool
    {
        return $this->productStatusRepoInterface->update($productStatus, $data);
    }

    public function delete(ProductStatus $productStatus): bool
    {
        return $this->productStatusRepoInterface->delete($productStatus);
    }

    public function restore(int $id): bool
    {
        return $this->productStatusRepoInterface->restore($id);
    }
}
