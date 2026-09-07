<?php

namespace App\Http\Controllers\Api\V1\User;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\User\UserStatusRequest;
use App\Http\Resources\Api\V1\User\UserStatusCollection;
use App\Http\Resources\Api\V1\User\UserStatusResource;
use App\Models\User\UserStatus;
use App\Services\Api\V1\User\UserStatusService;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Illuminate\Support\Facades\Log;
use Throwable;

class UserStatusController extends Controller implements HasMiddleware
{
    private UserStatusService $userStatusService;

    public function __construct(UserStatusService $userStatusService)
    {
        $this->userStatusService = $userStatusService;
    }

    /**
     * Permission gate for each action, enforced by spatie's middleware.
     *
     * @return array<int, Middleware>
     */
    public static function middleware(): array
    {
        return [
            new Middleware('permission:user-statuses.viewAny', only: ['index']),
            new Middleware('permission:user-statuses.view', only: ['show']),
            new Middleware('permission:user-statuses.create', only: ['store']),
            new Middleware('permission:user-statuses.update', only: ['update']),
            new Middleware('permission:user-statuses.delete', only: ['destroy']),
            new Middleware('permission:user-statuses.restore', only: ['restore']),
        ];
    }

    public function index(Request $request)
    {
        try {
            $records = $this->userStatusService->getAll($request->query());

            return new UserStatusCollection($records);
        } catch (Throwable $e) {
            Log::emergency('Error fetching user statuses: '.$e->getMessage(), [
                'exception' => get_class($e),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'error' => 'Failed to fetch user statuses. Please try again.',
            ], 500);
        }
    }

    public function store(UserStatusRequest $request)
    {
        $validated = $request->validated();

        try {
            $userStatus = $this->userStatusService->create($validated);

            return response()->json([
                'message' => 'User status created successfully',
                'user_status' => new UserStatusResource($userStatus),
            ], 201);
        } catch (QueryException $e) {
            Log::error(
                'User status creation failed: '.$e->getMessage(),
                ['validated' => $validated]
            );

            return response()->json([
                'error' => 'Database error occurred while creating user status. Please try again.',
            ], 500);
        } catch (Throwable $e) {
            Log::emergency(
                'Unexpected error in user status creation: '.$e->getMessage(),
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

    public function show(UserStatus $userStatus)
    {
        return new UserStatusResource($userStatus);
    }

    public function update(UserStatusRequest $request, UserStatus $userStatus)
    {
        $validated = $request->validated();

        try {
            $this->userStatusService->update($userStatus, $validated);

            return response()->json([
                'message' => 'User status updated successfully',
                'user_status' => new UserStatusResource($userStatus->refresh()),
            ], 200);
        } catch (QueryException $e) {
            Log::error(
                'User status update failed: '.$e->getMessage(),
                ['validated' => $validated]
            );

            return response()->json([
                'error' => 'Database error occurred while updating user status. Please try again.',
            ], 500);
        } catch (Throwable $e) {
            Log::emergency(
                'Unexpected error in user status update: '.$e->getMessage(),
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

    public function destroy(UserStatus $userStatus)
    {
        try {
            $this->userStatusService->delete($userStatus);

            return response()->json([
                'message' => 'User status deleted successfully',
            ]);
        } catch (QueryException $e) {
            Log::error('User status deletion failed: '.$e->getMessage());

            return response()->json([
                'error' => 'Database error occurred while deleting user status. Please try again.',
            ], 500);
        } catch (Throwable $e) {
            Log::emergency(
                'Unexpected error in user status deletion: '.$e->getMessage(),
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
            $this->userStatusService->restore((int) $id);

            return response()->json([
                'message' => 'User status restored successfully',
            ]);
        } catch (QueryException $e) {
            Log::error('User status restoration failed: '.$e->getMessage());
        } catch (Throwable $e) {
            Log::emergency(
                'Unexpected error in user status restoration: '.$e->getMessage(),
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
