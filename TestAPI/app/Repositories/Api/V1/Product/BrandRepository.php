<?php

namespace App\Repositories\Api\V1\Product;

use App\Models\Product\Brand;
use App\Repositories\Traits\HasQueryFilters;
use Illuminate\Pagination\LengthAwarePaginator;
use Override;

class BrandRepository implements BrandRepositoryInterface
{
    use HasQueryFilters;

    /**
     * @param  array<string, mixed>  $params
     * @return LengthAwarePaginator<int, Brand>
     */
    #[Override]
    public function getAll(array $params = []): LengthAwarePaginator
    {
        /** @var LengthAwarePaginator<int, Brand> $paginator */
        $paginator = $this->applyQueryParams(Brand::query(), $params);

        return $paginator;
    }

    #[Override]
    public function getById(int $id): Brand
    {
        return Brand::findOrFail($id);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    #[Override]
    public function create(array $data): Brand
    {
        return Brand::create($data);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    #[Override]
    public function update(Brand $brand, array $data): bool
    {
        return $brand->update($data);
    }

    #[Override]
    public function delete(Brand $brand): bool
    {
        return $brand->delete();
    }

    #[Override]
    public function restore(int $id): bool
    {
        $brand = Brand::withTrashed()->findOrFail($id);

        return $brand->restore();
    }
}
