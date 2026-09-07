<?php

namespace App\Http\Controllers\Api\V1\User;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\User\GenderRequest;
use App\Http\Resources\Api\V1\User\GenderCollection;
use App\Http\Resources\Api\V1\User\GenderResource;
use App\Models\User\Gender;
use App\Services\Api\V1\User\GenderService;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Illuminate\Support\Facades\Log;
use Throwable;

class GenderController extends Controller implements HasMiddleware
{
    private GenderService $genderService;

    public function __construct(GenderService $genderService)
    {
        $this->genderService = $genderService;
    }

    /**
     * Permission gate for each action, enforced by spatie's middleware.
     *
     * @return array<int, Middleware>
     */
    public static function middleware(): array
    {
        return [
            new Middleware('permission:genders.viewAny', only: ['index']),
            new Middleware('permission:genders.view', only: ['show']),
            new Middleware('permission:genders.create', only: ['store']),
            new Middleware('permission:genders.update', only: ['update']),
            new Middleware('permission:genders.delete', only: ['destroy']),
            new Middleware('permission:genders.restore', only: ['restore']),
        ];
    }

    public function index(Request $request)
    {
        try {
            $records = $this->genderService->getAll($request->query());

            return new GenderCollection($records);
        } catch (Throwable $e) {
            Log::emergency('Error fetching genders: '.$e->getMessage(), [
                'exception' => get_class($e),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'error' => 'Failed to fetch genders. Please try again.',
            ], 500);
        }
    }

    public function store(GenderRequest $request)
    {
        $validated = $request->validated();

        try {
            $gender = $this->genderService->create($validated);

            return response()->json([
                'message' => 'Gender created successfully',
                'gender' => new GenderResource($gender),
            ], 201);
        } catch (QueryException $e) {
            Log::error(
                'Gender creation failed: '.$e->getMessage(),
                ['validated' => $validated]
            );

            return response()->json([
                'error' => 'Database error occurred while creating gender. Please try again.',
            ], 500);
        } catch (Throwable $e) {
            Log::emergency(
                'Unexpected error in gender creation: '.$e->getMessage(),
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

    public function show(Gender $gender)
    {
        return new GenderResource($gender);
    }

    public function update(GenderRequest $request, Gender $gender)
    {
        $validated = $request->validated();

        try {
            $this->genderService->update($gender, $validated);

            return response()->json([
                'message' => 'Gender updated successfully',
                'gender' => new GenderResource($gender->refresh()),
            ], 200);
        } catch (QueryException $e) {
            Log::error(
                'Gender update failed: '.$e->getMessage(),
                ['validated' => $validated]
            );

            return response()->json([
                'error' => 'Database error occurred while updating gender. Please try again.',
            ], 500);
        } catch (Throwable $e) {
            Log::emergency(
                'Unexpected error in gender update: '.$e->getMessage(),
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

    public function destroy(Gender $gender)
    {
        try {
            $this->genderService->delete($gender);

            return response()->json([
                'message' => 'Gender deleted successfully',
            ]);
        } catch (QueryException $e) {
            Log::error('Gender deletion failed: '.$e->getMessage());

            return response()->json([
                'error' => 'Database error occurred while deleting gender. Please try again.',
            ], 500);
        } catch (Throwable $e) {
            Log::emergency(
                'Unexpected error in gender deletion: '.$e->getMessage(),
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
            $this->genderService->restore((int) $id);

            return response()->json([
                'message' => 'Gender restored successfully',
            ]);
        } catch (QueryException $e) {
            Log::error('Gender restoration failed: '.$e->getMessage());
        } catch (Throwable $e) {
            Log::emergency(
                'Unexpected error in gender restoration: '.$e->getMessage(),
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
