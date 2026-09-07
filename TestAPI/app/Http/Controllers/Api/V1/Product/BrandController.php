<?php

namespace App\Http\Controllers\Api\V1\Product;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Product\BrandRequest;
use App\Http\Resources\Api\V1\Product\BrandCollection;
use App\Http\Resources\Api\V1\Product\BrandResource;
use App\Models\Product\Brand;
use App\Services\Api\V1\Product\BrandService;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Illuminate\Support\Facades\Log;
use Throwable;

class BrandController extends Controller implements HasMiddleware
{
    private BrandService $brandService;

    public function __construct(BrandService $brandService)
    {
        $this->brandService = $brandService;
    }

    /**
     * Permission gate for each action, enforced by spatie's middleware.
     *
     * @return array<int, Middleware>
     */
    public static function middleware(): array
    {
        return [
            new Middleware('permission:brands.viewAny', only: ['index']),
            new Middleware('permission:brands.view', only: ['show']),
            new Middleware('permission:brands.create', only: ['store']),
            new Middleware('permission:brands.update', only: ['update']),
            new Middleware('permission:brands.delete', only: ['destroy']),
            new Middleware('permission:brands.restore', only: ['restore']),
        ];
    }

    public function index(Request $request)
    {
        try {
            $records = $this->brandService->getAll($request->query());

            return new BrandCollection($records);
        } catch (Throwable $e) {
            Log::emergency('Error fetching brands: '.$e->getMessage(), [
                'exception' => get_class($e),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'error' => 'Failed to fetch brands. Please try again.',
            ], 500);
        }
    }

    public function store(BrandRequest $request)
    {
        $validated = $request->validated();

        try {
            $brand = $this->brandService->create($validated);

            return response()->json([
                'message' => 'Brand created successfully',
                'brand' => new BrandResource($brand),
            ], 201);
        } catch (QueryException $e) {
            Log::error(
                'Brand creation failed: '.$e->getMessage(),
                ['validated' => $validated]
            );

            return response()->json([
                'error' => 'Database error occurred while creating brand. Please try again.',
            ], 500);
        } catch (Throwable $e) {
            Log::emergency(
                'Unexpected error in brand creation: '.$e->getMessage(),
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

    public function show(Brand $brand)
    {
        return new BrandResource($brand);
    }

    public function update(BrandRequest $request, Brand $brand)
    {
        $validated = $request->validated();

        try {
            $this->brandService->update($brand, $validated);

            return response()->json([
                'message' => 'Brand updated successfully',
                'brand' => new BrandResource($brand->refresh()),
            ], 200);
        } catch (QueryException $e) {
            Log::error(
                'Brand update failed: '.$e->getMessage(),
                ['validated' => $validated]
            );

            return response()->json([
                'error' => 'Database error occurred while updating brand. Please try again.',
            ], 500);
        } catch (Throwable $e) {
            Log::emergency(
                'Unexpected error in brand update: '.$e->getMessage(),
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

    public function destroy(Brand $brand)
    {
        try {
            $this->brandService->delete($brand);

            return response()->json([
                'message' => 'Brand deleted successfully',
            ]);
        } catch (QueryException $e) {
            Log::error('Brand deletion failed: '.$e->getMessage());

            return response()->json([
                'error' => 'Database error occurred while deleting brand. Please try again.',
            ], 500);
        } catch (Throwable $e) {
            Log::emergency(
                'Unexpected error in brand deletion: '.$e->getMessage(),
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
            $this->brandService->restore((int) $id);

            return response()->json([
                'message' => 'Brand restored successfully',
            ]);
        } catch (QueryException $e) {
            Log::error('Brand restoration failed: '.$e->getMessage());
        } catch (Throwable $e) {
            Log::emergency(
                'Unexpected error in brand restoration: '.$e->getMessage(),
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
