<?php

namespace App\Http\Controllers\Api\V1\User;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\User\UserRequest;
use App\Http\Resources\Api\V1\User\UserCollection;
use App\Http\Resources\Api\V1\User\UserResource;
use App\Models\User\User;
use App\Services\Api\V1\User\UserService;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Illuminate\Support\Facades\Log;
use Throwable;

class UserController extends Controller implements HasMiddleware
{
    private UserService $userService;

    public function __construct(UserService $userService)
    {
        $this->userService = $userService;
    }

    /**
     * @return array<int, Middleware>
     */
    public static function middleware(): array
    {
        return [
            new Middleware('permission:users.viewAny', only: ['index']),
            new Middleware('permission:users.view', only: ['show']),
            new Middleware('permission:users.create', only: ['store']),
            new Middleware('permission:users.update', only: ['update']),
            new Middleware('permission:users.delete', only: ['destroy']),
            new Middleware('permission:users.restore', only: ['restore']),
            // Changing someone's roles is a role-management action.
            new Middleware('permission:roles.update', only: ['syncRoles']),
        ];
    }

    public function index(Request $request)
    {
        try {
            $users = $this->userService->getAll($request->query());

            return new UserCollection($users);
        } catch (Throwable $e) {
            Log::emergency('Error fetching users: '.$e->getMessage(), [
                'exception' => get_class($e),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'error' => 'Failed to fetch users. Please try again.',
            ], 500);
        }
    }

    public function store(UserRequest $request)
    {
        $validated = $request->validated();

        if ($request->hasFile('avatar')) {
            $validated['avatar'] = $request->file('avatar');
        }

        try {
            $user = $this->userService->create($validated);

            return response()->json([
                'message' => 'User created successfully',
                'user' => new UserResource($user),
            ], 201);
        } catch (QueryException $e) {
            Log::error(
                'User creation failed: '.$e->getMessage(),
                ['validated' => $request->safe()->except(['password', 'avatar'])]
            );

            return response()->json([
                'error' => 'Database error occurred while creating user. Please try again.',
            ], 500);
        } catch (Throwable $e) {
            Log::emergency('Unexpected error in user creation: '.$e->getMessage(), [
                'exception' => get_class($e),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'error' => 'An unexpected error occurred. Please contact support.',
            ], 500);
        }
    }

    public function show(User $user)
    {
        return new UserResource(
            $user->load(['userStatus', 'gender', 'roles', 'identityDetail'])
        );
    }

    public function update(UserRequest $request, User $user)
    {
        $validated = $request->validated();

        if ($request->hasFile('avatar')) {
            $validated['avatar'] = $request->file('avatar');
        }

        try {
            $this->userService->update($user, $validated);

            return response()->json([
                'message' => 'User updated successfully',
                'user' => new UserResource(
                    $user->refresh()->load(['userStatus', 'gender', 'roles'])
                ),
            ], 200);
        } catch (QueryException $e) {
            Log::error(
                'User update failed: '.$e->getMessage(),
                ['validated' => $request->safe()->except(['password', 'avatar'])]
            );

            return response()->json([
                'error' => 'Database error occurred while updating user. Please try again.',
            ], 500);
        } catch (Throwable $e) {
            Log::emergency('Unexpected error in user update: '.$e->getMessage(), [
                'exception' => get_class($e),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'error' => 'An unexpected error occurred. Please contact support.',
            ], 500);
        }
    }

    /**
     * Replace a user's role assignments — the write behind the UI access screen.
     */
    public function syncRoles(UserRequest $request, User $user)
    {
        try {
            $updated = $this->userService->syncRoles(
                $user,
                $request->validated('roles') ?? []
            );

            return response()->json([
                'message' => 'User roles updated successfully',
                'user' => new UserResource($updated),
            ]);
        } catch (Throwable $e) {
            Log::emergency('Unexpected error syncing user roles: '.$e->getMessage(), [
                'exception' => get_class($e),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'error' => 'An unexpected error occurred. Please contact support.',
            ], 500);
        }
    }

    public function destroy(User $user)
    {
        try {
            $this->userService->delete($user);

            return response()->json([
                'message' => 'User deleted successfully',
            ]);
        } catch (QueryException $e) {
            Log::error('User deletion failed: '.$e->getMessage());

            return response()->json([
                'error' => 'Database error occurred while deleting user. Please try again.',
            ], 500);
        } catch (Throwable $e) {
            Log::emergency('Unexpected error in user deletion: '.$e->getMessage(), [
                'exception' => get_class($e),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'error' => 'An unexpected error occurred. Please contact support.',
            ], 500);
        }
    }

    public function restore($id)
    {
        try {
            $this->userService->restore((int) $id);

            return response()->json([
                'message' => 'User restored successfully',
            ]);
        } catch (QueryException $e) {
            Log::error('User restoration failed: '.$e->getMessage());
        } catch (Throwable $e) {
            Log::emergency('Unexpected error in user restoration: '.$e->getMessage(), [
                'exception' => get_class($e),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);
        }

        return response()->json([
            'error' => 'An unexpected error occurred. Please contact support.',
        ], 500);
    }
}
