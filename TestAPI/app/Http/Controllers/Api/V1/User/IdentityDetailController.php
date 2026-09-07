<?php

namespace App\Http\Controllers\Api\V1\User;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\User\IdentityDetailRequest;
use App\Http\Resources\Api\V1\User\IdentityDetailCollection;
use App\Http\Resources\Api\V1\User\IdentityDetailResource;
use App\Models\User\IdentityDetail;
use App\Services\Api\V1\User\IdentityDetailService;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Illuminate\Support\Facades\Log;
use Throwable;

class IdentityDetailController extends Controller implements HasMiddleware
{
    private IdentityDetailService $identityDetailService;

    public function __construct(IdentityDetailService $identityDetailService)
    {
        $this->identityDetailService = $identityDetailService;
    }

    /**
     * Permission gate for each action, enforced by spatie's middleware.
     *
     * @return array<int, Middleware>
     */
    public static function middleware(): array
    {
        return [
            new Middleware('permission:identity-details.viewAny', only: ['index']),
            new Middleware('permission:identity-details.view', only: ['show']),
            new Middleware('permission:identity-details.create', only: ['store']),
            new Middleware('permission:identity-details.update', only: ['update']),
            new Middleware('permission:identity-details.delete', only: ['destroy']),
            new Middleware('permission:identity-details.restore', only: ['restore']),
        ];
    }

    public function index(Request $request)
    {
        try {
            $records = $this->identityDetailService->getAll($request->query());

            return new IdentityDetailCollection($records);
        } catch (Throwable $e) {
            Log::emergency('Error fetching identity details: '.$e->getMessage(), [
                'exception' => get_class($e),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'error' => 'Failed to fetch identity details. Please try again.',
            ], 500);
        }
    }

    public function store(IdentityDetailRequest $request)
    {
        $validated = $request->validated();

        try {
            $identityDetail = $this->identityDetailService->create($validated);

            return response()->json([
                'message' => 'Identity detail created successfully',
                'identity_detail' => new IdentityDetailResource($identityDetail),
            ], 201);
        } catch (QueryException $e) {
            Log::error(
                'Identity detail creation failed: '.$e->getMessage(),
                ['validated' => $validated]
            );

            return response()->json([
                'error' => 'Database error occurred while creating identity detail. Please try again.',
            ], 500);
        } catch (Throwable $e) {
            Log::emergency(
                'Unexpected error in identity detail creation: '.$e->getMessage(),
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

    public function show(IdentityDetail $identityDetail)
    {
        return new IdentityDetailResource($identityDetail);
    }

    public function update(IdentityDetailRequest $request, IdentityDetail $identityDetail)
    {
        $validated = $request->validated();

        try {
            $this->identityDetailService->update($identityDetail, $validated);

            return response()->json([
                'message' => 'Identity detail updated successfully',
                'identity_detail' => new IdentityDetailResource($identityDetail->refresh()),
            ], 200);
        } catch (QueryException $e) {
            Log::error(
                'Identity detail update failed: '.$e->getMessage(),
                ['validated' => $validated]
            );

            return response()->json([
                'error' => 'Database error occurred while updating identity detail. Please try again.',
            ], 500);
        } catch (Throwable $e) {
            Log::emergency(
                'Unexpected error in identity detail update: '.$e->getMessage(),
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

    public function destroy(IdentityDetail $identityDetail)
    {
        try {
            $this->identityDetailService->delete($identityDetail);

            return response()->json([
                'message' => 'Identity detail deleted successfully',
            ]);
        } catch (QueryException $e) {
            Log::error('Identity detail deletion failed: '.$e->getMessage());

            return response()->json([
                'error' => 'Database error occurred while deleting identity detail. Please try again.',
            ], 500);
        } catch (Throwable $e) {
            Log::emergency(
                'Unexpected error in identity detail deletion: '.$e->getMessage(),
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
            $this->identityDetailService->restore((int) $id);

            return response()->json([
                'message' => 'Identity detail restored successfully',
            ]);
        } catch (QueryException $e) {
            Log::error('Identity detail restoration failed: '.$e->getMessage());
        } catch (Throwable $e) {
            Log::emergency(
                'Unexpected error in identity detail restoration: '.$e->getMessage(),
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
