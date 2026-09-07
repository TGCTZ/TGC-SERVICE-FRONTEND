<?php

namespace App\Http\Controllers\Api\V1\Product;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Product\ProductCategoryRequest;
use App\Http\Resources\Api\V1\Product\ProductCategoryCollection;
use App\Http\Resources\Api\V1\Product\ProductCategoryResource;
use App\Models\Product\ProductCategory;
use App\Services\Api\V1\Product\ProductCategoryService;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Illuminate\Support\Facades\Log;
use Throwable;

class ProductCategoryController extends Controller implements HasMiddleware
{
    private ProductCategoryService $productCategoryService;

    public function __construct(ProductCategoryService $productCategoryService)
    {
        $this->productCategoryService = $productCategoryService;
    }

    /**
     * Permission gate for each action, enforced by spatie's middleware.
     *
     * @return array<int, Middleware>
     */
    public static function middleware(): array
    {
        return [
            new Middleware('permission:product-categories.viewAny', only: ['index']),
            new Middleware('permission:product-categories.view', only: ['show']),
            new Middleware('permission:product-categories.create', only: ['store']),
            new Middleware('permission:product-categories.update', only: ['update']),
            new Middleware('permission:product-categories.delete', only: ['destroy']),
            new Middleware('permission:product-categories.restore', only: ['restore']),
        ];
    }

    public function index(Request $request)
    {
        try {
            $records = $this->productCategoryService->getAll($request->query());

            return new ProductCategoryCollection($records);
        } catch (Throwable $e) {
            Log::emergency('Error fetching product categories: '.$e->getMessage(), [
                'exception' => get_class($e),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'error' => 'Failed to fetch product categories. Please try again.',
            ], 500);
        }
    }

    public function store(ProductCategoryRequest $request)
    {
        $validated = $request->validated();

        try {
            $productCategory = $this->productCategoryService->create($validated);

            return response()->json([
                'message' => 'Product category created successfully',
                'product_category' => new ProductCategoryResource($productCategory),
            ], 201);
        } catch (QueryException $e) {
            Log::error(
                'Product category creation failed: '.$e->getMessage(),
                ['validated' => $validated]
            );

            return response()->json([
                'error' => 'Database error occurred while creating product category. Please try again.',
            ], 500);
        } catch (Throwable $e) {
            Log::emergency(
                'Unexpected error in product category creation: '.$e->getMessage(),
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

    public function show(ProductCategory $productCategory)
    {
        return new ProductCategoryResource($productCategory);
    }

    public function update(ProductCategoryRequest $request, ProductCategory $productCategory)
    {
        $validated = $request->validated();

        try {
            $this->productCategoryService->update($productCategory, $validated);

            return response()->json([
                'message' => 'Product category updated successfully',
                'product_category' => new ProductCategoryResource($productCategory->refresh()),
            ], 200);
        } catch (QueryException $e) {
            Log::error(
                'Product category update failed: '.$e->getMessage(),
                ['validated' => $validated]
            );

            return response()->json([
                'error' => 'Database error occurred while updating product category. Please try again.',
            ], 500);
        } catch (Throwable $e) {
            Log::emergency(
                'Unexpected error in product category update: '.$e->getMessage(),
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

    public function destroy(ProductCategory $productCategory)
    {
        try {
            $this->productCategoryService->delete($productCategory);

            return response()->json([
                'message' => 'Product category deleted successfully',
            ]);
        } catch (QueryException $e) {
            Log::error('Product category deletion failed: '.$e->getMessage());

            return response()->json([
                'error' => 'Database error occurred while deleting product category. Please try again.',
            ], 500);
        } catch (Throwable $e) {
            Log::emergency(
                'Unexpected error in product category deletion: '.$e->getMessage(),
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
            $this->productCategoryService->restore((int) $id);

            return response()->json([
                'message' => 'Product category restored successfully',
            ]);
        } catch (QueryException $e) {
            Log::error('Product category restoration failed: '.$e->getMessage());
        } catch (Throwable $e) {
            Log::emergency(
                'Unexpected error in product category restoration: '.$e->getMessage(),
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
