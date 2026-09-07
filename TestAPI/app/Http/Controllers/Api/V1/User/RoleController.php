<?php

namespace App\Http\Controllers\Api\V1\User;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\User\RoleRequest;
use App\Http\Resources\Api\V1\User\RoleCollection;
use App\Http\Resources\Api\V1\User\RoleResource;
use App\Models\User\Role;
use App\Services\Api\V1\User\RoleService;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Illuminate\Support\Facades\Log;
use RuntimeException;
use Throwable;

class RoleController extends Controller implements HasMiddleware
{
    private RoleService $roleService;

    public function __construct(RoleService $roleService)
    {
        $this->roleService = $roleService;
    }

    /**
     * @return array<int, Middleware>
     */
    public static function middleware(): array
    {
        return [
            new Middleware('permission:roles.viewAny', only: ['index']),
            new Middleware('permission:roles.view', only: ['show']),
            new Middleware('permission:roles.create', only: ['store']),
            new Middleware(
                'permission:roles.update',
                only: ['update', 'syncPermissions']
            ),
            new Middleware('permission:roles.delete', only: ['destroy']),
        ];
    }

    public function index(Request $request)
    {
        try {
            $roles = $this->roleService->getAll($request->query());

            return new RoleCollection($roles);
        } catch (Throwable $e) {
            Log::emergency('Error fetching roles: '.$e->getMessage(), [
                'exception' => get_class($e),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'error' => 'Failed to fetch roles. Please try again.',
            ], 500);
        }
    }

    public function store(RoleRequest $request)
    {
        $validated = $request->validated();

        try {
            $role = $this->roleService->create($validated);

            return response()->json([
                'message' => 'Role created successfully',
                'role' => new RoleResource($role),
            ], 201);
        } catch (QueryException $e) {
            Log::error(
                'Role creation failed: '.$e->getMessage(),
                ['validated' => $validated]
            );

            return response()->json([
                'error' => 'Database error occurred while creating role. Please try again.',
            ], 500);
        } catch (Throwable $e) {
            Log::emergency('Unexpected error in role creation: '.$e->getMessage(), [
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

    public function show(Role $role)
    {
        return new RoleResource($role->load('permissions'));
    }

    public function update(RoleRequest $request, Role $role)
    {
        $validated = $request->validated();

        try {
            $this->roleService->update($role, $validated);

            return response()->json([
                'message' => 'Role updated successfully',
                'role' => new RoleResource($role->refresh()->load('permissions')),
            ], 200);
        } catch (QueryException $e) {
            // Must precede RuntimeException: QueryException extends it, so the
            // broader catch would otherwise make this branch unreachable.
            Log::error(
                'Role update failed: '.$e->getMessage(),
                ['validated' => $validated]
            );

            return response()->json([
                'error' => 'Database error occurred while updating role. Please try again.',
            ], 500);
        } catch (RuntimeException $e) {
            return response()->json(['error' => $e->getMessage()], 422);
        } catch (Throwable $e) {
            Log::emergency('Unexpected error in role update: '.$e->getMessage(), [
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
     * Replace a role's permission set — the write behind the UI permission matrix.
     */
    public function syncPermissions(RoleRequest $request, Role $role)
    {
        try {
            $updated = $this->roleService->syncPermissions(
                $role,
                $request->validated('permissions') ?? []
            );

            return response()->json([
                'message' => 'Role permissions updated successfully',
                'role' => new RoleResource($updated),
            ]);
        } catch (RuntimeException $e) {
            return response()->json(['error' => $e->getMessage()], 422);
        } catch (Throwable $e) {
            Log::emergency(
                'Unexpected error syncing role permissions: '.$e->getMessage(),
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

    public function destroy(Role $role)
    {
        try {
            $this->roleService->delete($role);

            return response()->json([
                'message' => 'Role deleted successfully',
            ]);
        } catch (RuntimeException $e) {
            return response()->json(['error' => $e->getMessage()], 422);
        } catch (Throwable $e) {
            Log::emergency('Unexpected error in role deletion: '.$e->getMessage(), [
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
}
