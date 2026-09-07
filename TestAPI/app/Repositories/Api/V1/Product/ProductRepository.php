<?php

namespace App\Repositories\Api\V1\Product;

use App\Models\Product\Product;
use App\Repositories\Traits\HasQueryFilters;
use Illuminate\Pagination\LengthAwarePaginator;
use Override;

class ProductRepository implements ProductRepositoryInterface
{
    use HasQueryFilters;

    /**
     * @param  array<string, mixed>  $params
     * @return LengthAwarePaginator<int, Product>
     */
    #[Override]
    public function getAll(array $params = []): LengthAwarePaginator
    {
        /** @var LengthAwarePaginator<int, Product> $paginator */
        $paginator = $this->applyQueryParams(
            Product::query()->with([
                'productCategory',
                'brand',
                'productStatus',
                'unitOfMeasure',
            ]),
            $params
        );

        return $paginator;
    }

    #[Override]
    public function getById(int $id): Product
    {
        return Product::findOrFail($id);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    #[Override]
    public function create(array $data): Product
    {
        return Product::create($data);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    #[Override]
    public function update(Product $product, array $data): bool
    {
        return $product->update($data);
    }

    #[Override]
    public function delete(Product $product): bool
    {
        return $product->delete();
    }

    #[Override]
    public function restore(int $id): bool
    {
        $product = Product::withTrashed()->findOrFail($id);

        return $product->restore();
    }
}
