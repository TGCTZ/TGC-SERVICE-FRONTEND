<?php

namespace App\Http\Controllers\Api\V1\User;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\User\PermissionCollection;
use App\Http\Resources\Api\V1\User\PermissionResource;
use App\Models\User\Permission;
use App\Services\Api\V1\User\PermissionService;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Read-only. Permissions are code-defined and seeded; roles are the layer the
 * UI edits.
 */
class PermissionController extends Controller implements HasMiddleware
{
    private PermissionService $permissionService;

    public function __construct(PermissionService $permissionService)
    {
        $this->permissionService = $permissionService;
    }

    /**
     * @return array<int, Middleware>
     */
    public static function middleware(): array
    {
        return [
            new Middleware('permission:permissions.viewAny', only: ['index', 'grouped']),
            new Middleware('permission:permissions.view', only: ['show']),
        ];
    }

    public function index(Request $request)
    {
        try {
            $permissions = $this->permissionService->getAll($request->query());

            return new PermissionCollection($permissions);
        } catch (Throwable $e) {
            Log::emergency('Error fetching permissions: '.$e->getMessage(), [
                'exception' => get_class($e),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'error' => 'Failed to fetch permissions. Please try again.',
            ], 500);
        }
    }

    /**
     * Permissions grouped by resource, so the UI can render the matrix directly.
     */
    public function grouped()
    {
        try {
            return response()->json([
                'permissions' => $this->permissionService->grouped(),
            ]);
        } catch (Throwable $e) {
            Log::emergency('Error grouping permissions: '.$e->getMessage(), [
                'exception' => get_class($e),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'error' => 'Failed to fetch permissions. Please try again.',
            ], 500);
        }
    }

    public function show(Permission $permission)
    {
        return new PermissionResource($permission);
    }
}
