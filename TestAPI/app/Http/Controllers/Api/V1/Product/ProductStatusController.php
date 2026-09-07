<?php

namespace App\Http\Controllers\Api\V1\Product;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Product\ProductStatusRequest;
use App\Http\Resources\Api\V1\Product\ProductStatusCollection;
use App\Http\Resources\Api\V1\Product\ProductStatusResource;
use App\Models\Product\ProductStatus;
use App\Services\Api\V1\Product\ProductStatusService;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Illuminate\Support\Facades\Log;
use Throwable;

class ProductStatusController extends Controller implements HasMiddleware
{
    private ProductStatusService $productStatusService;

    public function __construct(ProductStatusService $productStatusService)
    {
        $this->productStatusService = $productStatusService;
    }

    /**
     * Permission gate for each action, enforced by spatie's middleware.
     *
     * @return array<int, Middleware>
     */
    public static function middleware(): array
    {
        return [
            new Middleware('permission:product-statuses.viewAny', only: ['index']),
            new Middleware('permission:product-statuses.view', only: ['show']),
            new Middleware('permission:product-statuses.create', only: ['store']),
            new Middleware('permission:product-statuses.update', only: ['update']),
            new Middleware('permission:product-statuses.delete', only: ['destroy']),
            new Middleware('permission:product-statuses.restore', only: ['restore']),
        ];
    }

    public function index(Request $request)
    {
        try {
            $records = $this->productStatusService->getAll($request->query());

            return new ProductStatusCollection($records);
        } catch (Throwable $e) {
            Log::emergency('Error fetching product statuses: '.$e->getMessage(), [
                'exception' => get_class($e),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'error' => 'Failed to fetch product statuses. Please try again.',
            ], 500);
        }
    }

    public function store(ProductStatusRequest $request)
    {
        $validated = $request->validated();

        try {
            $productStatus = $this->productStatusService->create($validated);

            return response()->json([
                'message' => 'Product status created successfully',
                'product_status' => new ProductStatusResource($productStatus),
            ], 201);
        } catch (QueryException $e) {
            Log::error(
                'Product status creation failed: '.$e->getMessage(),
                ['validated' => $validated]
            );

            return response()->json([
                'error' => 'Database error occurred while creating product status. Please try again.',
            ], 500);
        } catch (Throwable $e) {
            Log::emergency(
                'Unexpected error in product status creation: '.$e->getMessage(),
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

    public function show(ProductStatus $productStatus)
    {
        return new ProductStatusResource($productStatus);
    }

    public function update(ProductStatusRequest $request, ProductStatus $productStatus)
    {
        $validated = $request->validated();

        try {
            $this->productStatusService->update($productStatus, $validated);

            return response()->json([
                'message' => 'Product status updated successfully',
                'product_status' => new ProductStatusResource($productStatus->refresh()),
            ], 200);
        } catch (QueryException $e) {
            Log::error(
                'Product status update failed: '.$e->getMessage(),
                ['validated' => $validated]
            );

            return response()->json([
                'error' => 'Database error occurred while updating product status. Please try again.',
            ], 500);
        } catch (Throwable $e) {
            Log::emergency(
                'Unexpected error in product status update: '.$e->getMessage(),
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

    public function destroy(ProductStatus $productStatus)
    {
        try {
            $this->productStatusService->delete($productStatus);

            return response()->json([
                'message' => 'Product status deleted successfully',
            ]);
        } catch (QueryException $e) {
            Log::error('Product status deletion failed: '.$e->getMessage());

            return response()->json([
                'error' => 'Database error occurred while deleting product status. Please try again.',
            ], 500);
        } catch (Throwable $e) {
            Log::emergency(
                'Unexpected error in product status deletion: '.$e->getMessage(),
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
            $this->productStatusService->restore((int) $id);

            return response()->json([
                'message' => 'Product status restored successfully',
            ]);
        } catch (QueryException $e) {
            Log::error('Product status restoration failed: '.$e->getMessage());
        } catch (Throwable $e) {
            Log::emergency(
                'Unexpected error in product status restoration: '.$e->getMessage(),
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
