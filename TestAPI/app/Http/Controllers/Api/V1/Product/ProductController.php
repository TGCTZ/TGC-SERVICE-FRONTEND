<?php

namespace App\Http\Controllers\Api\V1\Product;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Product\ProductRequest;
use App\Http\Resources\Api\V1\Product\ProductCollection;
use App\Http\Resources\Api\V1\Product\ProductResource;
use App\Models\Product\Product;
use App\Services\Api\V1\Product\ProductService;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Illuminate\Support\Facades\Log;
use Throwable;

class ProductController extends Controller implements HasMiddleware
{
    private ProductService $productService;

    public function __construct(ProductService $productService)
    {
        $this->productService = $productService;
    }

    /**
     * Permission gate for each action, enforced by spatie's middleware.
     *
     * @return array<int, Middleware>
     */
    public static function middleware(): array
    {
        return [
            new Middleware('permission:products.viewAny', only: ['index']),
            new Middleware('permission:products.view', only: ['show']),
            new Middleware('permission:products.create', only: ['store']),
            new Middleware('permission:products.update', only: ['update']),
            new Middleware('permission:products.delete', only: ['destroy']),
            new Middleware('permission:products.restore', only: ['restore']),
        ];
    }

    public function index(Request $request)
    {
        try {
            $products = $this->productService->getAll($request->query());

            return new ProductCollection($products);
        } catch (Throwable $e) {
            Log::emergency('Error fetching products: '.$e->getMessage(), [
                'exception' => get_class($e),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'error' => 'Failed to fetch products. Please try again.',
            ], 500);
        }
    }

    public function store(ProductRequest $request)
    {
        $validated = $request->validated();

        // The uploaded file never reaches validated(), so attach it explicitly.
        if ($request->hasFile('image')) {
            $validated['image'] = $request->file('image');
        }

        try {
            $product = $this->productService->create($validated);

            return response()->json([
                'message' => 'Product created successfully',
                'product' => new ProductResource($product),
            ], 201);
        } catch (QueryException $e) {
            Log::error(
                'Product creation failed: '.$e->getMessage(),
                ['validated' => $request->safe()->except('image')]
            );

            return response()->json([
                'error' => 'Database error occurred while creating product. Please try again.',
            ], 500);
        } catch (Throwable $e) {
            Log::emergency(
                'Unexpected error in product creation: '.$e->getMessage(),
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

    public function show(Product $product)
    {
        return new ProductResource(
            $product->load([
                'productCategory',
                'brand',
                'productStatus',
                'unitOfMeasure',
                'tags',
                'images' => fn ($query) => $query->orderBy('sort_order'),
            ])
        );
    }

    public function update(ProductRequest $request, Product $product)
    {
        $validated = $request->validated();

        if ($request->hasFile('image')) {
            $validated['image'] = $request->file('image');
        }

        try {
            $this->productService->update($product, $validated);

            return response()->json([
                'message' => 'Product updated successfully',
                'product' => new ProductResource(
                    $product->refresh()->load(
                        ['productCategory', 'brand', 'productStatus', 'tags']
                    )
                ),
            ], 200);
        } catch (QueryException $e) {
            Log::error(
                'Product update failed: '.$e->getMessage(),
                ['validated' => $request->safe()->except('image')]
            );

            return response()->json([
                'error' => 'Database error occurred while updating product. Please try again.',
            ], 500);
        } catch (Throwable $e) {
            Log::emergency(
                'Unexpected error in product update: '.$e->getMessage(),
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

    public function destroy(Product $product)
    {
        try {
            $this->productService->delete($product);

            return response()->json([
                'message' => 'Product deleted successfully',
            ]);
        } catch (QueryException $e) {
            Log::error('Product deletion failed: '.$e->getMessage());

            return response()->json([
                'error' => 'Database error occurred while deleting product. Please try again.',
            ], 500);
        } catch (Throwable $e) {
            Log::emergency(
                'Unexpected error in product deletion: '.$e->getMessage(),
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

    public function restore($id)
    {
        try {
            $this->productService->restore((int) $id);

            return response()->json([
                'message' => 'Product restored successfully',
            ]);
        } catch (QueryException $e) {
            Log::error('Product restoration failed: '.$e->getMessage());
        } catch (Throwable $e) {
            Log::emergency(
                'Unexpected error in product restoration: '.$e->getMessage(),
                [
                    'exception' => get_class($e),
                    'file' => $e->getFile(),
                    'line' => $e->getLine(),
                    'trace' => $e->getTraceAsString(),
                ]
            );
        }

        return response()->json([
            'error' => 'An unexpected error occurred. Please contact support.',
        ], 500);
    }
}
