<?php

namespace App\Http\Controllers\Api\V1\System;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\System\SystemLogCollection;
use App\Services\Api\V1\System\SystemLogService;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Read-only access to the application's own log files.
 *
 * There is no store/update/destroy: these are files the framework writes, and
 * an endpoint that could edit or clear them would destroy the very evidence it
 * exists to surface.
 */
class SystemLogController extends Controller implements HasMiddleware
{
    private SystemLogService $systemLogService;

    public function __construct(SystemLogService $systemLogService)
    {
        $this->systemLogService = $systemLogService;
    }

    public static function middleware(): array
    {
        return [
            new Middleware('permission:system-logs.viewAny', only: ['index', 'levels']),
        ];
    }

    public function index(Request $request)
    {
        try {
            $logs = $this->systemLogService->getAll($request->query());

            return new SystemLogCollection($logs);
        } catch (Throwable $e) {
            // Logging a failure to read the logs is circular but still useful:
            // the next successful read will surface this entry.
            Log::emergency('Error reading system logs: '.$e->getMessage(), [
                'exception' => get_class($e),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json(
                ['error' => 'Failed to read system logs. Please try again.'],
                500
            );
        }
    }

    /** Distinct levels present in the current files, for the UI filter. */
    public function levels()
    {
        try {
            return response()->json(['levels' => $this->systemLogService->levels()]);
        } catch (Throwable $e) {
            Log::emergency('Error reading system log levels: '.$e->getMessage(), [
                'exception' => get_class($e),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);

            return response()->json(['levels' => []]);
        }
    }
}
