<?php

namespace App\Services\Api\V1\Product;

use App\Models\Product\Product;
use App\Models\Product\ProductImage;
use App\Repositories\Api\V1\Product\ProductImageRepositoryInterface;
use App\Services\Api\V1\Shared\FileUploadService;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\UploadedFile;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class ProductImageService
{
    private ProductImageRepositoryInterface $productImageRepoInterface;

    private FileUploadService $fileUploadService;

    public function __construct(
        ProductImageRepositoryInterface $productImageRepoInterface,
        FileUploadService $fileUploadService
    ) {
        $this->productImageRepoInterface = $productImageRepoInterface;
        $this->fileUploadService = $fileUploadService;
    }

    /**
     * @param  array<string, mixed>  $params
     * @return LengthAwarePaginator<int, ProductImage>
     */
    public function getAll(array $params = []): LengthAwarePaginator
    {
        return $this->productImageRepoInterface->getAll($params);
    }

    public function getById(int $id): ProductImage
    {
        return $this->productImageRepoInterface->getById($id);
    }

    /**
     * Store one or more uploaded images against a product.
     *
     * The first image of a product with no gallery yet becomes primary, so a
     * product always has something to show without an extra request.
     *
     * @param  array<int, UploadedFile>  $files
     * @param  array<string, mixed>  $attributes
     * @return Collection<int, ProductImage>
     */
    public function uploadMany(
        Product $product,
        array $files,
        array $attributes = []
    ): Collection {
        return DB::transaction(
            function () use ($product, $files, $attributes): Collection {
                $hasPrimary = $product->images()->where('is_primary', true)->exists();
                $nextOrder = (int) $product->images()->max('sort_order');

                /** @var Collection<int, ProductImage> $created */
                $created = new Collection;

                foreach ($files as $file) {
                    $meta = $this->fileUploadService->store($file, 'products/gallery');

                    $image = $this->productImageRepoInterface->create([
                        'product_id' => $product->id,
                        'image_path' => $meta['path'],
                        'original_image_name' => $meta['original_name'],
                        'image_size' => $meta['size'],
                        'mime_type' => $meta['mime_type'],
                        'alt_text' => $attributes['alt_text'] ?? null,
                        'sort_order' => ++$nextOrder,
                        'is_primary' => ! $hasPrimary,
                    ]);

                    $hasPrimary = true;
                    $created->push($image);
                }

                return $created;
            }
        );
    }

    /** Promote one image to primary, demoting the rest of that product's gallery. */
    public function setPrimary(ProductImage $image): bool
    {
        return DB::transaction(function () use ($image): bool {
            ProductImage::query()
                ->where('product_id', $image->product_id)
                ->update(['is_primary' => false]);

            return $image->update(['is_primary' => true]);
        });
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(ProductImage $productImage, array $data): bool
    {
        return $this->productImageRepoInterface->update($productImage, $data);
    }

    /** Soft delete the record and remove the file from disk. */
    public function delete(ProductImage $productImage): bool
    {
        $path = $productImage->image_path;

        $deleted = $this->productImageRepoInterface->delete($productImage);

        if ($deleted) {
            $this->fileUploadService->delete($path);
        }

        return $deleted;
    }

    public function restore(int $id): bool
    {
        return $this->productImageRepoInterface->restore($id);
    }
}
