<?php

namespace App\Http\Controllers\Api\V1\Product;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Product\UnitOfMeasureRequest;
use App\Http\Resources\Api\V1\Product\UnitOfMeasureCollection;
use App\Http\Resources\Api\V1\Product\UnitOfMeasureResource;
use App\Models\Product\UnitOfMeasure;
use App\Services\Api\V1\Product\UnitOfMeasureService;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Illuminate\Support\Facades\Log;
use Throwable;

class UnitOfMeasureController extends Controller implements HasMiddleware
{
    private UnitOfMeasureService $unitOfMeasureService;

    public function __construct(UnitOfMeasureService $unitOfMeasureService)
    {
        $this->unitOfMeasureService = $unitOfMeasureService;
    }

    /**
     * Permission gate for each action, enforced by spatie's middleware.
     *
     * @return array<int, Middleware>
     */
    public static function middleware(): array
    {
        return [
            new Middleware('permission:unit-of-measures.viewAny', only: ['index']),
            new Middleware('permission:unit-of-measures.view', only: ['show']),
            new Middleware('permission:unit-of-measures.create', only: ['store']),
            new Middleware('permission:unit-of-measures.update', only: ['update']),
            new Middleware('permission:unit-of-measures.delete', only: ['destroy']),
            new Middleware('permission:unit-of-measures.restore', only: ['restore']),
        ];
    }

    public function index(Request $request)
    {
        try {
            $records = $this->unitOfMeasureService->getAll($request->query());

            return new UnitOfMeasureCollection($records);
        } catch (Throwable $e) {
            Log::emergency('Error fetching units of measure: '.$e->getMessage(), [
                'exception' => get_class($e),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'error' => 'Failed to fetch units of measure. Please try again.',
            ], 500);
        }
    }

    public function store(UnitOfMeasureRequest $request)
    {
        $validated = $request->validated();

        try {
            $unitOfMeasure = $this->unitOfMeasureService->create($validated);

            return response()->json([
                'message' => 'Unit of measure created successfully',
                'unit_of_measure' => new UnitOfMeasureResource($unitOfMeasure),
            ], 201);
        } catch (QueryException $e) {
            Log::error(
                'Unit of measure creation failed: '.$e->getMessage(),
                ['validated' => $validated]
            );

            return response()->json([
                'error' => 'Database error occurred while creating unit of measure. Please try again.',
            ], 500);
        } catch (Throwable $e) {
            Log::emergency(
                'Unexpected error in unit of measure creation: '.$e->getMessage(),
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

    public function show(UnitOfMeasure $unitOfMeasure)
    {
        return new UnitOfMeasureResource($unitOfMeasure);
    }

    public function update(UnitOfMeasureRequest $request, UnitOfMeasure $unitOfMeasure)
    {
        $validated = $request->validated();

        try {
            $this->unitOfMeasureService->update($unitOfMeasure, $validated);

            return response()->json([
                'message' => 'Unit of measure updated successfully',
                'unit_of_measure' => new UnitOfMeasureResource($unitOfMeasure->refresh()),
            ], 200);
        } catch (QueryException $e) {
            Log::error(
                'Unit of measure update failed: '.$e->getMessage(),
                ['validated' => $validated]
            );

            return response()->json([
                'error' => 'Database error occurred while updating unit of measure. Please try again.',
            ], 500);
        } catch (Throwable $e) {
            Log::emergency(
                'Unexpected error in unit of measure update: '.$e->getMessage(),
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

    public function destroy(UnitOfMeasure $unitOfMeasure)
    {
        try {
            $this->unitOfMeasureService->delete($unitOfMeasure);

            return response()->json([
                'message' => 'Unit of measure deleted successfully',
            ]);
        } catch (QueryException $e) {
            Log::error('Unit of measure deletion failed: '.$e->getMessage());

            return response()->json([
                'error' => 'Database error occurred while deleting unit of measure. Please try again.',
            ], 500);
        } catch (Throwable $e) {
            Log::emergency(
                'Unexpected error in unit of measure deletion: '.$e->getMessage(),
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
            $this->unitOfMeasureService->restore((int) $id);

            return response()->json([
                'message' => 'Unit of measure restored successfully',
            ]);
        } catch (QueryException $e) {
            Log::error('Unit of measure restoration failed: '.$e->getMessage());
        } catch (Throwable $e) {
            Log::emergency(
                'Unexpected error in unit of measure restoration: '.$e->getMessage(),
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
