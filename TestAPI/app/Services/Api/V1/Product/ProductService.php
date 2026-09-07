<?php

namespace App\Services\Api\V1\Product;

use App\Models\Product\Product;
use App\Repositories\Api\V1\Product\ProductRepositoryInterface;
use App\Services\Api\V1\Shared\FileUploadService;
use App\Services\Api\V1\Shared\ResolvesSlug;
use Illuminate\Http\UploadedFile;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

/**
 * Unlike the lookup services, this one is not a pure pass-through: creating a
 * product also stores its main image and syncs its tags, which must succeed or
 * fail together — hence the transactions.
 */
class ProductService
{
    use ResolvesSlug;

    private ProductRepositoryInterface $productRepoInterface;

    private FileUploadService $fileUploadService;

    public function __construct(
        ProductRepositoryInterface $productRepoInterface,
        FileUploadService $fileUploadService
    ) {
        $this->productRepoInterface = $productRepoInterface;
        $this->fileUploadService = $fileUploadService;
    }

    /**
     * @param  array<string, mixed>  $params
     * @return LengthAwarePaginator<int, Product>
     */
    public function getAll(array $params = []): LengthAwarePaginator
    {
        return $this->productRepoInterface->getAll($params);
    }

    public function getById(int $id): Product
    {
        return $this->productRepoInterface->getById($id);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): Product
    {
        return DB::transaction(function () use ($data): Product {
            $tags = $this->pull($data, 'tags');
            $image = $this->pull($data, 'image');

            if ($image instanceof UploadedFile) {
                $data = array_merge($data, $this->imageColumns($image));
            }

            $data['slug'] = $this->resolveSlug($data);

            $product = $this->productRepoInterface->create($data);

            if (is_array($tags)) {
                $product->tags()->sync($tags);
            }

            return $product->load(
                ['productCategory', 'brand', 'productStatus', 'unitOfMeasure', 'tags']
            );
        });
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Product $product, array $data): bool
    {
        return DB::transaction(function () use ($product, $data): bool {
            $tags = $this->pull($data, 'tags');
            $image = $this->pull($data, 'image');

            if ($image instanceof UploadedFile) {
                // Replace: store the new file first, then drop the old one so a
                // failed upload never leaves the product without an image.
                $previousPath = $product->image_path;
                $data = array_merge($data, $this->imageColumns($image));
                $this->fileUploadService->delete($previousPath);
            }

            $updated = $this->productRepoInterface->update($product, $data);

            if (is_array($tags)) {
                $product->tags()->sync($tags);
            }

            return $updated;
        });
    }

    public function delete(Product $product): bool
    {
        // Soft delete — the image is deliberately kept so restore() still works.
        return $this->productRepoInterface->delete($product);
    }

    public function restore(int $id): bool
    {
        return $this->productRepoInterface->restore($id);
    }

    /**
     * Map an uploaded file onto the product's image columns.
     *
     * @return array<string, mixed>
     */
    private function imageColumns(UploadedFile $image): array
    {
        $meta = $this->fileUploadService->store($image, 'products');

        return [
            'image_path' => $meta['path'],
            'original_image_name' => $meta['original_name'],
            'image_size' => $meta['size'],
            'mime_type' => $meta['mime_type'],
        ];
    }

    private function pull(array &$data, string $key): mixed
    {
        $value = $data[$key] ?? null;
        unset($data[$key]);

        return $value;
    }
}
