<?php

namespace App\Repositories\Api\V1\Product;

use App\Models\Product\ProductImage;
use App\Repositories\Traits\HasQueryFilters;
use Illuminate\Pagination\LengthAwarePaginator;
use Override;

class ProductImageRepository implements ProductImageRepositoryInterface
{
    use HasQueryFilters;

    /**
     * @param  array<string, mixed>  $params
     * @return LengthAwarePaginator<int, ProductImage>
     */
    #[Override]
    public function getAll(array $params = []): LengthAwarePaginator
    {
        /** @var LengthAwarePaginator<int, ProductImage> $paginator */
        $paginator = $this->applyQueryParams(ProductImage::query(), $params);

        return $paginator;
    }

    #[Override]
    public function getById(int $id): ProductImage
    {
        return ProductImage::findOrFail($id);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    #[Override]
    public function create(array $data): ProductImage
    {
        return ProductImage::create($data);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    #[Override]
    public function update(ProductImage $productImage, array $data): bool
    {
        return $productImage->update($data);
    }

    #[Override]
    public function delete(ProductImage $productImage): bool
    {
        return $productImage->delete();
    }

    #[Override]
    public function restore(int $id): bool
    {
        $productImage = ProductImage::withTrashed()->findOrFail($id);

        return $productImage->restore();
    }
}
