<?php

namespace App\Http\Controllers\Api\V1\Audit;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\Audit\ActivityLogCollection;
use App\Http\Resources\Api\V1\Audit\ActivityLogResource;
use App\Models\Audit\ActivityLog;
use App\Services\Api\V1\Audit\ActivityLogService;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Read-only access to the audit trail.
 *
 * There is deliberately no store/update/destroy: the log is append-only and
 * the API must not offer a way to rewrite history.
 */
class ActivityLogController extends Controller implements HasMiddleware
{
    private ActivityLogService $activityLogService;

    public function __construct(ActivityLogService $activityLogService)
    {
        $this->activityLogService = $activityLogService;
    }

    public static function middleware(): array
    {
        return [
            new Middleware('permission:activity-logs.viewAny', only: ['index']),
            new Middleware('permission:activity-logs.view', only: ['show']),
        ];
    }

    public function index(Request $request)
    {
        try {
            $logs = $this->activityLogService->getAll($request->query());

            return new ActivityLogCollection($logs);
        } catch (Throwable $e) {
            Log::emergency('Error fetching activity logs: '.$e->getMessage(), [
                'exception' => get_class($e),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json(
                ['error' => 'Failed to fetch activity logs. Please try again.'],
                500
            );
        }
    }

    public function show(ActivityLog $activityLog)
    {
        return new ActivityLogResource($activityLog->load('causer'));
    }
}
