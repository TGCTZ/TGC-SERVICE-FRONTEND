<?php

use App\Http\Controllers\Api\V1\Audit\ActivityLogController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->middleware('auth:sanctum')->group(function () {
    // Read-only by design: the audit trail is append-only.
    Route::get('activity-logs', [ActivityLogController::class, 'index'])
        ->name('activity-logs.index');
    Route::get('activity-logs/{activityLog}', [ActivityLogController::class, 'show'])
        ->name('activity-logs.show');
});
