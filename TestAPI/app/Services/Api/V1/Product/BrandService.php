<?php

namespace App\Services\Api\V1\Product;

use App\Models\Product\Brand;
use App\Repositories\Api\V1\Product\BrandRepositoryInterface;
use App\Services\Api\V1\Shared\ResolvesSlug;
use Illuminate\Pagination\LengthAwarePaginator;

class BrandService
{
    use ResolvesSlug;

    private BrandRepositoryInterface $brandRepoInterface;

    public function __construct(
        BrandRepositoryInterface $brandRepoInterface
    ) {
        $this->brandRepoInterface = $brandRepoInterface;
    }

    /**
     * @param  array<string, mixed>  $params
     * @return LengthAwarePaginator<int, Brand>
     */
    public function getAll(array $params = []): LengthAwarePaginator
    {
        return $this->brandRepoInterface->getAll($params);
    }

    public function getById(int $id): Brand
    {
        return $this->brandRepoInterface->getById($id);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): Brand
    {
        $data['slug'] = $this->resolveSlug($data);

        return $this->brandRepoInterface->create($data);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Brand $brand, array $data): bool
    {
        return $this->brandRepoInterface->update($brand, $data);
    }

    public function delete(Brand $brand): bool
    {
        return $this->brandRepoInterface->delete($brand);
    }

    public function restore(int $id): bool
    {
        return $this->brandRepoInterface->restore($id);
    }
}
