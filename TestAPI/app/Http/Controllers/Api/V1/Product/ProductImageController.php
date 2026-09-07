<?php

namespace App\Http\Controllers\Api\V1\Product;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Product\ProductImageRequest;
use App\Http\Resources\Api\V1\Product\ProductImageResource;
use App\Models\Product\Product;
use App\Models\Product\ProductImage;
use App\Services\Api\V1\Product\ProductImageService;
use Illuminate\Database\QueryException;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Illuminate\Support\Facades\Log;
use Throwable;

class ProductImageController extends Controller implements HasMiddleware
{
    private ProductImageService $productImageService;

    public function __construct(ProductImageService $productImageService)
    {
        $this->productImageService = $productImageService;
    }

    /**
     * Gallery changes are edits to the parent product, so they are gated on the
     * product permissions rather than a separate resource.
     *
     * @return array<int, Middleware>
     */
    public static function middleware(): array
    {
        return [
            new Middleware('permission:products.update', only: ['store', 'setPrimary']),
            new Middleware('permission:products.delete', only: ['destroy']),
        ];
    }

    public function store(ProductImageRequest $request, Product $product)
    {
        try {
            $images = $this->productImageService->uploadMany(
                $product,
                $request->file('images', []),
                ['alt_text' => $request->validated('alt_text')]
            );

            return response()->json([
                'message' => 'Product images uploaded successfully',
                'product_images' => ProductImageResource::collection($images),
            ], 201);
        } catch (QueryException $e) {
            Log::error(
                'Product image upload failed: '.$e->getMessage(),
                ['product_id' => $product->id]
            );

            return response()->json([
                'error' => 'Database error occurred while uploading images. Please try again.',
            ], 500);
        } catch (Throwable $e) {
            Log::emergency(
                'Unexpected error in product image upload: '.$e->getMessage(),
                [
                    'exception' => get_class($e),
                    'file' => $e->getFile(),
                    'line' => $e->getLine(),
                    'trace' => $e->getTraceAsString(),
                ]
            );

            return response()->json([
                'error' => 'An unexpected error occurred. Please contact support.',
            ], 500);
        }
    }

    public function setPrimary(ProductImage $productImage)
    {
        try {
            $this->productImageService->setPrimary($productImage);

            return response()->json([
                'message' => 'Primary image updated successfully',
                'product_image' => new ProductImageResource($productImage->refresh()),
            ]);
        } catch (Throwable $e) {
            Log::emergency(
                'Unexpected error setting primary image: '.$e->getMessage(),
                [
                    'exception' => get_class($e),
                    'file' => $e->getFile(),
                    'line' => $e->getLine(),
                    'trace' => $e->getTraceAsString(),
                ]
            );

            return response()->json([
                'error' => 'An unexpected error occurred. Please contact support.',
            ], 500);
        }
    }

    public function destroy(ProductImage $productImage)
    {
        try {
            $this->productImageService->delete($productImage);

            return response()->json([
                'message' => 'Product image deleted successfully',
            ]);
        } catch (Throwable $e) {
            Log::emergency(
                'Unexpected error in product image deletion: '.$e->getMessage(),
                [
                    'exception' => get_class($e),
                    'file' => $e->getFile(),
                    'line' => $e->getLine(),
                    'trace' => $e->getTraceAsString(),
                ]
            );

            return response()->json([
                'error' => 'An unexpected error occurred. Please contact support.',
            ], 500);
        }
    }
}
